import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Mail, Phone, MapPin, Calendar, Edit, Save, X, Briefcase, IdCard, Building2, Camera, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Panel } from '@/components/member/MemberUI';
import { MemberAvatar } from '@/components/member/MemberAvatar';

export default function MemberProfile() {
  const { profile, user, userRegion, memberRecord, refetchUserData } = useAuth() as any;
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState<Record<string, string>>({});
  const empty = { first_name: '', last_name: '', phone: '', address: '', occupation: '' };
  const [form, setForm] = useState(empty);

  const current = { ...(profile || {}), ...saved } as any;
  const reset = () => setForm({
    first_name: current.first_name || '', last_name: current.last_name || '', phone: current.phone || '',
    address: current.address || '', occupation: current.occupation || '',
  });
  useEffect(() => { reset(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [profile?.id]);

  const handleSave = async () => {
    if (!profile) return;
    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast({ title: 'Name required', description: 'First and last name cannot be empty.', variant: 'destructive' });
      return;
    }
    if (form.phone && form.phone.replace(/\D/g, '').length < 9) {
      toast({ title: 'Invalid phone', description: 'Phone number needs at least 9 digits.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const payload = {
      first_name: form.first_name.trim(), last_name: form.last_name.trim(), phone: form.phone.trim() || null,
      address: form.address.trim() || null, occupation: form.occupation.trim() || null,
    };
    const { data, error } = await supabase.from('profiles').update(payload).eq('id', profile.id).select('id');
    setLoading(false);
    if (error || !data?.length) {
      toast({ title: 'Could not save', description: error?.message || 'You do not have permission to update this profile.', variant: 'destructive' });
      return;
    }
    setSaved(Object.fromEntries(Object.entries(payload).map(([k, v]) => [k, v ?? ''])));
    setIsEditing(false);
    toast({ title: 'Profile updated', description: 'Your details have been saved.' });
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !profile || !user) return;
    if (!file.type.startsWith('image/')) { toast({ title: 'Not an image', description: 'Please choose a photo file.', variant: 'destructive' }); return; }
    if (file.size > 5 * 1024 * 1024) { toast({ title: 'Photo too large', description: 'Please choose a photo under 5 MB.', variant: 'destructive' }); return; }
    setUploading(true);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) { setUploading(false); toast({ title: 'Upload failed', description: upErr.message, variant: 'destructive' }); return; }
    const { data, error } = await supabase.from('profiles').update({ avatar_url: path } as any).eq('id', profile.id).select('id');
    setUploading(false);
    if (error || !data?.length) { toast({ title: 'Could not save photo', description: error?.message || 'Permission denied.', variant: 'destructive' }); return; }
    setSaved((s) => ({ ...s, avatar_url: path }));
    await refetchUserData?.();
    toast({ title: 'Photo updated', description: 'Your new profile photo is saved.' });
  };

  if (!profile) {
    return <div className="space-y-4"><Skeleton className="h-36 w-full rounded-2xl" /><Skeleton className="h-72 w-full rounded-2xl" /></div>;
  }

  const m = memberRecord as any;
  const fullName = [current.last_name, current.first_name].filter(Boolean).join(' ');
  const initials = `${(current.last_name || '').charAt(0)}${(current.first_name || '').charAt(0)}`.toUpperCase();
  const dob = current.date_of_birth ? format(new Date(current.date_of_birth), 'dd/MM/yyyy') : 'Not provided';

  const Field = ({ id, label, icon: Icon, value, multiline, readOnly }: { id?: keyof typeof form; label: string; icon: any; value: string; multiline?: boolean; readOnly?: boolean }) => (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">{label}</Label>
      {isEditing && id && !readOnly ? (
        multiline
          ? <Textarea id={id} rows={3} value={form[id]} onChange={(e) => setForm({ ...form, [id]: e.target.value })} />
          : <Input id={id} value={form[id]} onChange={(e) => setForm({ ...form, [id]: e.target.value })} />
      ) : (
        <p className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2.5 text-sm text-foreground">
          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /><span className="min-w-0 break-words">{value || 'Not provided'}</span>
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-secondary p-5 text-primary-foreground shadow-regal sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary-foreground/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
          <label className="group relative h-20 w-20 shrink-0 cursor-pointer rounded-full ring-4 ring-primary-foreground/25" title="Change profile photo">
            <MemberAvatar path={current.avatar_url} className="h-20 w-20" />
            <span className="absolute inset-0 grid place-items-center rounded-full bg-foreground/50 text-primary-foreground opacity-0 transition-opacity group-hover:opacity-100">
              {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
            </span>
            <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-primary-foreground text-primary shadow"><Camera className="h-3.5 w-3.5" /></span>
            <input type="file" accept="image/*" className="sr-only" onChange={handlePhoto} disabled={uploading} />
          </label>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-heading text-2xl font-bold">{fullName}</h2>
            <p className="text-sm text-primary-foreground/80">{userRegion?.name || 'World Changers Assembly'}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {m?.member_code && <span className="rounded-full bg-primary-foreground/15 px-3 py-1 font-mono font-semibold">{m.member_code}</span>}
              <span className="rounded-full bg-primary-foreground px-3 py-1 font-semibold capitalize text-primary">{m?.member_type || 'member'}</span>
              {m?.status && <span className="rounded-full bg-primary-foreground/15 px-3 py-1 capitalize">{m.status}</span>}
            </div>
          </div>
          {!isEditing ? (
            <Button variant="secondary" onClick={() => { reset(); setIsEditing(true); }} className="self-start sm:self-center"><Edit className="mr-2 h-4 w-4" />Edit profile</Button>
          ) : (
            <div className="flex gap-2 self-start sm:self-center">
              <Button variant="secondary" onClick={handleSave} disabled={loading}><Save className="mr-2 h-4 w-4" />{loading ? 'Saving…' : 'Save'}</Button>
              <Button variant="outline" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10" onClick={() => setIsEditing(false)} disabled={loading}><X className="mr-2 h-4 w-4" />Cancel</Button>
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel title={<span className="flex items-center gap-2"><User className="h-4 w-4 text-primary" />Personal information</span>}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="last_name" label="Last name" icon={User} value={current.last_name} />
            <Field id="first_name" label="First name" icon={User} value={current.first_name} />
            <Field label="Email" icon={Mail} value={current.email || user?.email || ''} readOnly />
            <Field id="phone" label="Phone number" icon={Phone} value={current.phone} />
            <Field id="occupation" label="Occupation" icon={Briefcase} value={current.occupation} />
            <Field label="Date of birth" icon={Calendar} value={dob} readOnly />
            <div className="sm:col-span-2"><Field id="address" label="Address" icon={MapPin} value={current.address} multiline /></div>
          </div>
          {isEditing && <p className="mt-4 text-xs text-muted-foreground">To change your email or date of birth, please contact your branch admin.</p>}
        </Panel>

        <Panel title={<span className="flex items-center gap-2"><IdCard className="h-4 w-4 text-primary" />Membership</span>}>
          <dl className="space-y-3 text-sm">
            {[
              ['Member code', m?.member_code || '—'],
              ['Branch', userRegion?.name || '—'],
              ['Type', m?.member_type || '—'],
              ['Status', m?.status || '—'],
              ['Foundation school', m?.membership_class_completed ? 'Completed' : 'Not yet'],
              ['Joined', m?.created_at ? format(new Date(m.created_at), 'dd/MM/yyyy') : '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="truncate text-right font-medium capitalize text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
            <Building2 className="h-4 w-4 shrink-0" />Need a transfer or correction? Contact your branch admin.
          </div>
          <Badge variant="outline" className="sr-only">profile</Badge>
        </Panel>
      </div>
    </div>
  );
}
