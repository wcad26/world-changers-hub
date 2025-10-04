
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import FinancialTrendChart from './FinancialTrendChart';
import { useAuth } from '@/hooks/useAuth';
import { useRegionCurrency } from '@/hooks/useCurrencies';
import { formatWithCurrency } from '@/utils/currencyUtils';

interface FinanceTabProps {
  selectedPeriod: string;
}

const FinanceTab: React.FC<FinanceTabProps> = ({ selectedPeriod }) => {
  const { userRegion } = useAuth();
  const { data: regionCurrency } = useRegionCurrency(userRegion?.id);
  
  // Mock financial summary data
  const mockSummaryData = {
    totalIncome: 58000,
    totalExpenses: 39000,
    netBalance: 19000,
    monthlyGrowth: 12.5,
    topExpenseCategory: 'Operations',
    topIncomeSource: 'Tithes & Offerings',
    transactionCount: 247,
    avgTransactionSize: 234
  };

  const formatCurrency = (amount: number) => {
    return formatWithCurrency(amount, regionCurrency);
  };

  return (
    <div className="space-y-6">
      {/* Financial Trend Chart */}
      <FinancialTrendChart selectedPeriod={selectedPeriod} regionCurrency={regionCurrency} />
      
      {/* Financial Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
          <CardDescription>Financial overview for {selectedPeriod}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Income & Expenses */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Income & Expenses</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Income</span>
                  <span className="font-semibold text-green-600">{formatCurrency(mockSummaryData.totalIncome)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Expenses</span>
                  <span className="font-semibold text-red-600">{formatCurrency(mockSummaryData.totalExpenses)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-medium">Net Balance</span>
                  <span className="font-bold text-blue-600">{formatCurrency(mockSummaryData.netBalance)}</span>
                </div>
              </div>
            </div>

            {/* Growth & Trends */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Growth & Trends</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Monthly Growth</span>
                  <span className="font-semibold text-green-600">+{mockSummaryData.monthlyGrowth}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Transaction Count</span>
                  <span className="font-semibold">{mockSummaryData.transactionCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Avg. Transaction</span>
                  <span className="font-semibold">{formatCurrency(mockSummaryData.avgTransactionSize)}</span>
                </div>
              </div>
            </div>

            {/* Top Categories */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Top Categories</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Top Income Source</span>
                  <span className="font-semibold text-green-600">{mockSummaryData.topIncomeSource}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Top Expense Category</span>
                  <span className="font-semibold text-red-600">{mockSummaryData.topExpenseCategory}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Period</span>
                  <span className="font-semibold text-blue-600">{selectedPeriod}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinanceTab;
