create table if not exists public.opr_records (id bigint generated always as identity primary key,created_at timestamptz not null default now(),nama_warden text not null,tarikh date not null,masa text,tempat text,catatan text not null,drive_file_id text not null,drive_web_view_link text,drive_folder_id text not null);
alter table public.opr_records add column if not exists masa text;
alter table public.opr_records add column if not exists tempat text;
alter table public.opr_records enable row level security;
revoke all on public.opr_records from anon, authenticated;
grant all on public.opr_records to service_role;
