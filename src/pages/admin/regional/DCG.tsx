
import React, { useState } from "react";
import RegionalAdminLayout from "@/components/admin/RegionalAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Home, 
  Users, 
  Calendar,
  DollarSign, 
  FileText, 
  BarChart2,
  PlusCircle,
  Search,
  MapPin,
  Phone,
  Mail,
  UserPlus,
  Edit,
  Trash2,
  Eye
} from "lucide-react";

// Mock data for DCGs
const mockDcgs = [
  { 
    id: 1, 
    name: "Victory DCG", 
    leader: "John Smith", 
    location: "123 Main St", 
    members: 15, 
    meetingDay: "Tuesday", 
    meetingTime: "6:00 PM",
    attendance: "85%",
    contact: "+1234567890"
  },
  { 
    id: 2, 
    name: "Faith DCG", 
    leader: "Sarah Johnson", 
    location: "456 Oak Ave", 
    members: 12, 
    meetingDay: "Wednesday", 
    meetingTime: "7:00 PM",
    attendance: "78%",
    contact: "+1234567891"
  },
  { 
    id: 3, 
    name: "Hope DCG", 
    leader: "Michael Brown", 
    location: "789 Pine Rd", 
    members: 18, 
    meetingDay: "Thursday", 
    meetingTime: "7:30 PM",
    attendance: "92%",
    contact: "+1234567892"
  },
  { 
    id: 4, 
    name: "Grace DCG", 
    leader: "Jennifer Lee", 
    location: "321 Maple Dr", 
    members: 10, 
    meetingDay: "Monday", 
    meetingTime: "6:30 PM",
    attendance: "65%",
    contact: "+1234567893"
  },
];

// Mock data for attendance
const mockAttendance = [
  { 
    dcgId: 1, 
    dcgName: "Victory DCG", 
    date: "2023-09-05", 
    present: 12, 
    absent: 3, 
    rate: "80%",
  },
  { 
    dcgId: 1, 
    dcgName: "Victory DCG", 
    date: "2023-09-12", 
    present: 15, 
    absent: 0, 
    rate: "100%",
  },
  { 
    dcgId: 2, 
    dcgName: "Faith DCG", 
    date: "2023-09-06", 
    present: 10, 
    absent: 2, 
    rate: "83%",
  },
  { 
    dcgId: 2, 
    dcgName: "Faith DCG", 
    date: "2023-09-13", 
    present: 9, 
    absent: 3, 
    rate: "75%",
  },
];

// Mock data for financial transactions
const mockFinancials = [
  { 
    id: 1,
    dcgId: 1, 
    dcgName: "Victory DCG", 
    date: "2023-09-05", 
    type: "Tithe", 
    amount: 350, 
    description: "Weekly collection"
  },
  { 
    id: 2,
    dcgId: 1, 
    dcgName: "Victory DCG", 
    date: "2023-09-05", 
    type: "Offering", 
    amount: 120, 
    description: "Weekly collection"
  },
  { 
    id: 3,
    dcgId: 2, 
    dcgName: "Faith DCG", 
    date: "2023-09-06", 
    type: "Tithe", 
    amount: 275, 
    description: "Weekly collection"
  },
  { 
    id: 4,
    dcgId: 3, 
    dcgName: "Hope DCG", 
    date: "2023-09-07", 
    type: "Project Fund", 
    amount: 500, 
    description: "Building project contribution"
  },
];

const RegionalDCG: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDcg, setSelectedDcg] = useState<number | null>(null);

  // Filter DCGs based on search term
  const filteredDcgs = mockDcgs.filter(dcg =>
    dcg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dcg.leader.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dcg.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <RegionalAdminLayout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">DCG Management</h2>
        <p className="text-muted-foreground">
          Manage Destiny Care Groups in your region.
        </p>
        
        <Tabs defaultValue="overview">
          <TabsList className="w-full grid grid-cols-2 md:grid-cols-5 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="dcg-list">DCG List</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="financials">Financials</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>DCG Overview</CardTitle>
                <CardDescription>
                  At-a-glance summary of your region's DCGs.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg shadow p-4 border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Total DCGs</p>
                        <p className="text-2xl font-bold">{mockDcgs.length}</p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-full">
                        <Home className="h-6 w-6 text-blue-500" />
                      </div>
                    </div>
                    <p className="text-xs text-green-500 mt-2">+2 from last month</p>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow p-4 border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Total Members</p>
                        <p className="text-2xl font-bold">{mockDcgs.reduce((acc, dcg) => acc + dcg.members, 0)}</p>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-full">
                        <Users className="h-6 w-6 text-purple-500" />
                      </div>
                    </div>
                    <p className="text-xs text-green-500 mt-2">+5 from last month</p>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow p-4 border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Avg. Attendance</p>
                        <p className="text-2xl font-bold">82%</p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-full">
                        <Calendar className="h-6 w-6 text-green-500" />
                      </div>
                    </div>
                    <p className="text-xs text-green-500 mt-2">+3% from last month</p>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow p-4 border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Total Offerings</p>
                        <p className="text-2xl font-bold">$1,245</p>
                      </div>
                      <div className="p-3 bg-yellow-100 rounded-full">
                        <DollarSign className="h-6 w-6 text-yellow-500" />
                      </div>
                    </div>
                    <p className="text-xs text-green-500 mt-2">+$120 from last month</p>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
                  <div className="rounded-md border overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>DCG Name</TableHead>
                            <TableHead>Activity</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">Victory DCG</TableCell>
                            <TableCell>Weekly Meeting</TableCell>
                            <TableCell>Yesterday</TableCell>
                            <TableCell><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Completed</span></TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Faith DCG</TableCell>
                            <TableCell>Outreach Program</TableCell>
                            <TableCell>2 days ago</TableCell>
                            <TableCell><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Completed</span></TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Hope DCG</TableCell>
                            <TableCell>Bible Study</TableCell>
                            <TableCell>3 days ago</TableCell>
                            <TableCell><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Completed</span></TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Grace DCG</TableCell>
                            <TableCell>Prayer Meeting</TableCell>
                            <TableCell>4 days ago</TableCell>
                            <TableCell><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Completed</span></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="dcg-list">
            <Card>
              <CardHeader>
                <CardTitle>DCG Directory</CardTitle>
                <CardDescription>
                  Complete listing of all DCGs in your region.
                </CardDescription>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search DCGs..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New DCG
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Leader</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Members</TableHead>
                          <TableHead>Meeting Schedule</TableHead>
                          <TableHead>Attendance</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDcgs.length > 0 ? (
                          filteredDcgs.map((dcg) => (
                            <TableRow key={dcg.id}>
                              <TableCell className="font-medium">{dcg.name}</TableCell>
                              <TableCell>{dcg.leader}</TableCell>
                              <TableCell>{dcg.location}</TableCell>
                              <TableCell>{dcg.members}</TableCell>
                              <TableCell>{dcg.meetingDay}, {dcg.meetingTime}</TableCell>
                              <TableCell>{dcg.attendance}</TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Phone className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center h-24">
                              No DCGs found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Tracking</CardTitle>
                <CardDescription>
                  Track and monitor attendance across all DCGs.
                </CardDescription>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <div className="flex-1">
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">All DCGs</option>
                      {mockDcgs.map(dcg => (
                        <option key={dcg.id} value={dcg.id}>{dcg.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex-1">
                    <Input
                      type="date"
                      className="flex h-10 w-full"
                    />
                  </div>
                  
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Record Attendance
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>DCG Name</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Present</TableHead>
                          <TableHead>Absent</TableHead>
                          <TableHead>Attendance Rate</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockAttendance.map((record, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{record.dcgName}</TableCell>
                            <TableCell>{record.date}</TableCell>
                            <TableCell>{record.present}</TableCell>
                            <TableCell>{record.absent}</TableCell>
                            <TableCell>{record.rate}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="financials">
            <Card>
              <CardHeader>
                <CardTitle>DCG Financials</CardTitle>
                <CardDescription>
                  Financial management for DCGs.
                </CardDescription>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <div className="flex-1">
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">All DCGs</option>
                      {mockDcgs.map(dcg => (
                        <option key={dcg.id} value={dcg.id}>{dcg.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex-1">
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">All Transaction Types</option>
                      <option value="tithe">Tithe</option>
                      <option value="offering">Offering</option>
                      <option value="project">Project Fund</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Transaction
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-lg shadow p-4 border">
                    <p className="text-sm text-gray-500">Total Tithe</p>
                    <p className="text-2xl font-bold">$625.00</p>
                    <p className="text-xs text-green-500 mt-2">+$75 from last month</p>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow p-4 border">
                    <p className="text-sm text-gray-500">Total Offering</p>
                    <p className="text-2xl font-bold">$425.00</p>
                    <p className="text-xs text-green-500 mt-2">+$50 from last month</p>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow p-4 border">
                    <p className="text-sm text-gray-500">Project Funds</p>
                    <p className="text-2xl font-bold">$500.00</p>
                    <p className="text-xs text-green-500 mt-2">New this month</p>
                  </div>
                </div>

                <div className="rounded-md border overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>DCG Name</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockFinancials.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-medium">{transaction.dcgName}</TableCell>
                            <TableCell>{transaction.date}</TableCell>
                            <TableCell>{transaction.type}</TableCell>
                            <TableCell>${transaction.amount.toFixed(2)}</TableCell>
                            <TableCell>{transaction.description}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>DCG Reports</CardTitle>
                <CardDescription>
                  Generate and view reports for your DCGs.
                </CardDescription>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <div className="flex-1">
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select Report Type</option>
                      <option value="attendance">Attendance Report</option>
                      <option value="financial">Financial Report</option>
                      <option value="growth">Growth Report</option>
                      <option value="activity">Activity Report</option>
                    </select>
                  </div>
                  
                  <div className="flex-1">
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">All DCGs</option>
                      {mockDcgs.map(dcg => (
                        <option key={dcg.id} value={dcg.id}>{dcg.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <Button>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Report
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-8 text-center rounded-md border">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900">No Reports Generated Yet</h3>
                  <p className="text-gray-500 mt-2 mb-4">Select a report type and click "Generate Report" to get started</p>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-4">Available Report Templates</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-md border">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-md">
                          <BarChart2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">Attendance Report</h4>
                          <p className="text-sm text-gray-500">Weekly/Monthly stats</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-md border">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-md">
                          <DollarSign className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">Financial Report</h4>
                          <p className="text-sm text-gray-500">Income & expenses</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-md border">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-100 rounded-md">
                          <Users className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">Growth Report</h4>
                          <p className="text-sm text-gray-500">Membership trends</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-md border">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-yellow-100 rounded-md">
                          <Calendar className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">Activity Report</h4>
                          <p className="text-sm text-gray-500">Events & meetings</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RegionalAdminLayout>
  );
};

export default RegionalDCG;
