
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRegionStats } from '@/hooks/useRegionStats';
import { Globe, TrendingUp, Users, MapPin } from 'lucide-react';

const RegionStatsCards: React.FC = () => {
  const { data: stats, isLoading } = useRegionStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      title: 'Total Regions',
      value: stats.totalRegions,
      description: `${stats.activeRegions} active, ${stats.inactiveRegions} inactive`,
      icon: Globe,
      color: 'text-blue-600'
    },
    {
      title: 'Recently Added',
      value: stats.recentlyAdded,
      description: 'Last 30 days',
      icon: TrendingUp,
      color: 'text-green-600'
    },
    {
      title: 'With Members',
      value: stats.regionsWithMembers,
      description: 'Regions with active members',
      icon: Users,
      color: 'text-purple-600'
    },
    {
      title: 'With DCGs',
      value: stats.regionsWithDCGs,
      description: 'Regions with DCG groups',
      icon: MapPin,
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default RegionStatsCards;
