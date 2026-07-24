import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CartEntry {
  member_id: string;
  display_name: string;
  code: string; // raw scanned code
}

export interface ResolveResp {
  code: string;
  member_id?: string;
  display_name?: string;
  member_code?: string;
  error?: string;
}

export function useAttendanceScan() {
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cacheRef = useRef<Map<string, ResolveResp>>(new Map());
  const seenMembersRef = useRef<Set<string>>(new Set());

  const beep = useCallback((ok: boolean) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = ok ? 880 : 300;
      g.gain.value = 0.08;
      o.start();
      setTimeout(() => { o.stop(); ctx.close(); }, ok ? 90 : 220);
    } catch { /* ignore */ }
  }, []);

  const resolveAndAdd = useCallback(async (rawCode: string) => {
    const code = (rawCode || "").trim();
    if (!code) return;

    const cached = cacheRef.current.get(code);
    if (cached && cached.member_id) {
      if (seenMembersRef.current.has(cached.member_id)) {
        beep(false);
        setLastMessage(`Already in cart: ${cached.display_name}`);
        return;
      }
      seenMembersRef.current.add(cached.member_id);
      setCart((c) => [...c, { member_id: cached.member_id!, display_name: cached.display_name!, code }]);
      beep(true);
      setLastMessage(`Added: ${cached.display_name}`);
      return;
    }

    const { data, error } = await supabase.functions.invoke("attendance-scan-resolve", {
      body: { codes: [code] },
    });
    if (error) {
      beep(false);
      setLastMessage(`Scan failed: ${error.message || "network error"}`);
      return;
    }
    const result: ResolveResp | undefined = (data as any)?.results?.[0];
    if (!result) {
      beep(false);
      setLastMessage("Scan failed: no result");
      return;
    }
    cacheRef.current.set(code, result);

    if (result.error || !result.member_id) {
      beep(false);
      const reason = result.error ? ` (${result.error})` : "";
      setLastMessage(`Unrecognized badge${reason}`);
      return;
    }
    if (seenMembersRef.current.has(result.member_id)) {
      beep(false);
      setLastMessage(`Already in cart: ${result.display_name}`);
      return;
    }
    seenMembersRef.current.add(result.member_id);
    setCart((c) => [...c, { member_id: result.member_id!, display_name: result.display_name!, code }]);
    beep(true);
    setLastMessage(`Added: ${result.display_name}`);
  }, [beep]);

  const addMemberDirect = useCallback((memberId: string, displayName: string) => {
    if (seenMembersRef.current.has(memberId)) {
      setLastMessage(`Already in cart: ${displayName}`);
      return;
    }
    seenMembersRef.current.add(memberId);
    setCart((c) => [...c, { member_id: memberId, display_name: displayName, code: `manual:${memberId}` }]);
    setLastMessage(`Added: ${displayName}`);
  }, []);

  const removeAt = useCallback((idx: number) => {
    setCart((c) => {
      const removed = c[idx];
      if (removed) seenMembersRef.current.delete(removed.member_id);
      return c.filter((_, i) => i !== idx);
    });
  }, []);

  const clear = useCallback(() => {
    seenMembersRef.current.clear();
    setCart([]);
  }, []);

  const submit = useCallback(async (eventId: string) => {
    if (!eventId || cart.length === 0) return null;
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("attendance-mark-present", {
        body: { event_id: eventId, member_ids: cart.map((c) => c.member_id) },
      });
      if (error) throw error;
      clear();
      return data as { submitted: number; newly_marked: number; already_present: number };
    } finally {
      setIsSubmitting(false);
    }
  }, [cart, clear]);

  return { cart, lastMessage, isSubmitting, resolveAndAdd, addMemberDirect, removeAt, clear, submit };
}
