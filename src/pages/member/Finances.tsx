import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinancialTransactions, useFinancialSummary } from '@/hooks/useFinancials';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { DollarSign, TrendingUp, Gift, Heart, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRegionCurrency } from '@/hooks/useCurrencies';
import { formatWithCurrency } from '@/utils/currencyUtils';
export default function MemberFinances() {
  const {
    userRegion
  } = useAuth();
  const {
    data: regionCurrency
  } = useRegionCurrency(userRegion?.id);
  const [dateFilter, setDateFilter] = useState('3months');

  // Calculate date range based on filter
  const getDateRange = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    switch (dateFilter) {
      case '1month':
        return {
          from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
          to: new Date().toISOString().split('T')[0]
        };
      case '3months':
        return {
          from: new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split('T')[0],
          to: new Date().toISOString().split('T')[0]
        };
      case '6months':
        return {
          from: new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split('T')[0],
          to: new Date().toISOString().split('T')[0]
        };
      case 'ytd':
        return {
          from: `${currentYear}-01-01`,
          to: new Date().toISOString().split('T')[0]
        };
      case 'lastyear':
        return {
          from: `${currentYear - 1}-01-01`,
          to: `${currentYear - 1}-12-31`
        };
      default:
        return {
          from: new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split('T')[0],
          to: new Date().toISOString().split('T')[0]
        };
    }
  };
  const dateRange = getDateRange();
  const {
    data: transactions,
    isLoading: transactionsLoading
  } = useFinancialTransactions(dateRange);
  const {
    data: summary,
    isLoading: summaryLoading
  } = useFinancialSummary(dateRange);
  if (transactionsLoading || summaryLoading) {
    return <div className="space-y-6 p-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>;
  }
  return <div className="space-y-6 p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">My Giving</h1>
        <p className="text-muted-foreground">
          Track your tithes, offerings, and contributions to {userRegion?.name}
        </p>
      </div>

      {/* Period Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1month">Last Month</SelectItem>
            <SelectItem value="3months">Last 3 Months</SelectItem>
            <SelectItem value="6months">Last 6 Months</SelectItem>
            <SelectItem value="ytd">Year to Date</SelectItem>
            <SelectItem value="lastyear">Last Year</SelectItem>
          </SelectContent>
        </Select>
        
        <Button className="w-full sm:w-auto">
          <DollarSign className="w-4 h-4 mr-2" />
          Give Now
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Heart className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tithes</p>
                <p className="text-xl font-bold">{formatWithCurrency(summary?.total_tithes || 0, regionCurrency)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Gift className="w-8 h-8 text-secondary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Offerings</p>
                <p className="text-xl font-bold">{formatWithCurrency(summary?.total_offerings || 0, regionCurrency)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-8 h-8 text-accent" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Special Giving</p>
                <p className="text-xl font-bold">{formatWithCurrency(summary?.total_special_giving || 0, regionCurrency)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Given</p>
                <p className="text-xl font-bold">{formatWithCurrency(summary?.total_income || 0, regionCurrency)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Giving History</CardTitle>
          <CardDescription>
            Your recent tithes, offerings, and contributions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions && transactions.length > 0 ? <div className="space-y-4">
              {transactions.map((transaction: any) => <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg px-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {transaction.category?.name || 'Unknown Category'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(transaction.transaction_date), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    {transaction.description && <p className="text-sm text-muted-foreground">{transaction.description}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      +{formatWithCurrency(Number(transaction.amount), regionCurrency)}
                    </p>
                  </div>
                </div>)}
            </div> : <div className="text-center py-8">
              <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No giving history found for this period</p>
              <Button className="mt-4">
                <DollarSign className="w-4 h-4 mr-2" />
                Make Your First Contribution
              </Button>
            </div>}
        </CardContent>
      </Card>

      {/* Give Online Section */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        
      </Card>
    </div>;
}