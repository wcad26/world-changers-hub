import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useExchangeRates, useDeleteExchangeRate, type ExchangeRate } from "@/hooks/useExchangeRates";
import { useBaseCurrencyCode } from "@/hooks/useSystemSettings";
import { deriveCrossRates } from "@/utils/fx";
import CreatePairDialog from "./CreatePairDialog";
import EditPairDialog from "./EditPairDialog";

export default function ExchangeRatesPanel() {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ExchangeRate | null>(null);
  const { data: rates = [], isLoading } = useExchangeRates();
  const { data: baseCode } = useBaseCurrencyCode();
  const del = useDeleteExchangeRate();

  const derived = useMemo(() => deriveCrossRates(baseCode, rates), [rates, baseCode]);

  const all = useMemo(() => {
    const directRows = rates.map((r) => ({ ...r, derived: false as const }));
    const derivedRows = derived.map((r) => ({ ...r, id: `${r.base_code}-${r.quote_code}-derived`, is_active: true, derived: true as const }));
    const combined = [...directRows, ...derivedRows];
    const s = search.toLowerCase();
    if (!s) return combined;
    return combined.filter((r) => r.base_code.toLowerCase().includes(s) || r.quote_code.toLowerCase().includes(s));
  }, [rates, derived, search]);

  const handleDelete = async (r: ExchangeRate) => {
    if (!confirm(`Delete ${r.base_code} → ${r.quote_code}?`)) return;
    try {
      await del.mutateAsync(r.id);
      toast.success("Pair removed");
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle>Exchange rates</CardTitle>
            <CardDescription>Bid/ask rates between currency pairs. Cross pairs are derived automatically via the base currency ({baseCode}).</CardDescription>
          </div>
          <CreatePairDialog />
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by currency code..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        {isLoading ? (
          <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pair</TableHead>
                  <TableHead className="text-right">Bid</TableHead>
                  <TableHead className="text-right">Ask</TableHead>
                  <TableHead className="text-right">Mid</TableHead>
                  <TableHead className="text-right">Spread</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {all.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No exchange rates yet. Add a pair to enable currency conversion in finance reports.</TableCell></TableRow>
                ) : (
                  all.map((r) => {
                    const spread = r.ask > 0 ? ((r.ask - r.bid) / r.ask) * 100 : 0;
                    return (
                      <TableRow key={r.id} className={r.derived ? "text-muted-foreground" : ""}>
                        <TableCell className="font-mono font-medium">{r.base_code} → {r.quote_code}</TableCell>
                        <TableCell className="text-right tabular-nums">{Number(r.bid).toFixed(4)}</TableCell>
                        <TableCell className="text-right tabular-nums">{Number(r.ask).toFixed(4)}</TableCell>
                        <TableCell className="text-right tabular-nums">{Number(r.mid).toFixed(4)}</TableCell>
                        <TableCell className="text-right tabular-nums">{spread.toFixed(2)}%</TableCell>
                        <TableCell>
                          {r.derived ? (
                            <Badge variant="outline">Derived</Badge>
                          ) : r.is_active ? (
                            <Badge>Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!r.derived && (
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => setEditing(r as ExchangeRate)}><Pencil className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(r as ExchangeRate)} disabled={del.isPending}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      {editing && <EditPairDialog rate={editing} open={!!editing} onOpenChange={(o) => !o && setEditing(null)} />}
    </Card>
  );
}
