
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import FinancialTrendChart from './FinancialTrendChart';

interface FinanceTabProps {
  selectedPeriod: string;
}

const FinanceTab: React.FC<FinanceTabProps> = ({ selectedPeriod }) => {
  return (
    <div className="space-y-6">
      {/* Financial Trend Chart */}
      <FinancialTrendChart selectedPeriod={selectedPeriod} />
      
      {/* Financial Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
          <CardDescription>Overview for {selectedPeriod}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Financial data for {selectedPeriod} will be displayed here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinanceTab;
