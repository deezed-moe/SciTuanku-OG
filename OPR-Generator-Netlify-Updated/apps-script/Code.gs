const MONTHS_MS = [
  'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
  'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
];

function doPost(e) {
  try {
    const props = PropertiesService.getScriptProperties();
    const expectedToken = props.getProperty('SHARED_TOKEN');
    const payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (!expectedToken || !payload.token || payload.token !== expectedToken) {
      return json({ ok: false, error: 'Unauthorized request.' });
    }

    if (payload.action === 'upload') return uploadPdf(payload, props);
    if (payload.action === 'download') return downloadPdf(payload);
    return json({ ok: false, error: 'Unknown action.' });
  } catch (err) {
    return json({ ok: false, error: String(err.message || err) });
  }
}

function uploadPdf(payload, props) {
  const warden = String(payload.warden || '').trim();
  const date = String(payload.date || '');
  const pdfBase64 = String(payload.pdfBase64 || '');
  if (!warden || warden.length > 120 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return json({ ok: false, error: 'Invalid OPR details.' });
  }
  if (!pdfBase64.startsWith('JVBERi0') || pdfBase64.length > 6000000) {
    return json({ ok: false, error: 'Invalid or oversized PDF.' });
  }

  const parts = date.split('-');
  const monthNumber = Number(parts[1]);
  if (monthNumber < 1 || monthNumber > 12) return json({ ok: false, error: 'Invalid date.' });
  const monthFolderName = parts[0] + ' - ' + MONTHS_MS[monthNumber - 1];
  const rootFolderId = props.getProperty('ROOT_FOLDER_ID');
  if (!rootFolderId) return json({ ok: false, error: 'ROOT_FOLDER_ID is not configured.' });

  const root = DriveApp.getFolderById(rootFolderId);
  const monthFolder = findOrCreateFolder(root, monthFolderName);
  const safeWarden = warden.normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'Warden';
  const filename = 'OPR-Warden-' + date + '-' + safeWarden + '.pdf';
  const bytes = Utilities.base64Decode(pdfBase64);
  const pdf = Utilities.newBlob(bytes, 'application/pdf', filename);
  const file = monthFolder.createFile(pdf);

  return json({
    ok: true,
    fileId: file.getId(),
    fileName: file.getName(),
    driveLink: file.getUrl(),
    folderId: monthFolder.getId(),
    monthFolder: monthFolderName
  });
}

function downloadPdf(payload) {
  const fileId = String(payload.fileId || '');
  if (!/^[A-Za-z0-9_-]+$/.test(fileId)) return json({ ok: false, error: 'Invalid Drive file ID.' });
  const file = DriveApp.getFileById(fileId);
  if (file.getMimeType() !== MimeType.PDF) return json({ ok: false, error: 'The Drive file is not a PDF.' });
  const bytes = file.getBlob().getBytes();
  if (bytes.length > 4400000) return json({ ok: false, error: 'The PDF exceeds the allowed size.' });
  return json({ ok: true, pdfBase64: Utilities.base64Encode(bytes) });
}

function findOrCreateFolder(parent, name) {
  const folders = parent.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : parent.createFolder(name);
}

function json(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
