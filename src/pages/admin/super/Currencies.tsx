import { useState } from 'react';
import { toast } from 'sonner';
import { Pencil, Search } from 'lucide-react';
import SuperAdminLayout from '@/components/admin/SuperAdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { useAllCurrencies, useToggleCurrencyStatus, type Currency } from '@/hooks/useCurrencies';
import { CreateCurrencyDialog } from '@/components/admin/super/currencies/CreateCurrencyDialog';
import { EditCurrencyDialog } from '@/components/admin/super/currencies/EditCurrencyDialog';
import { Skeleton } from '@/components/ui/skeleton';

export default function Currencies() {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const { data: currencies, isLoading } = useAllCurrencies();
  const toggleStatusMutation = useToggleCurrencyStatus();

  const filteredCurrencies = currencies?.filter(
    (currency) =>
      currency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      currency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      currency.symbol.includes(searchTerm)
  );

  const handleToggleStatus = async (currency: Currency) => {
    try {
      await toggleStatusMutation.mutateAsync({
        id: currency.id,
        is_active: !currency.is_active,
      });
      toast.success(
        `Currency ${currency.is_active ? 'deactivated' : 'activated'} successfully`
      );
    } catch (error: any) {
      toast.error(error.message || 'Failed to update currency status');
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <p className="text-muted-foreground">
          Manage currencies available across all regional portals
        </p>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Currencies</CardTitle>
                <CardDescription>
                  Add and manage currencies that regions can use
                </CardDescription>
              </div>
              <CreateCurrencyDialog />
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search currencies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Decimals</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCurrencies?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No currencies found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCurrencies?.map((currency) => (
                        <TableRow key={currency.id}>
                          <TableCell className="font-mono font-semibold">
                            {currency.code}
                          </TableCell>
                          <TableCell>{currency.name}</TableCell>
                          <TableCell className="text-lg">{currency.symbol}</TableCell>
                          <TableCell>{currency.decimal_places}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={currency.is_active}
                                onCheckedChange={() => handleToggleStatus(currency)}
                                disabled={toggleStatusMutation.isPending}
                              />
                              <Badge
                                variant={currency.is_active ? 'default' : 'secondary'}
                              >
                                {currency.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingCurrency(currency)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {editingCurrency && (
        <EditCurrencyDialog
          currency={editingCurrency}
          open={!!editingCurrency}
          onOpenChange={(open) => !open && setEditingCurrency(null)}
        />
      )}
    </SuperAdminLayout>
  );
}
