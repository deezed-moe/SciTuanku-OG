const form=document.querySelector('#opr-form');
const statusBox=document.querySelector('#status');
const button=document.querySelector('#submit-button');
const wardenInput=form.elements.warden;
const dateInput=form.elements.date;
const notesInput=form.elements.notes;
const customWardenInput=form.elements.customWarden;
const customWardenField=document.querySelector('#custom-warden-field');
const timeInput=form.elements.time;
const placeInput=form.elements.place;
const noNotesButton=document.querySelector('#no-notes-button');
const chosenImages=[null,null,null,null];
const imageUrls=[null,null,null,null];

function localDateValue(date){
  return String(date.getDate()).padStart(2,'0')+'/'+String(date.getMonth()+1).padStart(2,'0')+'/'+date.getFullYear();
}
function parseDmyDate(value){
  const match=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if(!match)return null;
  const day=Number(match[1]),month=Number(match[2]),year=Number(match[3]);
  const check=new Date(Date.UTC(year,month-1,day));
  if(check.getUTCFullYear()!==year||check.getUTCMonth()!==month-1||check.getUTCDate()!==day)return null;
  return year+'-'+String(month).padStart(2,'0')+'-'+String(day).padStart(2,'0');
}
if(!dateInput.value) dateInput.value=localDateValue(new Date());
if(!timeInput.value){const now=new Date();timeInput.value=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0')}
function selectedWarden(){return wardenInput.value==='LAIN'?customWardenInput.value.trim():wardenInput.value.trim()}
function updateCustomWarden(){const isCustom=wardenInput.value==='LAIN';customWardenField.hidden=!isCustom;customWardenInput.required=isCustom;if(!isCustom)customWardenInput.value='';refreshPreview()}

function refreshPreview(){
  document.querySelector('#preview-warden').textContent=selectedWarden()||'—';
  document.querySelector('#preview-date').textContent=dateInput.value.trim()||'—';
  document.querySelector('#preview-time').textContent=timeInput.value||'—';
  document.querySelector('#preview-place').textContent=placeInput.value.trim()||'—';
  document.querySelector('#preview-notes').textContent=notesInput.value.trim()||'—';
}
[wardenInput,dateInput,notesInput,timeInput,placeInput,customWardenInput].forEach(input=>{
  input.addEventListener('input',()=>{
    if(input===dateInput){
      input.setCustomValidity(input.value.trim()&&!parseDmyDate(input.value)?'Masukkan tarikh yang sah dalam format dd/mm/yyyy.':'');
    }
    refreshPreview();
  });
  input.addEventListener('change',refreshPreview);
});
wardenInput.addEventListener('change',updateCustomWarden);
noNotesButton.addEventListener('click',()=>{notesInput.value='TIADA';notesInput.dispatchEvent(new Event('input',{bubbles:true}))});
updateCustomWarden();

document.querySelectorAll('[data-photo]').forEach(input=>{
  input.addEventListener('change',()=>{
    const i=Number(input.dataset.photo);
    const file=input.files?.[0];
    const prompt=input.closest('.photo-slot').querySelector('.upload-prompt');
    const uploadPreview=input.closest('.photo-slot').querySelector('.upload-preview');
    const paperImage=document.querySelector('[data-preview-photo="'+i+'"]');
    if(imageUrls[i]) URL.revokeObjectURL(imageUrls[i]);
    imageUrls[i]=null; chosenImages[i]=null; paperImage.removeAttribute('src');
    uploadPreview.replaceChildren();
    if(!file){prompt.textContent='Pilih gambar';return}
    if(file.size>12*1024*1024){
      input.value=''; prompt.textContent='Maksimum 12 MB'; return;
    }
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)){
      input.value=''; prompt.textContent='Format tidak disokong'; return;
    }
    chosenImages[i]=file;
    imageUrls[i]=URL.createObjectURL(file);
    prompt.textContent=file.name;
    const formImage=document.createElement('img');
    formImage.src=imageUrls[i]; formImage.alt='Gambar '+(i+1)+' dipilih';
    uploadPreview.append(formImage);
    paperImage.src=imageUrls[i];
    paperImage.alt='Pratonton gambar '+(i+1);
  });
});

function readAsJpeg(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onerror=()=>reject(new Error('Tidak dapat membaca salah satu gambar.'));
    reader.onload=()=>{
      const image=new Image();
      image.onerror=()=>reject(new Error('Format gambar tidak dapat dibaca.'));
      image.onload=()=>{
        const scale=Math.min(1,1800/Math.max(image.width,image.height));
        const canvas=document.createElement('canvas');
        canvas.width=Math.round(image.width*scale);
        canvas.height=Math.round(image.height*scale);
        canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
        resolve(canvas.toDataURL('image/jpeg',.84));
      };
      image.src=reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function addImageContained(doc,data,x,y,width,height){
  const dimensions=doc.getImageProperties(data);
  const scale=Math.min(width/dimensions.width,height/dimensions.height);
  const imageWidth=dimensions.width*scale;
  const imageHeight=dimensions.height*scale;
  doc.addImage(data,'JPEG',x+(width-imageWidth)/2,y+(height-imageHeight)/2,imageWidth,imageHeight,undefined,'FAST');
}

function makePdf(values,photos){
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
  const pageWidth=210,left=12,right=198,width=right-left;
  const wine=[58,23,25],gold=[245,213,141],cream=[244,236,217],ink=[35,29,27];
  doc.setDrawColor(...ink); doc.setLineWidth(.35); doc.rect(10,10,190,277);
  doc.addImage(document.querySelector('.crest').src,'PNG',15,14,22,31,undefined,'FAST');
  doc.setTextColor(133,101,48); doc.setFont('helvetica','bold'); doc.setFontSize(8);
  doc.text('REKOD BERTUGAS  ·  WARDEN',43,22);
  doc.setTextColor(...wine); doc.setFont('times','bold'); doc.setFontSize(18);
  doc.text('OPERASI RONDAAN WARDEN',43,34);
  doc.setFont('helvetica','bold'); doc.setFontSize(11);
  doc.text('SEKOLAH MENENGAH SAINS TUANKU JAAFAR',pageWidth/2,52,{align:'center'});
  doc.setFillColor(...wine); doc.rect(left,56,width,10,'F');
  doc.setTextColor(...gold); doc.setFontSize(16); doc.text('BORANG OPR',pageWidth/2,63,{align:'center'});
  doc.setTextColor(...ink); doc.setFontSize(9);
  doc.text('LAPORAN / REKOD AKTIVITI WARDEN',pageWidth/2,73,{align:'center'});
  doc.setFillColor(...cream); doc.rect(left,78,width,7,'FD');
  doc.setTextColor(...wine); doc.setFontSize(9); doc.text('MAKLUMAT ASAS',pageWidth/2,83,{align:'center'});
  const xName=65,xSep=70,tableBottom=145;
  [85,96,105,114,123,tableBottom].forEach(y=>doc.line(left,y,right,y));
  [left,xName,xSep,right].forEach(x=>doc.line(x,85,x,tableBottom));
  doc.setTextColor(...ink); doc.setFont('helvetica','bold'); doc.setFontSize(8.5);
  doc.text('Nama Warden Bertugas',15,92); doc.text(':',67,92);
  doc.setFont('helvetica','normal');
  const nameLines=doc.splitTextToSize(values.warden,120);
  if(nameLines.length>2) throw new Error('Nama terlalu panjang untuk ruang PDF.');
  doc.text(nameLines,73,92);
  doc.setFont('helvetica','bold'); doc.text('Tarikh',15,102); doc.text(':',67,102);
  doc.setFont('helvetica','normal'); doc.text(values.date.split('-').reverse().join('/'),73,102);
  doc.setFont('helvetica','bold'); doc.text('Masa',15,111); doc.text(':',67,111);
  doc.setFont('helvetica','normal'); doc.text(values.time,73,111);
  doc.setFont('helvetica','bold'); doc.text('Tempat',15,120); doc.text(':',67,120);
  doc.setFont('helvetica','normal');
  const placeLines=doc.splitTextToSize(values.place,120);
  if(placeLines.length>1) throw new Error('Tempat terlalu panjang untuk ruang PDF.');
  doc.text(placeLines,73,120);
  doc.setFont('helvetica','bold'); doc.text('Catatan',15,130); doc.text(':',67,130);
  doc.setFont('helvetica','normal'); doc.setFontSize(8.5);
  const noteLines=doc.splitTextToSize(values.notes,120);
  if(noteLines.length>5) throw new Error('Catatan terlalu panjang untuk ruang PDF. Sila ringkaskan.');
  doc.text(noteLines,73,130,{lineHeightFactor:1.25});
  doc.setFillColor(...cream); doc.rect(left,149,width,7,'FD');
  doc.setTextColor(...wine); doc.setFont('helvetica','bold'); doc.setFontSize(9);
  doc.text('RUANG GAMBAR (4 GAMBAR)',pageWidth/2,154,{align:'center'});
  const boxes=[[16,158],[108,158],[16,200],[108,200]],boxWidth=86,boxHeight=39;
  boxes.forEach(([x,y],i)=>{
    doc.setDrawColor(95,70,58); doc.rect(x,y,boxWidth,boxHeight);
    addImageContained(doc,photos[i],x+1.5,y+1.5,boxWidth-3,boxHeight-7);
    doc.setFillColor(255,253,246); doc.rect(x+1.5,y+boxHeight-6,boxWidth-3,4.5,'F');
    doc.setTextColor(...ink); doc.setFont('helvetica','bold'); doc.setFontSize(8);
    doc.text('GAMBAR '+(i+1),x+boxWidth/2,y+boxHeight-2.7,{align:'center'});
  });
  const signY=246,colWidth=width/3,signHeight=38;
  const signTitles=['WARDEN BERTUGAS','GURU PENOLONG KANAN HAL EHWAL MURID','PENGETUA'];
  doc.setDrawColor(...ink); doc.rect(left,signY,width,signHeight);
  for(let i=0;i<3;i++){
    const x=left+i*colWidth;
    if(i>0)doc.line(x,signY,x,signY+signHeight);
    doc.setFillColor(...cream); doc.rect(x,signY,colWidth,11,'F');
    doc.setTextColor(...wine); doc.setFont('helvetica','bold'); doc.setFontSize(i===1?6.5:8);
    const titleLines=doc.splitTextToSize(signTitles[i],colWidth-4);
    doc.text(titleLines,x+colWidth/2,signY+3.3,{align:'center',lineHeightFactor:1.05});
    doc.setDrawColor(...ink); doc.line(x,signY+11,x+colWidth,signY+11);
    doc.setTextColor(...ink); doc.setFont('helvetica','normal'); doc.setFontSize(7);
    doc.text('Tandatangan: ______________',x+2,signY+17);
    doc.text('Nama: ___________________',x+2,signY+24);
    doc.text('Tarikh: __________________',x+2,signY+31);
  }
  return doc;
}


function safeFilePart(value){
  return String(value||'Warden').normalize('NFKD').replace(/[^\p{L}\p{N}-]+/gu,'-').replace(/^-|-$/g,'').slice(0,60)||'Warden';
}
function formatIsoDate(value){
  const parts=String(value).slice(0,10).split('-');
  return parts.length===3?parts[2]+'/'+parts[1]+'/'+parts[0]:String(value);
}
function mondayForIso(value){
  const date=new Date(String(value).slice(0,10)+'T00:00:00Z');
  date.setUTCDate(date.getUTCDate()-((date.getUTCDay()+6)%7));
  return date;
}
function isoUtc(date){
  return date.getUTCFullYear()+'-'+String(date.getUTCMonth()+1).padStart(2,'0')+'-'+String(date.getUTCDate()).padStart(2,'0');
}
function makeArchiveButton(label,className){
  const element=document.createElement('button');
  element.type='button'; element.className=className; element.textContent=label;
  return element;
}
async function getOprPdf(recordId){
  const response=await fetch('/.netlify/functions/download-opr?recordId='+encodeURIComponent(recordId));
  if(!response.ok){
    let message='Muat turun PDF gagal.';
    try{message=(await response.json()).error||message}catch{}
    throw new Error(message);
  }
  return response.blob();
}
async function downloadOpr(record,button){
  button.disabled=true; const original=button.textContent; button.textContent='Memuat turun…';
  try{
    const blob=await getOprPdf(record.id),url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url; link.download='OPR-'+record.tarikh+'-'+safeFilePart(record.nama_warden)+'.pdf';
    document.body.append(link); link.click(); link.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  }catch(error){archiveStatus.textContent=error.message;archiveStatus.classList.add('error')}
  finally{button.disabled=false;button.textContent=original}
}
const archiveList=document.querySelector('#archive-list');
const archiveStatus=document.querySelector('#archive-status');
async function downloadWeek(group,button){
  if(!window.JSZip){archiveStatus.textContent='Pustaka ZIP belum tersedia. Muat semula halaman dan cuba lagi.';archiveStatus.classList.add('error');return}
  button.disabled=true; const original=button.textContent; button.textContent='Menyediakan ZIP…';
  try{
    const zip=new window.JSZip();
    for(let i=0;i<group.records.length;i++){
      archiveStatus.textContent='Memuat turun PDF '+(i+1)+' daripada '+group.records.length+'…';
      const record=group.records[i],blob=await getOprPdf(record.id);
      zip.file('OPR-'+record.tarikh+'-'+safeFilePart(record.nama_warden)+'.pdf',blob);
    }
    archiveStatus.textContent='Menyediakan fail ZIP…';
    const zipBlob=await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:5}});
    const url=URL.createObjectURL(zipBlob),link=document.createElement('a');
    link.href=url; link.download='OPR-Minggu-'+group.start+'-hingga-'+group.end+'.zip';
    document.body.append(link); link.click(); link.remove(); setTimeout(()=>URL.revokeObjectURL(url),1500);
    archiveStatus.textContent=group.records.length+' PDF telah dimuat turun dalam satu fail ZIP.';
    archiveStatus.classList.remove('error');
  }catch(error){archiveStatus.textContent=error.message||'Tidak dapat menyediakan ZIP mingguan.';archiveStatus.classList.add('error')}
  finally{button.disabled=false;button.textContent=original}
}
function renderArchive(records){
  archiveList.replaceChildren();
  if(!records.length){
    const empty=document.createElement('div'); empty.className='archive-empty';
    empty.textContent='Belum ada OPR terdahulu untuk dipaparkan.';
    archiveList.append(empty); return;
  }
  const grouped=new Map();
  records.forEach(record=>{
    const start=mondayForIso(record.tarikh),startKey=isoUtc(start),end=new Date(start);
    end.setUTCDate(end.getUTCDate()+6);
    if(!grouped.has(startKey))grouped.set(startKey,{start:startKey,end:isoUtc(end),records:[]});
    grouped.get(startKey).records.push(record);
  });
  [...grouped.values()].forEach((group,index)=>{
    const section=document.createElement('section'); section.className='archive-week';
    const heading=document.createElement('div'); heading.className='week-heading';
    const titleWrap=document.createElement('div'),title=document.createElement('h3'),range=document.createElement('p');
    title.textContent='Minggu '+formatIsoDate(group.start)+' – '+formatIsoDate(group.end);
    range.textContent=group.records.length+' OPR';
    titleWrap.append(title,range);
    const zipButton=makeArchiveButton('Muat turun ZIP minggu','week-zip-button');
    zipButton.addEventListener('click',()=>downloadWeek(group,zipButton));
    heading.append(titleWrap,zipButton);
    const list=document.createElement('ul'); list.className='week-records';
    group.records.forEach(record=>{
      const item=document.createElement('li'); item.className='week-record';
      const meta=document.createElement('div'); meta.className='record-meta';
      const name=document.createElement('span'); name.className='record-name'; name.textContent=record.nama_warden||'Warden';
      const date=document.createElement('span'); date.className='record-date'; date.textContent=formatIsoDate(record.tarikh);
      meta.append(name,date);
      const download=makeArchiveButton('Muat turun PDF','download-button');
      download.addEventListener('click',()=>downloadOpr(record,download));
      item.append(meta,download); list.append(item);
    });
    section.append(heading,list); archiveList.append(section);
    if(index===0)section.classList.add('latest-week');
  });
}
async function loadArchive(){
  archiveStatus.textContent='Memuatkan arkib OPR…'; archiveStatus.classList.remove('error');
  try{
    const response=await fetch('/.netlify/functions/list-oprs');
    if(response.status===503){
      archiveStatus.textContent='Arkib akan dipaparkan selepas sambungan Supabase dan Netlify disediakan.';
      archiveList.replaceChildren(); return;
    }
    const result=await response.json();
    if(!response.ok)throw new Error(result.error||'Tidak dapat memuatkan arkib OPR.');
    renderArchive(result.records||[]);
    archiveStatus.textContent=(result.records||[]).length+' OPR dalam arkib, disusun mengikut minggu.';
  }catch(error){
    archiveStatus.textContent='Arkib tidak dapat dimuatkan. '+(error.message||'Cuba muat semula.');
    archiveStatus.classList.add('error');
  }
}
document.querySelector('#refresh-archive').addEventListener('click',loadArchive);

form.addEventListener('submit',async event=>{
  event.preventDefault();
  statusBox.textContent=''; statusBox.className='';
  if(chosenImages.some(image=>!image)){
    statusBox.textContent='Sila pilih empat gambar terlebih dahulu.';
    statusBox.className='error'; return;
  }
  button.disabled=true; button.classList.add('loading');
  let downloaded=false;
  try{
    const isoDate=parseDmyDate(dateInput.value);
    if(!isoDate) throw new Error('Masukkan tarikh yang sah dalam format dd/mm/yyyy.');
    const values={warden:selectedWarden(),date:isoDate,time:timeInput.value,place:placeInput.value.trim(),notes:notesInput.value.trim()};
    if(!values.warden)throw new Error('Pilih nama warden atau pilih LAIN dan masukkan nama.');
    if(!/^\d{2}:\d{2}$/.test(values.time))throw new Error('Pilih masa bertugas.');
    if(!values.place)throw new Error('Masukkan tempat bertugas.');
    const photos=await Promise.all(chosenImages.map(readAsJpeg));
    const pdf=makePdf(values,photos);
    const blob=pdf.output('blob');
    if(blob.size>4_400_000) throw new Error('PDF melebihi had 4.4 MB. Cuba gambar lebih kecil.');
    const safeName=values.warden.replace(/[^\p{L}\p{N}-]+/gu,'-').replace(/^-|-$/g,'');
    pdf.save('OPR-Warden-'+values.date+'-'+safeName+'.pdf');
    downloaded=true;
    statusBox.textContent='Menyimpan OPR ke rekod dan Google Drive…';
    const pdfBase64=await new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=()=>resolve(reader.result.split(',')[1]);
      reader.onerror=()=>reject(new Error('Tidak dapat menyediakan fail PDF.'));
      reader.readAsDataURL(blob);
    });
    const response=await fetch('/.netlify/functions/submit-opr',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({...values,pdfBase64})
    });
    const result=await response.json();
    if(!response.ok) throw new Error(result.error||'Tidak dapat menyimpan OPR.');
    statusBox.textContent='OPR berjaya disimpan dalam folder Google Drive: '+result.monthFolder;
    statusBox.className='success';
    await loadArchive();
  }catch(error){
    statusBox.textContent=downloaded?
      'PDF telah dimuat turun tetapi penyimpanan gagal: '+(error.message||'Sila cuba lagi.'):
      error.message||'Ralat berlaku. Sila cuba lagi.';
    statusBox.className='error';
  }finally{
    button.disabled=false; button.classList.remove('loading');
  }
});

loadArchive();
