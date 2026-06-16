import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAllRegions } from "@/hooks/useAllRegions";
import { useOccupations } from "@/hooks/useOccupations";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  User, Heart, BookOpen, Users, MapPin, Check, X, Search, UserCheck, Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

// Convert stored value (ISO yyyy-mm-dd or partial digits) -> dd/mm/yyyy display
const isoToDisplay = (stored: string): string => {
  if (!stored) return "";
  const iso = stored.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const digits = stored.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

// Auto-format user input and convert dd/mm/yyyy -> ISO yyyy-mm-dd when complete
const displayToIso = (input: string): string => {
  const digits = input.replace(/\D/g, "").slice(0, 8);
  if (digits.length < 8) return digits;
  const dd = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);
  return `${yyyy}-${mm}-${dd}`;
};

export type OnboardAttendeeType = "member" | "visitor";

export type OnboardFormValue = {
  attendee_type: OnboardAttendeeType;
  region_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  date_of_birth: string;
  gender: string;
  occupation: string;
  has_completed_foundation_school: string;
  foundation_school_date: string;
  is_baptized: string;
  baptism_date: string;
  ministry_interests: string[];
  dcg_id: string;
  relationships: { relationship_type: string; member_ids: string[] }[];
  referral_source: string;
  referral_social_media: string;
  referral_member_ids: string[];
  referral_relationship_type: string;
  referral_other_details: string;
  join_interest: string;
};

export const emptyOnboardValue = (): OnboardFormValue => ({
  attendee_type: "visitor",
  region_id: "",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  address: "",
  date_of_birth: "",
  gender: "",
  occupation: "",
  has_completed_foundation_school: "",
  foundation_school_date: "",
  is_baptized: "",
  baptism_date: "",
  ministry_interests: [],
  dcg_id: "",
  relationships: [],
  referral_source: "",
  referral_social_media: "",
  referral_member_ids: [],
  referral_relationship_type: "",
  referral_other_details: "",
  join_interest: "",
});

// Stored values stay English. Labels are translated.
const MINISTRY_OPTIONS: { value: string; key: Parameters<ReturnType<typeof useLanguage>["t"]>[0] }[] = [
  { value: "Music & Worship", key: "sr_ministry_music" },
  { value: "Teaching & Preaching", key: "sr_ministry_teaching" },
  { value: "Youth Ministry", key: "sr_ministry_youth" },
  { value: "Children's Ministry", key: "sr_ministry_children" },
  { value: "Hospitality", key: "sr_ministry_hospitality" },
  { value: "Media & Technology", key: "sr_ministry_media" },
  { value: "Administration", key: "sr_ministry_admin" },
  { value: "Counseling", key: "sr_ministry_counseling" },
  { value: "Prayer Ministry", key: "sr_ministry_prayer" },
  { value: "Outreach & Evangelism", key: "sr_ministry_outreach" },
];

const REL_OPTIONS: { value: string; key: Parameters<ReturnType<typeof useLanguage>["t"]>[0] }[] = [
  { value: "spouse", key: "sr_rel_spouse" },
  { value: "parent", key: "sr_rel_parent" },
  { value: "child", key: "sr_rel_child" },
  { value: "sibling", key: "sr_rel_sibling" },
  { value: "guardian", key: "sr_rel_guardian" },
  { value: "other", key: "sr_rel_other" },
];

const nativeSelectClassName =
  "flex h-10 w-full rounded-xl border border-input bg-background/60 px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const Req = () => <span className="text-destructive ml-0.5">*</span>;

function Section({
  icon: Icon, title, children,
}: { icon: React.ElementType; title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5 md:p-6 space-y-4 shadow-sm">
      <div className="flex items-center gap-2.5 pb-3 border-b border-border/30">
        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

const digits = (s: string) => (s.match(/\d/g) || []).length;

export function isOnboardValid(v: OnboardFormValue): boolean {
  if (!v.region_id) return false;
  if (!v.first_name?.trim() || !v.last_name?.trim()) return false;
  if (!v.email?.trim() || !/^\S+@\S+\.\S+$/.test(v.email)) return false;
  if (!v.phone?.trim() || digits(v.phone) < 9) return false;
  if (!v.address?.trim()) return false;
  if (!v.date_of_birth) return false;
  if (!v.gender) return false;
  if (v.attendee_type === "member") {
    if (!v.dcg_id) return false;
  } else {
    if (!v.occupation) return false;
    if (v.referral_source === "invited_by" &&
      (v.referral_member_ids.length === 0 || !v.referral_relationship_type)) return false;
    if (v.referral_source === "social_media" && !v.referral_social_media) return false;
    if (v.referral_source === "other" && !v.referral_other_details?.trim()) return false;
  }
  return true;
}

interface Props {
  value: OnboardFormValue;
  onChange: (next: OnboardFormValue) => void;
  hideAttendeeTypeChooser?: boolean;
  hideRegionSelector?: boolean;
}

export default function SpecialEventOnboardForm({
  value, onChange, hideAttendeeTypeChooser, hideRegionSelector,
}: Props) {
  const { t } = useLanguage();
  const set = <K extends keyof OnboardFormValue>(k: K, val: OnboardFormValue[K]) =>
    onChange({ ...value, [k]: val });

  const { data: regions = [] } = useAllRegions();
  const { data: occupations = [] } = useOccupations();

  const { data: dcgs = [] } = useQuery({
    queryKey: ["onboard-dcgs", value.region_id],
    enabled: !!value.region_id && value.attendee_type === "member",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dcgs")
        .select("*")
        .eq("region_id", value.region_id)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const [memberSearchText, setMemberSearchText] = useState("");
  const { data: allMembers = [] } = useQuery({
    queryKey: ["onboard-members-search", memberSearchText],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("search_all_members", { _search: memberSearchText });
      if (error) throw error;
      return (data || []) as Array<{ id: string; member_id: string; first_name: string; last_name: string }>;
    },
  });

  const [relType, setRelType] = useState<string>("");
  const [relIds, setRelIds] = useState<string[]>([]);
  const [relOpen, setRelOpen] = useState(false);

  const addRel = () => {
    if (!relType || relIds.length === 0) return;
    set("relationships", [...value.relationships, { relationship_type: relType, member_ids: relIds }]);
    setRelType(""); setRelIds([]);
  };
  const removeRel = (i: number) =>
    set("relationships", value.relationships.filter((_, idx) => idx !== i));

  const [refOpen, setRefOpen] = useState(false);
  const toggleRefMember = (id: string) =>
    set("referral_member_ids",
      value.referral_member_ids.includes(id)
        ? value.referral_member_ids.filter(x => x !== id)
        : [...value.referral_member_ids, id]);

  const isMember = value.attendee_type === "member";

  const renderTypeChooser = () => (
    <div className="space-y-3 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5 shadow-sm">
      <div>
        <p className="text-sm font-medium text-foreground">{t("sr_onboard_select_type_title")}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{t("sr_onboard_select_type_desc")}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {([
          { type: "member", label: t("sr_member_type"), Icon: UserCheck, color: "indigo" },
          { type: "visitor", label: t("sr_visitor_type"), Icon: User, color: "rose" },
        ] as const).map(({ type, label, Icon, color }) => {
          const selected = value.attendee_type === type;
          const palette =
            color === "indigo"
              ? selected
                ? "border-indigo-500 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                : "border-border bg-background/60 hover:border-indigo-400/50"
              : selected
                ? "border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                : "border-border bg-background/60 hover:border-rose-400/50";
          return (
            <button
              key={type}
              type="button"
              onClick={() => set("attendee_type", type)}
              className={cn(
                "relative flex items-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-medium transition-all",
                palette
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors shrink-0",
                  selected ? "border-green-500 bg-green-500" : "border-muted-foreground/40 bg-background"
                )}
              >
                {selected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
              </span>
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {!hideAttendeeTypeChooser && renderTypeChooser()}

      {!hideRegionSelector && (
        <Section icon={MapPin} title={t("sr_region_section")}>
          <div>
            <Label className="text-xs">{t("sr_region_label")} <Req /></Label>
            <select
              className={nativeSelectClassName}
              value={value.region_id}
              onChange={(e) => set("region_id", e.target.value)}
            >
              <option value="">{t("sr_region_placeholder")}</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">{t("sr_region_help")}</p>
          </div>
        </Section>
      )}

      <Section icon={User} title={t("sr_personal_info")}>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">{t("sr_family_name")} <Req /></Label>
            <Input className="rounded-xl bg-background/60" value={value.last_name}
              onChange={(e) => set("last_name", e.target.value)} placeholder="Doe" />
          </div>
          <div>
            <Label className="text-xs">{t("sr_other_names")} <Req /></Label>
            <Input className="rounded-xl bg-background/60" value={value.first_name}
              onChange={(e) => set("first_name", e.target.value)} placeholder="John" />
          </div>
          <div>
            <Label className="text-xs">{t("sr_email")} <Req /></Label>
            <Input type="email" className="rounded-xl bg-background/60" value={value.email}
              onChange={(e) => set("email", e.target.value)} placeholder={t("sr_email_placeholder")} />
          </div>
          <div>
            <Label className="text-xs">{t("sr_phone")} <Req /></Label>
            <Input type="tel" className="rounded-xl bg-background/60" value={value.phone}
              onChange={(e) => set("phone", e.target.value)} placeholder={t("sr_phone_placeholder_full")} />
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs">{t("sr_address")} <Req /></Label>
            <Textarea className="rounded-xl bg-background/60 min-h-[72px]" value={value.address}
              onChange={(e) => set("address", e.target.value)} placeholder={t("sr_address_placeholder")} />
          </div>
          <div>
            <Label className="text-xs">{t("sr_dob")} <Req /></Label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="dd/mm/yyyy"
              maxLength={10}
              className="rounded-xl bg-background/60"
              value={isoToDisplay(value.date_of_birth)}
              onChange={(e) => set("date_of_birth", displayToIso(e.target.value))}
            />
          </div>
          <div>
            <Label className="text-xs">{t("sr_gender")} <Req /></Label>
            <select className={nativeSelectClassName} value={value.gender}
              onChange={(e) => set("gender", e.target.value)}>
              <option value="">{t("sr_select_gender")}</option>
              <option value="Male">{t("sr_male")}</option>
              <option value="Female">{t("sr_female")}</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs">{t("sr_occupation")}{!isMember && <Req />}</Label>
            <select className={nativeSelectClassName} value={value.occupation}
              onChange={(e) => set("occupation", e.target.value)}>
              <option value="">{t("sr_select_occupation")}</option>
              {occupations.map((o: any) => (
                <option key={o.id} value={o.name}>{o.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Section>

      {isMember && (
        <>
          <Section icon={BookOpen} title={t("sr_spiritual_info")}>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{t("sr_foundation_q")}</Label>
                <select className={nativeSelectClassName}
                  value={value.has_completed_foundation_school}
                  onChange={(e) => set("has_completed_foundation_school", e.target.value)}>
                  <option value="">{t("sr_select")}</option>
                  <option value="yes">{t("sr_yes")}</option>
                  <option value="no">{t("sr_no")}</option>
                </select>
              </div>
              {value.has_completed_foundation_school === "yes" && (
                <div>
                  <Label className="text-xs">{t("sr_foundation_date")}</Label>
                  <Input type="date" className="rounded-xl bg-background/60"
                    value={value.foundation_school_date}
                    onChange={(e) => set("foundation_school_date", e.target.value)} />
                </div>
              )}
              <div>
                <Label className="text-xs">{t("sr_baptized_q")}</Label>
                <select className={nativeSelectClassName} value={value.is_baptized}
                  onChange={(e) => set("is_baptized", e.target.value)}>
                  <option value="">{t("sr_select")}</option>
                  <option value="yes">{t("sr_yes")}</option>
                  <option value="no">{t("sr_no")}</option>
                </select>
              </div>
              {value.is_baptized === "yes" && (
                <div>
                  <Label className="text-xs">{t("sr_baptism_date")}</Label>
                  <Input type="date" className="rounded-xl bg-background/60"
                    value={value.baptism_date}
                    onChange={(e) => set("baptism_date", e.target.value)} />
                </div>
              )}
            </div>
          </Section>

          <Section icon={Heart} title={t("sr_ministry_title")}>
            <p className="text-xs text-muted-foreground">{t("sr_ministry_desc")}</p>
            <div className="grid md:grid-cols-2 gap-2">
              {MINISTRY_OPTIONS.map((m) => {
                const checked = value.ministry_interests.includes(m.value);
                return (
                  <label key={m.value} className="flex items-center gap-2 cursor-pointer text-sm">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        if (v) set("ministry_interests", [...value.ministry_interests, m.value]);
                        else set("ministry_interests", value.ministry_interests.filter(x => x !== m.value));
                      }}
                    />
                    <span>{t(m.key)}</span>
                  </label>
                );
              })}
            </div>
          </Section>

          <Section icon={Building2} title={t("sr_dcg_title")}>
            <Label className="text-xs">{t("sr_dcg_label")} <Req /></Label>
            <select
              className={nativeSelectClassName}
              value={value.dcg_id}
              onChange={(e) => set("dcg_id", e.target.value)}
              disabled={!value.region_id}
            >
              <option value="">{value.region_id ? t("sr_dcg_select_placeholder") : t("sr_dcg_select_region_first")}</option>
              {dcgs.map((d: any) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </Section>

          <Section icon={Users} title={t("sr_family_rel_title")}>
            {value.relationships.length > 0 && (
              <div className="space-y-2">
                {value.relationships.map((rel, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-3 rounded-xl border border-border/30 bg-muted/30">
                    <Badge variant="secondary" className="capitalize rounded-lg">
                      {t((REL_OPTIONS.find(o => o.value === rel.relationship_type)?.key) || "sr_rel_other")}
                    </Badge>
                    <div className="flex-1 flex flex-wrap gap-1">
                      {rel.member_ids.map(mid => {
                        const m = allMembers.find(x => x.id === mid);
                        return (
                          <Badge key={mid} variant="outline" className="rounded-lg">
                            {m ? `${m.last_name} ${m.first_name}` : mid}
                          </Badge>
                        );
                      })}
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeRel(idx)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-3 p-4 rounded-xl border border-dashed border-border/40 bg-muted/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("sr_rel_type")}</Label>
                  <select className={nativeSelectClassName} value={relType}
                    onChange={(e) => setRelType(e.target.value)}>
                    <option value="">{t("sr_select_rel")}</option>
                    {REL_OPTIONS.map(o => <option key={o.value} value={o.value}>{t(o.key)}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("sr_related_members")}</Label>
                  <Popover open={relOpen} onOpenChange={setRelOpen}>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline"
                        className="w-full justify-between font-normal rounded-xl bg-background/60">
                        {relIds.length > 0 ? `${relIds.length} ${t("sr_n_selected")}` : t("sr_search_members")}
                        <Search className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder={t("sr_search_members")} onValueChange={setMemberSearchText} />
                        <CommandList>
                          <CommandEmpty>{t("sr_no_members")}</CommandEmpty>
                          <CommandGroup className="max-h-60 overflow-auto">
                            {allMembers.map(m => {
                              const sel = relIds.includes(m.id);
                              return (
                                <CommandItem key={m.id} value={`${m.last_name} ${m.first_name}`}
                                  onSelect={() => setRelIds(sel ? relIds.filter(x => x !== m.id) : [...relIds, m.id])}>
                                  <div className={cn(
                                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                    sel ? "bg-primary text-primary-foreground" : "opacity-50"
                                  )}>
                                    {sel && <Check className="h-3 w-3" />}
                                  </div>
                                  <span>{m.last_name} {m.first_name}</span>
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="button" size="sm" variant="secondary" onClick={addRel}
                  disabled={!relType || relIds.length === 0} className="rounded-xl">
                  {t("sr_add_rel")}
                </Button>
              </div>
            </div>
          </Section>
        </>
      )}

      {!isMember && (
        <>
          <Section icon={Heart} title={t("sr_referral_title")}>
            <div>
              <Label className="text-xs">{t("sr_referral_q")}</Label>
              <select className={nativeSelectClassName} value={value.referral_source}
                onChange={(e) => set("referral_source", e.target.value)}>
                <option value="">{t("sr_select_referral")}</option>
                <option value="invited_by">{t("sr_referral_invited_by")}</option>
                <option value="social_media">{t("sr_referral_social_media")}</option>
                <option value="website">{t("sr_referral_website")}</option>
                <option value="other">{t("sr_referral_other")}</option>
              </select>
            </div>

            {value.referral_source === "invited_by" && (
              <div className="space-y-3 p-4 rounded-xl border border-dashed border-border/40 bg-muted/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t("sr_invited_by_members")} <Req /></Label>
                    <Popover open={refOpen} onOpenChange={setRefOpen}>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline"
                          className="w-full justify-between font-normal rounded-xl bg-background/60">
                          {value.referral_member_ids.length > 0
                            ? `${value.referral_member_ids.length} ${t("sr_n_selected")}`
                            : t("sr_search_members")}
                          <Search className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder={t("sr_search_members")} onValueChange={setMemberSearchText} />
                          <CommandList>
                            <CommandEmpty>{t("sr_no_members")}</CommandEmpty>
                            <CommandGroup className="max-h-60 overflow-auto">
                              {allMembers.map(m => {
                                const sel = value.referral_member_ids.includes(m.id);
                                return (
                                  <CommandItem key={m.id} value={`${m.last_name} ${m.first_name}`}
                                    onSelect={() => toggleRefMember(m.id)}>
                                    <div className={cn(
                                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                      sel ? "bg-primary text-primary-foreground" : "opacity-50"
                                    )}>
                                      {sel && <Check className="h-3 w-3" />}
                                    </div>
                                    <span>{m.last_name} {m.first_name}</span>
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t("sr_relationship")} <Req /></Label>
                    <select className={nativeSelectClassName} value={value.referral_relationship_type}
                      onChange={(e) => set("referral_relationship_type", e.target.value)}>
                      <option value="">{t("sr_select_rel")}</option>
                      {REL_OPTIONS.map(o => <option key={o.value} value={o.value}>{t(o.key)}</option>)}
                    </select>
                  </div>
                </div>
                {value.referral_member_ids.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {value.referral_member_ids.map(mid => {
                      const m = allMembers.find(x => x.id === mid);
                      return (
                        <Badge key={mid} variant="outline" className="gap-1 rounded-lg">
                          {m ? `${m.last_name} ${m.first_name}` : mid}
                          <X className="h-3 w-3 cursor-pointer" onClick={() => toggleRefMember(mid)} />
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {value.referral_source === "social_media" && (
              <div>
                <Label className="text-xs">{t("sr_which_platform")} <Req /></Label>
                <select className={nativeSelectClassName} value={value.referral_social_media}
                  onChange={(e) => set("referral_social_media", e.target.value)}>
                  <option value="">{t("sr_select_platform")}</option>
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="twitter">Twitter / X</option>
                  <option value="tiktok">TikTok</option>
                  <option value="youtube">YouTube</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="telegram">Telegram</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="other_social">{t("sr_platform_other")}</option>
                </select>
              </div>
            )}

            {value.referral_source === "other" && (
              <div>
                <Label className="text-xs">{t("sr_tell_more")} <Req /></Label>
                <Textarea className="rounded-xl bg-background/60 min-h-[72px]"
                  value={value.referral_other_details}
                  onChange={(e) => set("referral_other_details", e.target.value)}
                  placeholder={t("sr_tell_more_placeholder")} />
              </div>
            )}
          </Section>

          <Section icon={Heart} title={t("sr_interest_title")}>
            <Label className="text-xs">{t("sr_join_q")}</Label>
            <RadioGroup
              value={value.join_interest}
              onValueChange={(v) => set("join_interest", v)}
              className="flex flex-wrap gap-4 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="ji-yes" />
                <label htmlFor="ji-yes" className="text-sm cursor-pointer">{t("sr_yes")}</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="ji-no" />
                <label htmlFor="ji-no" className="text-sm cursor-pointer">{t("sr_no")}</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="undecided" id="ji-und" />
                <label htmlFor="ji-und" className="text-sm cursor-pointer">{t("sr_undecided")}</label>
              </div>
            </RadioGroup>
          </Section>
        </>
      )}
    </div>
  );
}
