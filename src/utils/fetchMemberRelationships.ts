import { supabase } from '@/integrations/supabase/client';

export interface MemberRelationshipRow {
  member_id: string;
  related_member_id: string;
}

/**
 * Fetch all rows in `member_relationships` that touch ANY id in `memberIds`,
 * either as `member_id` or as `related_member_id`.
 *
 * Why this helper exists:
 *   - The previous approach used a single `.or(member_id.in.(…),related_member_id.in.(…))`
 *     filter. With large id lists this can silently return a partial result set
 *     (URL length / parser limits), which made the strict child rule
 *     (age<16 AND tied to an adult) miss valid children — surfacing as "0".
 *   - Splitting into two `.in(...)` calls and de-duplicating in JS guarantees
 *     complete coverage. We also chunk to stay well under any URL limit.
 *
 * Direction- and type-agnostic: every relationship_type counts equally and
 * either side of the row is treated as a tie. The caller decides what to do
 * with the rows (e.g. `buildChildrenSet`).
 */
export const fetchMemberRelationshipsForMembers = async (
  memberIds: string[]
): Promise<MemberRelationshipRow[]> => {
  if (memberIds.length === 0) return [];

  // Chunk to keep each `.in(...)` URL safely small.
  const CHUNK = 200;
  const chunks: string[][] = [];
  for (let i = 0; i < memberIds.length; i += CHUNK) {
    chunks.push(memberIds.slice(i, i + CHUNK));
  }

  const seen = new Set<string>();
  const rows: MemberRelationshipRow[] = [];

  const collect = (data: any[] | null | undefined) => {
    (data || []).forEach((r: any) => {
      const key = `${r.member_id}|${r.related_member_id}`;
      if (seen.has(key)) return;
      seen.add(key);
      rows.push({
        member_id: r.member_id as string,
        related_member_id: r.related_member_id as string,
      });
    });
  };

  for (const chunk of chunks) {
    const [byMember, byRelated] = await Promise.all([
      supabase
        .from('member_relationships' as any)
        .select('member_id, related_member_id')
        .in('member_id', chunk),
      supabase
        .from('member_relationships' as any)
        .select('member_id, related_member_id')
        .in('related_member_id', chunk),
    ]);
    if (byMember.error) throw byMember.error;
    if (byRelated.error) throw byRelated.error;
    collect(byMember.data as any[] | null);
    collect(byRelated.data as any[] | null);
  }

  return rows;
};
