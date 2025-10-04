
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, DollarSign, Home, MapPin, TrendingUp, TrendingDown, Banknote } from 'lucide-react';
import { formatCurrencyWithSymbol } from '@/utils/currencyUtils';
import type { Currency } from '@/hooks/useCurrencies';

interface KPIData {
  members: {
    total: number;
    new: number;
    active: number;
    growth: number;
  };
  events: {
    total: number;
    upcoming: number;
    attendance: number;
    completion: number;
  };
  finance: {
    income: number;
    expenses: number;
    balance: number;
    growth: number;
  };
  dcg: {
    total: number;
    active: number;
    members: number;
    attendance: number;
  };
  locations: {
    total: number;
    active: number;
    capacity: number;
    utilization: number;
  };
}

interface KPICardsProps {
  data: KPIData;
  activeTab: string;
  bankBalance: number;
  selectedPeriod: string;
  regionCurrency?: Currency | null;
}

const KPICards: React.FC<KPICardsProps> = ({ data, activeTab, bankBalance, selectedPeriod, regionCurrency }) => {
  const formatCurrency = (amount: number) => {
    return formatCurrencyWithSymbol(amount, regionCurrency);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getTabSpecificCards = () => {
    switch (activeTab) {
      case 'members':
        return [
          {
            title: "Total Members",
            value: data.members.total.toLocaleString(),
            description: `+${data.members.new} new this month`,
            icon: Users,
            trend: data.members.growth,
            color: "text-blue-600"
          },
          {
            title: "Active Members",
            value: data.members.active.toLocaleString(),
            description: `${((data.members.active / data.members.total) * 100).toFixed(1)}% of total`,
            icon: Users,
            trend: null,
            color: "text-green-600"
          },
          {
            title: "Growth Rate",
            value: formatPercentage(data.members.growth),
            description: "Month over month",
            icon: TrendingUp,
            trend: data.members.growth,
            color: data.members.growth >= 0 ? "text-green-600" : "text-red-600"
          }
        ];
      case 'events':
        return [
          {
            title: "Total Events",
            value: data.events.total.toLocaleString(),
            description: `${data.events.upcoming} upcoming`,
            icon: Calendar,
            trend: null,
            color: "text-purple-600"
          },
          {
            title: "Avg Attendance",
            value: data.events.attendance.toLocaleString(),
            description: "Per event",
            icon: Users,
            trend: null,
            color: "text-blue-600"
          },
          {
            title: "Completion Rate",
            value: `${data.events.completion}%`,
            description: "Events completed",
            icon: TrendingUp,
            trend: data.events.completion - 85,
            color: "text-green-600"
          }
        ];
      case 'finance':
        return [
          {
            title: "Bank Balance",
            value: formatCurrency(bankBalance),
            description: "Current available balance",
            icon: Banknote,
            trend: null,
            color: "text-emerald-600"
          },
          {
            title: "Total Income",
            value: formatCurrency(data.finance.income),
            description: "This period",
            icon: DollarSign,
            trend: data.finance.growth,
            color: "text-green-600"
          },
          {
            title: "Total Expenses",
            value: formatCurrency(data.finance.expenses),
            description: "This period",
            icon: DollarSign,
            trend: null,
            color: "text-red-600"
          },
          {
            title: "Net Balance",
            value: formatCurrency(data.finance.balance),
            description: formatPercentage(data.finance.growth) + " from last period",
            icon: data.finance.balance >= 0 ? TrendingUp : TrendingDown,
            trend: data.finance.growth,
            color: data.finance.balance >= 0 ? "text-green-600" : "text-red-600"
          }
        ];
      case 'dcg':
        return [
          {
            title: "Total DCGs",
            value: data.dcg.total.toLocaleString(),
            description: `${data.dcg.active} active`,
            icon: Home,
            trend: null,
            color: "text-orange-600"
          },
          {
            title: "DCG Members",
            value: data.dcg.members.toLocaleString(),
            description: `Avg ${Math.round(data.dcg.members / data.dcg.total)} per DCG`,
            icon: Users,
            trend: null,
            color: "text-blue-600"
          },
          {
            title: "Attendance Rate",
            value: `${data.dcg.attendance}%`,
            description: "Average across DCGs",
            icon: TrendingUp,
            trend: data.dcg.attendance - 80,
            color: "text-green-600"
          },
          {
            title: "DCG Growth Rate",
            value: `+${Math.max(0, Math.round((data.dcg.total - data.dcg.active) * 0.1))}%`,
            description: "New DCGs this period",
            icon: TrendingUp,
            trend: Math.max(0, Math.round((data.dcg.total - data.dcg.active) * 0.1)),
            color: "text-purple-600"
          }
        ];
      case 'locations':
        return [
          {
            title: "Total Locations",
            value: data.locations.total.toLocaleString(),
            description: `${data.locations.active} active`,
            icon: MapPin,
            trend: null,
            color: "text-indigo-600"
          },
          {
            title: "Total Capacity",
            value: data.locations.capacity.toLocaleString(),
            description: "Combined capacity",
            icon: Users,
            trend: null,
            color: "text-blue-600"
          },
          {
            title: "Utilization Rate",
            value: `${data.locations.utilization}%`,
            description: "Capacity utilization",
            icon: TrendingUp,
            trend: data.locations.utilization - 70,
            color: "text-green-600"
          }
        ];
      default:
        return [
          {
            title: "Total Members",
            value: data.members.total.toLocaleString(),
            description: `+${data.members.new} new this month`,
            icon: Users,
            trend: data.members.growth,
            color: "text-blue-600"
          },
          {
            title: "Upcoming Events",
            value: data.events.upcoming.toLocaleString(),
            description: "Next 30 days",
            icon: Calendar,
            trend: null,
            color: "text-purple-600"
          },
          {
            title: "Monthly Income",
            value: formatCurrency(data.finance.income),
            description: formatPercentage(data.finance.growth) + " from last month",
            icon: DollarSign,
            trend: data.finance.growth,
            color: "text-green-600"
          },
          {
            title: "Active DCGs",
            value: data.dcg.active.toLocaleString(),
            description: `${data.dcg.attendance}% avg attendance`,
            icon: Home,
            trend: null,
            color: "text-orange-600"
          }
        ];
    }
  };

  const cards = getTabSpecificCards();

  // Don't render KPI cards for events, members, overview, fundraising, and discipleship tabs
  if (activeTab === 'events' || activeTab === 'members' || activeTab === 'overview' || activeTab === 'fundraising' || activeTab === 'discipleship') {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const IconComponent = card.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <IconComponent className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
              {card.trend !== null && (
                <div className={`text-xs mt-1 ${card.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {card.trend >= 0 ? '↗' : '↘'} {Math.abs(card.trend).toFixed(1)}%
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default KPICards;
