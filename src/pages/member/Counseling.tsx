import { useState } from 'react';
import { Phone, Video, MapPin, CalendarClock, CheckCircle2, ShieldCheck, Languages, ArrowLeft, ArrowRight, HeartHandshake, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Panel, Segmented, EmptyState } from '@/components/member/MemberUI';
import { counselors, counselingAreas, timeSlots, demoAppointments, counselingFaqs, toneVar, type Counselor } from '@/data/memberDemo';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const formats = [
  { key: 'In person', icon: MapPin, hint: 'At your branch office' },
  { key: 'Video call', icon: Video, hint: 'Secure video link' },
  { key: 'Phone call', icon: Phone, hint: 'We call you' },
];

function nextDays(n: number) {
  const out: { label: string; day: string; date: string }[] = [];
  const d = new Date();
  for (let i = 1; out.length < n; i++) {
    const x = new Date(d.getTime() + i * 86400000);
    if (x.getDay() === 0) continue;
    out.push({ label: x.toLocaleDateString('en-GB', { weekday: 'short' }), day: String(x.getDate()), date: x.toLocaleDateString('en-GB') });
  }
  return out;
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
  const days = nextDays(6);

  const list = counselors.filter((c) => area === 'all' || c.specialties.includes(area));
  const areaLabel = (k: string) => counselingAreas.find((a) => a.key === k)?.label ?? k;
  const start = (c: Counselor) => { setWho(c); setStep(1); setDate(''); setTime(''); setNotes(''); setAgree(false); };
  const confirm = () => {
    setAppts((a) => [{ id: `a${Date.now()}`, counselor: who!.name, area: areaLabel(area === 'all' ? who!.specialties[0] : area), date, time, format, status: 'Confirmed' }, ...a]);
    setStep(4);
  };
  const canNext = step === 1 ? !!format : step === 2 ? !!date && !!time : agree;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><HeartHandshake className="h-5 w-5" /></span>
          <div>
            <p className="font-heading font-semibold text-foreground">Need to talk right now?</p>
            <p className="text-sm text-muted-foreground">Our pastoral prayer line is open every day, 7:00 – 22:00.</p>
          </div>
        </div>
        <Button variant="outline" className="w-fit" onClick={() => toast('Prayer line number will appear here (demo)')}><Phone className="mr-2 h-4 w-4" />Call prayer line</Button>
      </section>

      <Segmented<"book" | "mine" | "help"> value={tab} onChange={setTab} options={[
        { value: 'book', label: 'Book a session' }, { value: 'mine', label: `My appointments (${appts.filter((a) => a.status === 'Confirmed').length})` }, { value: 'help', label: 'Questions' }]} />

      {tab === 'book' && (<>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1">
          {[{ key: 'all', label: 'All areas' }, ...counselingAreas].map((a) => (
            <button key={a.key} onClick={() => setArea(a.key)} className={cn('whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium',
              area === a.key ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}>{a.label}</button>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {list.map((c) => (
            <article key={c.id} className="flex flex-col rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-lg">
              <div className="flex items-center gap-3">
                <span className="grid h-14 w-14 place-items-center rounded-full font-heading text-lg font-bold text-primary-foreground" style={{ background: toneVar(c.tone) }}>{c.initials}</span>
                <div className="min-w-0"><p className="truncate font-medium text-foreground">{c.name}</p><p className="text-xs text-muted-foreground">{c.title}</p></div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">{c.specialties.map((s) => <Badge key={s} variant="secondary" className="text-[11px]">{areaLabel(s)}</Badge>)}</div>
              <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Languages className="h-3.5 w-3.5" />{c.languages}</p>
              <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground"><CalendarClock className="h-3.5 w-3.5" />Next: {c.next}</p>
              <Button className="mt-4 w-full" onClick={() => start(c)}>Book session</Button>
            </article>
          ))}
        </div>
        <p className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4" />All sessions are free and confidential.</p>
      </>)}

      {tab === 'mine' && (
        appts.length === 0 ? <EmptyState icon={CalendarClock} title="No appointments yet" /> : (
          <Panel title="Your sessions" bodyClassName="p-0">
            <ul className="divide-y divide-border">
              {appts.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-center text-primary">
                      <span className="text-[10px] leading-none">{a.date.slice(3, 5)}/{a.date.slice(8)}</span>
                      <span className="font-heading text-base font-bold leading-none">{a.date.slice(0, 2)}</span>
                    </div>
                    <div><p className="font-medium text-foreground">{a.area}</p><p className="text-xs text-muted-foreground">with {a.counselor} · {a.time} · {a.format}</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={a.status === 'Confirmed' ? 'default' : 'secondary'}>{a.status}</Badge>
                    {a.status === 'Confirmed' && (
                      <Button size="sm" variant="ghost" onClick={() => { setAppts((x) => x.map((y) => y.id === a.id ? { ...y, status: 'Cancelled' } : y)); toast.success('Session cancelled (demo)'); }}>
                        <X className="mr-1 h-3.5 w-3.5" />Cancel
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        )
      )}

      {tab === 'help' && (
        <Panel title="Frequently asked questions">
          <Accordion type="single" collapsible>
            {counselingFaqs.map((f, i) => (
              <AccordionItem key={i} value={`f${i}`}><AccordionTrigger className="text-left">{f.q}</AccordionTrigger><AccordionContent className="text-muted-foreground">{f.a}</AccordionContent></AccordionItem>
            ))}
          </Accordion>
        </Panel>
      )}

      <Dialog open={!!who} onOpenChange={(o) => !o && setWho(null)}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
          {who && (<>
            <DialogHeader>
              <DialogTitle>{step === 4 ? 'Session booked' : `Book with ${who.name}`}</DialogTitle>
              {step < 4 && <DialogDescription>Step {step} of 3 · {['How would you like to meet?', 'Choose a date and time', 'Anything we should know?'][step - 1]}</DialogDescription>}
            </DialogHeader>
            {step < 4 && <div className="flex gap-1">{[1, 2, 3].map((s) => <span key={s} className={cn('h-1 flex-1 rounded-full', s <= step ? 'bg-primary' : 'bg-muted')} />)}</div>}

            {step === 1 && (
              <div className="grid gap-2">
                {formats.map((f) => (
                  <button key={f.key} onClick={() => setFormat(f.key)} className={cn('flex items-center gap-3 rounded-xl border p-3 text-left',
                    format === f.key ? 'border-primary bg-primary/10' : 'border-border')}>
                    <f.icon className="h-5 w-5 text-primary" /><div><p className="text-sm font-medium">{f.key}</p><p className="text-xs text-muted-foreground">{f.hint}</p></div>
                  </button>
                ))}
              </div>
            )}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {days.map((d) => (
                    <button key={d.date} onClick={() => setDate(d.date)} className={cn('rounded-xl border py-2 text-center',
                      date === d.date ? 'border-primary bg-primary text-primary-foreground' : 'border-border')}>
                      <p className="text-[11px] opacity-80">{d.label}</p><p className="font-heading text-lg font-bold">{d.day}</p>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((t, i) => (
                    <button key={t} disabled={i === 2} onClick={() => setTime(t)} className={cn('rounded-lg border py-2 text-sm disabled:opacity-40 disabled:line-through',
                      time === t ? 'border-primary bg-primary/10 text-primary' : 'border-border')}>{t}</button>
                  ))}
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="space-y-3">
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional: share briefly what you'd like to talk about" rows={4} />
                <label className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Checkbox checked={agree} onCheckedChange={(v) => setAgree(!!v)} className="mt-0.5" />
                  I understand this session is confidential and I can cancel at any time.
                </label>
                <div className="rounded-xl bg-muted/60 p-3 text-sm"><p><b>{format}</b> · {date} at {time}</p></div>
              </div>
            )}
            {step === 4 && (
              <div className="space-y-3 py-2 text-center">
                <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
                <p className="text-sm text-muted-foreground">{format} with {who.name} on {date} at {time}.</p>
                <p className="text-xs text-muted-foreground">Reference CNS-{Math.abs(date.length * 731 + time.length * 17)} (demo)</p>
                <Button onClick={() => { setWho(null); setTab('mine'); }}>See my appointments</Button>
              </div>
            )}
            {step < 4 && (
              <div className="flex justify-between pt-2">
                <Button variant="ghost" disabled={step === 1} onClick={() => setStep((s) => s - 1)}><ArrowLeft className="mr-1 h-4 w-4" />Back</Button>
                <Button disabled={!canNext} onClick={() => step === 3 ? confirm() : setStep((s) => s + 1)}>{step === 3 ? 'Confirm booking' : 'Next'}<ArrowRight className="ml-1 h-4 w-4" /></Button>
              </div>
            )}
          </>)}
        </DialogContent>
      </Dialog>
    </div>
  );
}
