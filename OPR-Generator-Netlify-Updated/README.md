# Penjana Borang OPR Warden SMSTJ

Laman ini menjana OPR PDF, memaparkan pratonton secara langsung, dan menyediakan arkib mingguan dengan muat turun PDF dan ZIP. Tarikh dipaparkan sebagai dd/mm/yyyy. PDF disimpan ke Google Drive melalui Apps Script; metadata OPR disimpan ke Supabase melalui Netlify Functions.

## 1. Sediakan Supabase

1. Buka projek Supabase dan pergi ke **SQL Editor > New query**.
2. Salin kandungan `supabase-schema.sql`, tampal dan tekan **Run**. Pastikan jadual `opr_records` muncul dalam Table Editor.
3. Di **Settings > API Keys**, salin kunci `sb_secret_...`. Jangan letakkan kunci ini dalam fail laman atau kongsi dalam chat.

### Kemas kini untuk medan Masa dan Tempat

Jika jadual `opr_records` sudah wujud, jalankan SQL ini sekali sahaja di **SQL Editor > New query** sebelum menggunakan versi laman yang dikemas kini:

```sql
alter table public.opr_records add column if not exists masa text;
alter table public.opr_records add column if not exists tempat text;
```

Medan ini menyimpan masa dan tempat bersama rekod OPR. PDF kekal disimpan ke Google Drive.

## 2. Sediakan Apps Script

1. Cipta projek di [script.google.com](https://script.google.com).
2. Gantikan kandungan `Code.gs` dalam projek itu dengan fail `apps-script/Code.gs` daripada pakej ini.
3. Di **Project Settings > Script Properties**, tambah:
   - `ROOT_FOLDER_ID` = `1p5z9eNoWnv6qatbmrBiC4q-jNdvcNErv`
   - `SHARED_TOKEN` = token rawak panjang yang anda cipta
4. Pilih **Deploy > New deployment > Web app**. Tetapkan **Execute as** kepada akaun anda dan pilih akses yang membenarkan laman awam menghantar permintaan. Benarkan akses Drive apabila diminta.
5. Salin URL deployment yang berakhir dengan `/exec`.

Apps Script menggunakan token bersama untuk menerima permintaan hanya daripada Netlify. Jangan masukkan token itu dalam `index.html`, `app.js` atau fail frontend lain.

## 3. Tetapkan Netlify

Tambah Environment Variables pada projek Netlify. Pastikan skop **Functions** dipilih:

- `SUPABASE_SECRET_KEY` = kunci rahsia Supabase
- `APPS_SCRIPT_URL` = URL Apps Script `/exec`
- `APPS_SCRIPT_SHARED_TOKEN` = nilai yang sama dengan `SHARED_TOKEN` dalam Script Properties

`SUPABASE_URL` tidak wajib kerana URL projek sudah ditetapkan dalam fungsi; jika mahu, anda boleh menetapkannya kepada `https://vgmobpfpoleotewbhdte.supabase.co`.

## 4. Deploy

Pasang Netlify CLI dan deploy dari folder projek:

```powershell
npm install -g netlify-cli
netlify login
netlify deploy
```

Pilih atau cipta laman apabila diminta. Selepas variables di atas disimpan, deploy ke production:

```powershell
netlify deploy --prod
```

Netlify menggunakan `netlify.toml` untuk menerbitkan laman dan fungsi dalam `netlify/functions`. Perubahan pada environment variables memerlukan deployment baharu.

## 5. Semak sambungan

Hantar satu OPR dengan empat gambar. Pastikan PDF muncul dalam folder tahun/bulan di Google Drive dan satu rekod muncul dalam jadual `opr_records`. Kemudian cuba muat turun PDF dan ZIP minggu melalui arkib.

Arkib boleh dilihat oleh sesiapa yang membuka laman. Tandatangan warden dan pengetua dibuat selepas PDF dicetak. PDF maksimum 4.4 MB; kecilkan imej jika diperlukan.
