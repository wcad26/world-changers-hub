-- Make certificate-templates bucket public so templates are accessible
update storage.buckets
set public = true
where id = 'certificate-templates';

-- Add RLS policy to allow anyone to read certificate template files
create policy "Public read for certificate templates"
on storage.objects
for select
using (bucket_id = 'certificate-templates');