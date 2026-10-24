const json=(status,body)=>({statusCode:status,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
exports.handler=async(event)=>{
  if(event.httpMethod!=='GET')return json(405,{error:'Method not allowed.'});
  const key=(process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY);
  const supa=(process.env.SUPABASE_URL||'https://vgmobpfpoleotewbhdte.supabase.co').replace(/\/$/,'');
  if(!key)return json(503,{error:'Arkib belum disediakan.'});
  try{
    const url=new URL(supa+'/rest/v1/opr_records');
    url.searchParams.set('select','id,nama_warden,tarikh,drive_file_id,created_at');
    url.searchParams.set('order','tarikh.desc,created_at.desc');
    url.searchParams.set('limit','1000');
    const response=await fetch(url,{headers:{apikey:key}});
    if(!response.ok)throw new Error('Supabase archive request failed ('+response.status+').');
    const records=await response.json();
    return json(200,{records:records.map(record=>({id:record.id,nama_warden:record.nama_warden,tarikh:record.tarikh}))});
  }catch(error){
    console.error(error);
    return json(500,{error:'Tidak dapat memuatkan arkib OPR.'});
  }
};

