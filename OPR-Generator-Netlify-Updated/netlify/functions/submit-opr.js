const crypto = require('node:crypto');
const json = (status, body) => ({ statusCode: status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed.' });
  try {
    const { warden, date, time, place, notes, pdfBase64 } = JSON.parse(event.body || '{}');
    if (typeof warden !== 'string' || !warden.trim() || warden.length > 120) return json(400, { error: 'Nama warden diperlukan (maksimum 120 aksara).' });
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date + 'T00:00:00Z')) || new Date(date + 'T00:00:00Z').toISOString().slice(0, 10) !== date) return json(400, { error: 'Tarikh tidak sah.' });
    if (typeof time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return json(400, { error: 'Masa tidak sah.' });
    if (typeof place !== 'string' || !place.trim() || place.length > 120) return json(400, { error: 'Tempat diperlukan (maksimum 120 aksara).' });
    if (typeof notes !== 'string' || !notes.trim() || notes.length > 1800) return json(400, { error: 'Catatan diperlukan (maksimum 1,800 aksara).' });
    if (typeof pdfBase64 !== 'string' || pdfBase64.length > 6_000_000) return json(413, { error: 'Saiz PDF terlalu besar. Pilih gambar lebih kecil.' });
    const pdf = Buffer.from(pdfBase64, 'base64');
    if (pdf.length < 100 || pdf.length > 4_400_000 || pdf.subarray(0, 5).toString() !== '%PDF-') return json(400, { error: 'Fail PDF tidak sah atau terlalu besar.' });

    const appScriptUrl = process.env.APPS_SCRIPT_URL;
    const sharedToken = process.env.APPS_SCRIPT_SHARED_TOKEN;
    const supa = (process.env.SUPABASE_URL || 'https://vgmobpfpoleotewbhdte.supabase.co').replace(/\/$/, '');
    const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!appScriptUrl || !sharedToken || !key) return json(503, { error: 'Pentadbir perlu melengkapkan tetapan Netlify.' });

    const driveResponse = await fetch(appScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upload', token: sharedToken, warden: warden.trim(), date, pdfBase64 })
    });
    const uploaded = await driveResponse.json();
    if (!driveResponse.ok || !uploaded.ok || !uploaded.fileId) throw new Error(uploaded.error || 'Google Drive gagal menyimpan PDF.');

    const record = {
      nama_warden: warden.trim(), tarikh: date, masa: time, tempat: place.trim(), catatan: notes.trim(),
      drive_file_id: uploaded.fileId, drive_web_view_link: uploaded.driveLink || null,
      drive_folder_id: uploaded.folderId
    };
    const saved = await fetch(supa + '/rest/v1/opr_records', {
      method: 'POST',
      headers: { apikey: key, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(record)
    });
    if (!saved.ok) throw new Error('PDF dimuat naik tetapi rekod pangkalan data gagal disimpan (' + saved.status + ').');
    return json(200, { ok: true, monthFolder: uploaded.monthFolder, driveLink: uploaded.driveLink || null });
  } catch (error) {
    console.error(error);
    return json(500, { error: error.message || 'Ralat pelayan semasa menyimpan OPR.' });
  }
};

