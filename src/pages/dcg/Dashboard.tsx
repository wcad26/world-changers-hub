import React from 'react';
import DcgAdminLayout from '@/components/admin/DcgAdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const DcgDashboard = () => {
  const { profile } = useAuth();

  const stats = [
    {
      title: "Total Members",
      value: "24",
      description: "Active DCG members",
      icon: Users,
      trend: "+2 this month"
    },
    {
      title: "Upcoming Events",
      value: "3",
      description: "Events this month",
      icon: Calendar,
      trend: "2 this week"
    },
    {
      title: "Total Contributions",
      value: "$2,450",
      description: "This month",
      icon: DollarSign,
      trend: "+15% from last month"
    },
    {
      title: "Attendance Rate",
      value: "87%",
      description: "Average attendance",
      icon: TrendingUp,
      trend: "+5% improvement"
    }
  ];

  return (
    <DcgAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">DCG Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.first_name}! Here's your DCG overview.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
                <div className="text-xs text-primary font-medium mt-1">
                  {stat.trend}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>
                Latest updates from your DCG
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">New member joined</p>
                    <p className="text-xs text-muted-foreground">John Doe joined the DCG</p>
                  </div>
                  <div className="text-xs text-muted-foreground">2 hours ago</div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Weekly meeting completed</p>
                    <p className="text-xs text-muted-foreground">Sunday worship attendance recorded</p>
                  </div>
                  <div className="text-xs text-muted-foreground">1 day ago</div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Monthly report submitted</p>
                    <p className="text-xs text-muted-foreground">November report sent to regional office</p>
                  </div>
                  <div className="text-xs text-muted-foreground">3 days ago</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks for DCG management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <button className="w-full text-left p-3 border rounded-lg hover:bg-accent transition-colors">
                  <div className="font-medium">Record Attendance</div>
                  <div className="text-xs text-muted-foreground">Mark attendance for today's meeting</div>
                </button>
                <button className="w-full text-left p-3 border rounded-lg hover:bg-accent transition-colors">
                  <div className="font-medium">Add New Member</div>
                  <div className="text-xs text-muted-foreground">Register a new DCG member</div>
                </button>
                <button className="w-full text-left p-3 border rounded-lg hover:bg-accent transition-colors">
                  <div className="font-medium">Schedule Event</div>
                  <div className="text-xs text-muted-foreground">Create a new DCG event</div>
                </button>
                <button className="w-full text-left p-3 border rounded-lg hover:bg-accent transition-colors">
                  <div className="font-medium">Financial Record</div>
                  <div className="text-xs text-muted-foreground">Add income or expense entry</div>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DcgAdminLayout>
  );
};

export default DcgDashboard;