import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Search, Star, StarOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useAllCurrencies, useToggleCurrencyStatus, type Currency } from "@/hooks/useCurrencies";
import { useBaseCurrencyCode, useUpsertSystemSetting } from "@/hooks/useSystemSettings";
import { CreateCurrencyDialog } from "@/components/admin/super/currencies/CreateCurrencyDialog";
import { EditCurrencyDialog } from "@/components/admin/super/currencies/EditCurrencyDialog";

export default function CurrenciesPanel() {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const { data: currencies, isLoading } = useAllCurrencies();
  const toggleStatusMutation = useToggleCurrencyStatus();
  const { data: baseCode } = useBaseCurrencyCode();
  const upsertSetting = useUpsertSystemSetting();

  const filteredCurrencies = currencies?.filter(
    (c) =>
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.symbol.includes(searchTerm)
  );

  const handleToggleStatus = async (currency: Currency) => {
    try {
      await toggleStatusMutation.mutateAsync({ id: currency.id, is_active: !currency.is_active });
      toast.success(`Currency ${currency.is_active ? "deactivated" : "activated"}`);
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
  };

  const handleSetBase = async (code: string) => {
    try {
      await upsertSetting.mutateAsync({ key: "base_currency", value: code });
      toast.success(`Base currency set to ${code}`);
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle>Currencies</CardTitle>
            <CardDescription>Manage currencies and select the reporting base currency for super admin finance.</CardDescription>
          </div>
          <CreateCurrencyDialog />
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search currencies..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>

        {isLoading ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Decimals</TableHead>
                  <TableHead>Base</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCurrencies?.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No currencies found</TableCell></TableRow>
                ) : (
                  filteredCurrencies?.map((c) => {
                    const isBase = c.code === baseCode;
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono font-semibold">{c.code}</TableCell>
                        <TableCell>{c.name}</TableCell>
                        <TableCell className="text-lg">{c.symbol}</TableCell>
                        <TableCell>{c.decimal_places}</TableCell>
                        <TableCell>
                          {isBase ? (
                            <Badge className="bg-amber-500/90"><Star className="h-3 w-3 mr-1" /> Base</Badge>
                          ) : (
                            <Button size="sm" variant="ghost" disabled={!c.is_active || upsertSetting.isPending} onClick={() => handleSetBase(c.code)}>
                              <StarOff className="h-3 w-3 mr-1" /> Set as base
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch checked={c.is_active} onCheckedChange={() => handleToggleStatus(c)} disabled={toggleStatusMutation.isPending || isBase} />
                            <Badge variant={c.is_active ? "default" : "secondary"}>{c.is_active ? "Active" : "Inactive"}</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => setEditingCurrency(c)}><Pencil className="h-4 w-4" /></Button>
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
      {editingCurrency && (
        <EditCurrencyDialog currency={editingCurrency} open={!!editingCurrency} onOpenChange={(o) => !o && setEditingCurrency(null)} />
      )}
    </Card>
  );
}
