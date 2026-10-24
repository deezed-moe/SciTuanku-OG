const json = (status, body) => ({ statusCode: status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed.' });
  const id = event.queryStringParameters?.recordId;
  if (!id || !/^\d+$/.test(id)) return json(400, { error: 'Invalid OPR record ID.' });
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supa = (process.env.SUPABASE_URL || 'https://vgmobpfpoleotewbhdte.supabase.co').replace(/\/$/, '');
  const appScriptUrl = process.env.APPS_SCRIPT_URL;
  const sharedToken = process.env.APPS_SCRIPT_SHARED_TOKEN;
  if (!key || !appScriptUrl || !sharedToken) return json(503, { error: 'OPR download is not configured.' });
  try {
    const recordUrl = new URL(supa + '/rest/v1/opr_records');
    recordUrl.searchParams.set('select', 'id,nama_warden,tarikh,drive_file_id');
    recordUrl.searchParams.set('id', 'eq.' + id);
    recordUrl.searchParams.set('limit', '1');
    const lookup = await fetch(recordUrl, { headers: { apikey: key } });
    if (!lookup.ok) throw new Error('Could not verify the OPR record.');
    const records = await lookup.json();
    if (!records.length) return json(404, { error: 'OPR not found.' });

    const response = await fetch(appScriptUrl, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'download', token: sharedToken, fileId: records[0].drive_file_id })
    });
    const result = await response.json();
    if (!response.ok || !result.ok || !result.pdfBase64) throw new Error(result.error || 'Google Drive could not return the PDF.');
    const file = Buffer.from(result.pdfBase64, 'base64');
    if (file.length > 4_400_000 || file.subarray(0, 5).toString() !== '%PDF-') throw new Error('The OPR file is invalid or too large.');
    const safe = String(records[0].nama_warden || 'Warden').normalize('NFKD').replace(/[^\p{L}\p{N}-]+/gu, '-').replace(/^-|-$/g, '').slice(0, 60) || 'Warden';
    const filename = 'OPR-' + records[0].tarikh + '-' + safe + '.pdf';
    return { statusCode: 200, isBase64Encoded: true, headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="' + filename + '"', 'Cache-Control': 'no-store' }, body: file.toString('base64') };
  } catch (error) {
    console.error(error);
    return json(500, { error: error.message || 'OPR download failed.' });
  }
};




