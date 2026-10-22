import { useState } from 'react';
import { Phone, Video, MapPin, CalendarClock, CheckCircle2, ShieldCheck, Languages, ArrowLeft, ArrowRight, HeartHandshake, X, CalendarPlus, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Segmented, EmptyState } from '@/components/member/MemberUI';
import { counselors, counselingAreas, timeSlots, demoAppointments, counselingFaqs, toneVar, type Counselor } from '@/data/memberDemo';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const formats = [
  { key: 'In person', icon: MapPin, hint: 'At your branch office' },
  { key: 'Video call', icon: Video, hint: 'Google Meet link' },
  { key: 'Phone call', icon: Phone, hint: 'We call you' },
];

function nextDays(n: number) {
  const out: { label: string; day: string; month: string; date: string }[] = [];
  const d = new Date();
  for (let i = 1; out.length < n; i++) {
    const x = new Date(d.getTime() + i * 86400000);
    if (x.getDay() === 0) continue;
    out.push({ label: x.toLocaleDateString('en-GB', { weekday: 'short' }), day: String(x.getDate()), month: x.toLocaleDateString('en-GB', { month: 'short' }), date: x.toLocaleDateString('en-GB') });
  }
  return out;
}

/** "Add to Google Calendar" link for a dd/mm/yyyy date and HH:mm time (Douala time, 1 hour). */
export function googleCalendarUrl(a: { area: string; counselor: string; date: string; time: string; format: string }) {
  const [dd, mm, yyyy] = a.date.split('/');
  const [h, m] = a.time.split(':').map(Number);
  const pad = (n: number) => String(n).padStart(2, '0');
  const start = `${yyyy}${mm}${dd}T${pad(h)}${pad(m)}00`;
  const end = `${yyyy}${mm}${dd}T${pad(h + 1)}${pad(m)}00`;
  const p = new URLSearchParams({
    action: 'TEMPLATE', text: `WCA counseling · ${a.area}`, dates: `${start}/${end}`, ctz: 'Africa/Douala',
    details: `${a.format} with ${a.counselor}. Booked through the WCA member portal.`,
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

export default function MemberCounseling() {
  const [tab, setTab] = useState<'book' | 'mine' | 'help'>('book');
  const [area, setArea] = useState('all');
  const [appts, setAppts] = useState(demoAppointments);
  const [who, setWho] = useState<Counselor | null>(null);
  const [step, setStep] = useState(1);
  const [format, setFormat] = useState('In person');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [agree, setAgree] = useState(false);
  const days = nextDays(10);

  const list = counselors.filter((c) => area === 'all' || c.specialties.includes(area));
  const areaLabel = (k: string) => counselingAreas.find((a) => a.key === k)?.label ?? k;
  const upcoming = appts.filter((a) => a.status === 'Confirmed');
  const next = upcoming[0];
  const start = (c: Counselor) => { setWho(c); setStep(1); setDate(''); setTime(''); setNotes(''); setAgree(false); };
  const booked = who ? { counselor: who.name, area: areaLabel(area === 'all' ? who.specialties[0] : area), date, time, format } : null;
  const confirm = () => {
    setAppts((a) => [{ id: `a${Date.now()}`, ...booked!, status: 'Confirmed' }, ...a]);
    setStep(4);
  };
  const canNext = step === 1 ? !!format : step === 2 ? !!date && !!time : agree;

  return (
    <div className="space-y-5 overflow-x-clip pb-24 lg:pb-6">
      {next ? (
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-secondary p-5 text-primary-foreground shadow-regal">
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-primary-foreground/10 blur-2xl" />
          <p className="relative text-xs font-medium opacity-80">Your next session</p>
          <div className="relative mt-2 flex items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary-foreground/15 text-center backdrop-blur">
              <span className="font-heading text-xl font-bold leading-none">{next.date.slice(0, 2)}</span>
              <span className="text-[10px] opacity-80">{next.date.slice(3, 5)}/{next.date.slice(8)}</span>
            </div>
            <div className="min-w-0">
              <p className="truncate font-heading text-lg font-semibold">{next.area}</p>
              <p className="truncate text-xs opacity-85">with {next.counselor} · {next.time} · {next.format}</p>
            </div>
          </div>
          <Button asChild variant="secondary" size="sm" className="relative mt-4 rounded-full">
            <a href={googleCalendarUrl(next)} target="_blank" rel="noopener noreferrer"><CalendarPlus className="mr-2 h-4 w-4" />Add to Google Calendar</a>
          </Button>
        </section>
      ) : null}

      <a href="tel:" onClick={(e) => { e.preventDefault(); toast('The prayer line number will be added soon.'); }} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted/50">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><HeartHandshake className="h-5 w-5" /></span>
        <span className="min-w-0 flex-1">
          <span className="block font-heading text-sm font-semibold text-foreground">Need to talk right now?</span>
          <span className="block text-xs text-muted-foreground">Prayer line open daily, 7:00 – 22:00</span>
        </span>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><Phone className="h-4 w-4" /></span>
      </a>

      <Segmented<'book' | 'mine' | 'help'> full value={tab} onChange={setTab} options={[
        { value: 'book', label: 'Book' }, { value: 'mine', label: `My sessions${upcoming.length ? ` (${upcoming.length})` : ''}` }, { value: 'help', label: 'FAQ' }]} />

      {tab === 'book' && (<>
        <div className="no-scrollbar flex max-w-full gap-2 overflow-x-auto">
          {[{ key: 'all', label: 'All areas' }, ...counselingAreas].map((a) => (
            <button key={a.key} type="button" onClick={() => setArea(a.key)} className={cn('whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
              area === a.key ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:text-foreground')}>{a.label}</button>
          ))}
        </div>
        <ul className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => (
            <li key={c.id} className="min-w-0">
              <button type="button" onClick={() => start(c)} className="flex w-full min-w-0 max-w-full items-center gap-3 overflow-hidden whitespace-normal rounded-2xl border border-border bg-card p-3.5 text-left sm:p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full font-heading text-base sm:h-14 sm:w-14 sm:text-lg font-bold text-primary-foreground" style={{ background: toneVar(c.tone) }}>{c.initials}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-foreground">{c.name}</span>
                  <span className="block text-xs text-muted-foreground">{c.title}</span><span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{c.specialties.map(areaLabel).join(' · ')}</span>
                  <span className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Languages className="h-3 w-3" />{c.languages}</span>
                    <span className="flex items-center gap-1 font-medium text-success"><CalendarClock className="h-3 w-3" />{c.next}</span>
                  </span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
        <p className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-success" />All sessions are free and confidential.</p>
      </>)}

      {tab === 'mine' && (
        appts.length === 0 ? <EmptyState icon={CalendarClock} title="No sessions yet" action={<Button size="sm" onClick={() => setTab('book')}>Book a session</Button>} /> : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {appts.map((a) => (
              <li key={a.id} className={cn('flex items-center gap-3 px-4 py-3', a.status !== 'Confirmed' && 'opacity-60')}>
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-center text-primary">
                  <span className="font-heading text-base font-bold leading-none">{a.date.slice(0, 2)}</span>
                  <span className="text-[10px] leading-none">{a.date.slice(3, 5)}/{a.date.slice(8)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{a.area}</p>
                  <p className="truncate text-xs text-muted-foreground">{a.counselor} · {a.time} · {a.format}</p>
                </div>
                {a.status === 'Confirmed' ? (
                  <div className="flex shrink-0 gap-1">
                    <Button asChild size="icon" variant="ghost" className="h-9 w-9 rounded-full" aria-label="Add to Google Calendar">
                      <a href={googleCalendarUrl(a)} target="_blank" rel="noopener noreferrer"><CalendarPlus className="h-4 w-4" /></a>
                    </Button>
                    <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full text-destructive" aria-label="Cancel session"
                      onClick={() => { setAppts((x) => x.map((y) => y.id === a.id ? { ...y, status: 'Cancelled' } : y)); toast.success('Session cancelled'); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">{a.status}</span>}
              </li>
            ))}
          </ul>
        )
      )}

      {tab === 'help' && (
        <div className="rounded-2xl border border-border bg-card px-4">
          <Accordion type="single" collapsible>
            {counselingFaqs.map((f, i) => (
              <AccordionItem key={i} value={`f${i}`} className={i === counselingFaqs.length - 1 ? 'border-b-0' : undefined}><AccordionTrigger className="text-left text-sm">{f.q}</AccordionTrigger><AccordionContent className="text-muted-foreground">{f.a}</AccordionContent></AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      <Sheet open={!!who} onOpenChange={(o) => !o && setWho(null)}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-3xl border-border bg-card px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3 sm:mx-auto sm:max-w-lg sm:px-6">
          {who && (<>
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-muted" />
            <SheetHeader className="mb-4 text-left">
              <SheetTitle className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full font-heading text-sm font-bold text-primary-foreground" style={{ background: toneVar(who.tone) }}>{who.initials}</span>
                <span><span className="block text-base">{step === 4 ? 'Session booked' : who.name}</span><span className="block text-xs font-normal text-muted-foreground">{step < 4 ? `Step ${step} of 3 · ${['How to meet', 'Date & time', 'Confirm'][step - 1]}` : who.title}</span></span>
              </SheetTitle>
              <SheetDescription className="sr-only">Book a counseling session.</SheetDescription>
            </SheetHeader>
            {step < 4 && <div className="mb-4 flex gap-1">{[1, 2, 3].map((s) => <span key={s} className={cn('h-1 flex-1 rounded-full transition-colors', s <= step ? 'bg-primary' : 'bg-muted')} />)}</div>}

            {step === 1 && (
              <div className="grid gap-2">
                {formats.map((f) => (
                  <button key={f.key} type="button" onClick={() => setFormat(f.key)} className={cn('flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-colors',
                    format === f.key ? 'border-primary bg-primary text-primary-foreground' : 'border-border')}>
                    <f.icon className="h-5 w-5" /><span><span className="block text-sm font-semibold">{f.key}</span><span className={cn('block text-xs', format === f.key ? 'opacity-85' : 'text-muted-foreground')}>{f.hint}</span></span>
                  </button>
                ))}
              </div>
            )}
            {step === 2 && (
              <div className="space-y-4">
                <div className="no-scrollbar -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1">
                  {days.map((d) => (
                    <button key={d.date} type="button" onClick={() => setDate(d.date)} className={cn('w-16 shrink-0 snap-start rounded-2xl border py-2.5 text-center transition-colors',
                      date === d.date ? 'border-primary bg-primary text-primary-foreground' : 'border-border')}>
                      <p className="text-[11px] opacity-80">{d.label}</p><p className="font-heading text-xl font-bold leading-tight">{d.day}</p><p className="text-[10px] opacity-80">{d.month}</p>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((t, i) => (
                    <button key={t} type="button" disabled={i === 2} onClick={() => setTime(t)} className={cn('rounded-xl border py-2.5 text-sm font-medium disabled:opacity-40 disabled:line-through',
                      time === t ? 'border-primary bg-primary text-primary-foreground' : 'border-border')}>{t}</button>
                  ))}
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="space-y-3">
                <div className="rounded-2xl bg-muted/60 p-4 text-sm"><p className="font-semibold">{format}</p><p className="text-muted-foreground">{date} at {time}</p></div>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional: share briefly what you'd like to talk about" rows={3} className="rounded-2xl" />
                <label className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Checkbox checked={agree} onCheckedChange={(v) => setAgree(!!v)} className="mt-0.5" />
                  I understand this session is confidential and I can cancel at any time.
                </label>
              </div>
            )}
            {step === 4 && booked && (
              <div className="space-y-4 py-2 text-center">
                <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
                <p className="text-sm text-muted-foreground">{format} with {who.name} on {date} at {time}.</p>
                <Button asChild className="h-12 w-full rounded-full bg-gradient-to-r from-primary to-secondary font-semibold text-primary-foreground">
                  <a href={googleCalendarUrl(booked)} target="_blank" rel="noopener noreferrer"><CalendarPlus className="mr-2 h-4 w-4" />Add to Google Calendar</a>
                </Button>
                <Button variant="ghost" className="w-full rounded-full" onClick={() => { setWho(null); setTab('mine'); }}>See my sessions</Button>
              </div>
            )}
            {step < 4 && (
              <div className="mt-5 grid grid-cols-[auto_1fr] gap-2">
                <Button variant="outline" className="h-12 rounded-full" disabled={step === 1} onClick={() => setStep((s) => s - 1)} aria-label="Back"><ArrowLeft className="h-4 w-4" /></Button>
                <Button disabled={!canNext} className="h-12 rounded-full bg-gradient-to-r from-primary to-secondary font-semibold text-primary-foreground" onClick={() => step === 3 ? confirm() : setStep((s) => s + 1)}>{step === 3 ? 'Confirm booking' : 'Continue'}<ArrowRight className="ml-1 h-4 w-4" /></Button>
              </div>
            )}
          </>)}
        </SheetContent>
      </Sheet>
    </div>
  );
}
