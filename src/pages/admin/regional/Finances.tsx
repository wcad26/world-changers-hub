import React, { useState } from "react";
import RegionalAdminLayout from "@/components/admin/RegionalAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { DollarSign, Calendar, Receipt, PiggyBank, Download, ArrowUpRight, Filter, TrendingUp, Search } from "lucide-react";
import { BarChart, LineChart, PieChart } from "@/components/ui/chart";

// Mock data for demonstration
const mockTithes = [{
  id: 1,
  date: "2023-10-22",
  member: "John Smith",
  amount: 500,
  method: "Bank Transfer",
  reference: "T2023-0145"
}, {
  id: 2,
  date: "2023-10-22",
  member: "Sarah Johnson",
  amount: 350,
  method: "Cash",
  reference: "T2023-0146"
}, {
  id: 3,
  date: "2023-10-15",
  member: "Michael Brown",
  amount: 450,
  method: "Credit Card",
  reference: "T2023-0142"
}, {
  id: 4,
  date: "2023-10-15",
  member: "Emily Wilson",
  amount: 300,
  method: "Bank Transfer",
  reference: "T2023-0143"
}];
const mockOfferings = [{
  id: 1,
  date: "2023-10-22",
  service: "Sunday Morning",
  amount: 2500,
  category: "General",
  reference: "O2023-0145"
}, {
  id: 2,
  date: "2023-10-22",
  service: "Sunday Evening",
  amount: 1200,
  category: "General",
  reference: "O2023-0146"
}, {
  id: 3,
  date: "2023-10-15",
  service: "Sunday Morning",
  amount: 2350,
  category: "General",
  reference: "O2023-0142"
}, {
  id: 4,
  date: "2023-10-15",
  service: "Midweek",
  amount: 850,
  category: "General",
  reference: "O2023-0143"
}];
const mockSpecialGiving = [{
  id: 1,
  date: "2023-10-20",
  fund: "Building Fund",
  amount: 5000,
  donor: "John & Mary Smith",
  reference: "S2023-0045"
}, {
  id: 2,
  date: "2023-10-18",
  fund: "Mission Fund",
  amount: 2500,
  donor: "Anonymous",
  reference: "S2023-0046"
}, {
  id: 3,
  date: "2023-10-10",
  fund: "Youth Camp",
  amount: 1500,
  donor: "Robert Johnson",
  reference: "S2023-0043"
}, {
  id: 4,
  date: "2023-10-05",
  fund: "Building Fund",
  amount: 3000,
  donor: "Sarah Williams",
  reference: "S2023-0042"
}];
const mockExpenses = [{
  id: 1,
  date: "2023-10-21",
  category: "Utilities",
  description: "Electricity Bill",
  amount: 850,
  payee: "Power Company",
  reference: "E2023-0245"
}, {
  id: 2,
  date: "2023-10-18",
  category: "Maintenance",
  description: "Plumbing Repairs",
  amount: 1200,
  payee: "City Plumbers",
  reference: "E2023-0244"
}, {
  id: 3,
  date: "2023-10-15",
  category: "Office",
  description: "Office Supplies",
  amount: 350,
  payee: "Office Store",
  reference: "E2023-0243"
}, {
  id: 4,
  date: "2023-10-10",
  category: "Ministry",
  description: "Youth Event Supplies",
  amount: 500,
  payee: "Party Supplies",
  reference: "E2023-0242"
}];

// Form schema for tithe recording
const titheSchema = z.object({
  date: z.string().min(1, {
    message: "Date is required"
  }),
  memberId: z.string().min(1, {
    message: "Please select a member"
  }),
  amount: z.string().min(1, {
    message: "Amount is required"
  }),
  method: z.string().min(1, {
    message: "Please select a payment method"
  }),
  notes: z.string().optional()
});

// Form schema for offering recording
const offeringSchema = z.object({
  date: z.string().min(1, {
    message: "Date is required"
  }),
  service: z.string().min(1, {
    message: "Please select a service"
  }),
  amount: z.string().min(1, {
    message: "Amount is required"
  }),
  category: z.string().min(1, {
    message: "Please select a category"
  }),
  notes: z.string().optional()
});

// Form schema for special giving recording
const specialGivingSchema = z.object({
  date: z.string().min(1, {
    message: "Date is required"
  }),
  fund: z.string().min(1, {
    message: "Please select a fund"
  }),
  amount: z.string().min(1, {
    message: "Amount is required"
  }),
  donorId: z.string().optional(),
  isAnonymous: z.boolean().default(false),
  notes: z.string().optional()
});

// Form schema for expense recording
const expenseSchema = z.object({
  date: z.string().min(1, {
    message: "Date is required"
  }),
  category: z.string().min(1, {
    message: "Please select a category"
  }),
  description: z.string().min(3, {
    message: "Description is required"
  }),
  amount: z.string().min(1, {
    message: "Amount is required"
  }),
  payee: z.string().min(3, {
    message: "Payee is required"
  }),
  receiptImage: z.string().optional(),
  notes: z.string().optional()
});
const RegionalFinances: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const titheForm = useForm<z.infer<typeof titheSchema>>({
    resolver: zodResolver(titheSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      memberId: "",
      amount: "",
      method: "",
      notes: ""
    }
  });
  const offeringForm = useForm<z.infer<typeof offeringSchema>>({
    resolver: zodResolver(offeringSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      service: "",
      amount: "",
      category: "",
      notes: ""
    }
  });
  const specialGivingForm = useForm<z.infer<typeof specialGivingSchema>>({
    resolver: zodResolver(specialGivingSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      fund: "",
      amount: "",
      donorId: "",
      isAnonymous: false,
      notes: ""
    }
  });
  const expenseForm = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      category: "",
      description: "",
      amount: "",
      payee: "",
      receiptImage: "",
      notes: ""
    }
  });
  function onTitheSubmit(values: z.infer<typeof titheSchema>) {
    console.log(values);
    // In a real app, this would save the tithe to a database
    alert("Tithe recorded successfully!");
    titheForm.reset({
      date: new Date().toISOString().split('T')[0],
      memberId: "",
      amount: "",
      method: "",
      notes: ""
    });
  }
  function onOfferingSubmit(values: z.infer<typeof offeringSchema>) {
    console.log(values);
    // In a real app, this would save the offering to a database
    alert("Offering recorded successfully!");
    offeringForm.reset({
      date: new Date().toISOString().split('T')[0],
      service: "",
      amount: "",
      category: "",
      notes: ""
    });
  }
  function onSpecialGivingSubmit(values: z.infer<typeof specialGivingSchema>) {
    console.log(values);
    // In a real app, this would save the special giving to a database
    alert("Special giving recorded successfully!");
    specialGivingForm.reset({
      date: new Date().toISOString().split('T')[0],
      fund: "",
      amount: "",
      donorId: "",
      isAnonymous: false,
      notes: ""
    });
  }
  function onExpenseSubmit(values: z.infer<typeof expenseSchema>) {
    console.log(values);
    // In a real app, this would save the expense to a database
    alert("Expense recorded successfully!");
    expenseForm.reset({
      date: new Date().toISOString().split('T')[0],
      category: "",
      description: "",
      amount: "",
      payee: "",
      receiptImage: "",
      notes: ""
    });
  }
  return <RegionalAdminLayout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Financial Management</h2>
        <p className="text-muted-foreground">
          Manage all financial aspects of your region.
        </p>
        
        <Tabs defaultValue="overview">
          <TabsList className="grid grid-cols-1 md:grid-cols-6 w-full max-w-4xl">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tithes">Tithes</TabsTrigger>
            <TabsTrigger value="offerings">Offerings</TabsTrigger>
            
            
            
          </TabsList>
          
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Financial Overview</CardTitle>
                <CardDescription>
                  Summary of your region's financial standing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Income (Monthly)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">$27,500</div>
                      <p className="text-xs text-muted-foreground mt-1">↑ $1,250 from last month</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Expenses (Monthly)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">$22,750</div>
                      <p className="text-xs text-muted-foreground mt-1">↑ $950 from last month</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Net Balance (Monthly)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">$4,750</div>
                      <p className="text-xs text-muted-foreground mt-1">17.3% of total income</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Current Account Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">$42,500</div>
                      <p className="text-xs text-muted-foreground mt-1">↑ $4,750 from last month</p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Income Distribution</CardTitle>
                      <CardDescription>
                        Breakdown of monthly income by category
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[250px]">
                        <PieChart data={[{
                        category: "Tithes",
                        value: 15000
                      }, {
                        category: "Offerings",
                        value: 7500
                      }, {
                        category: "Special Giving",
                        value: 3500
                      }, {
                        category: "Other",
                        value: 1500
                      }]} index="category" categories={["value"]} colors={["#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe"]} valueFormatter={value => `$${value.toLocaleString()}`} className="h-full" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Expense Distribution</CardTitle>
                      <CardDescription>
                        Breakdown of monthly expenses by category
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[250px]">
                        <PieChart data={[{
                        category: "Staffing",
                        value: 12000
                      }, {
                        category: "Facilities",
                        value: 4500
                      }, {
                        category: "Ministries",
                        value: 3250
                      }, {
                        category: "Administration",
                        value: 1500
                      }, {
                        category: "Outreach",
                        value: 1500
                      }]} index="category" categories={["value"]} colors={["#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe"]} valueFormatter={value => `$${value.toLocaleString()}`} className="h-full" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Financial Trends</CardTitle>
                    <CardDescription>
                      Income vs. expenses over the past 12 months
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <LineChart data={[{
                      month: "Nov",
                      income: 25000,
                      expenses: 20500
                    }, {
                      month: "Dec",
                      income: 27500,
                      expenses: 22000
                    }, {
                      month: "Jan",
                      income: 24500,
                      expenses: 21000
                    }, {
                      month: "Feb",
                      income: 25000,
                      expenses: 20500
                    }, {
                      month: "Mar",
                      income: 26000,
                      expenses: 21500
                    }, {
                      month: "Apr",
                      income: 25500,
                      expenses: 21000
                    }, {
                      month: "May",
                      income: 26500,
                      expenses: 22000
                    }, {
                      month: "Jun",
                      income: 27000,
                      expenses: 22500
                    }, {
                      month: "Jul",
                      income: 26000,
                      expenses: 21500
                    }, {
                      month: "Aug",
                      income: 26500,
                      expenses: 22000
                    }, {
                      month: "Sep",
                      income: 27000,
                      expenses: 22500
                    }, {
                      month: "Oct",
                      income: 27500,
                      expenses: 22750
                    }]} index="month" categories={["income", "expenses"]} colors={["#8b5cf6", "#e11d48"]} valueFormatter={value => `$${value.toLocaleString()}`} className="h-full" />
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="tithes">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Record Tithe</CardTitle>
                  <CardDescription>
                    Record a new tithe payment from a member.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...titheForm}>
                    <form onSubmit={titheForm.handleSubmit(onTitheSubmit)} className="space-y-4">
                      <FormField control={titheForm.control} name="date" render={({
                      field
                    }) => <FormItem>
                            <FormLabel>Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />
                      
                      <FormField control={titheForm.control} name="memberId" render={({
                      field
                    }) => <FormItem>
                            <FormLabel>Member</FormLabel>
                            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" {...field}>
                              <option value="">Select a member</option>
                              <option value="1">John Smith</option>
                              <option value="2">Sarah Johnson</option>
                              <option value="3">Michael Brown</option>
                              <option value="4">Emily Wilson</option>
                              <option value="5">David Lee</option>
                            </select>
                            <FormMessage />
                          </FormItem>} />
                      
                      <FormField control={titheForm.control} name="amount" render={({
                      field
                    }) => <FormItem>
                            <FormLabel>Amount ($)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />
                      
                      <FormField control={titheForm.control} name="method" render={({
                      field
                    }) => <FormItem>
                            <FormLabel>Payment Method</FormLabel>
                            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" {...field}>
                              <option value="">Select payment method</option>
                              <option value="cash">Cash</option>
                              <option value="check">Check</option>
                              <option value="bank_transfer">Bank Transfer</option>
                              <option value="credit_card">Credit Card</option>
                              <option value="mobile_payment">Mobile Payment</option>
                            </select>
                            <FormMessage />
                          </FormItem>} />
                      
                      <FormField control={titheForm.control} name="notes" render={({
                      field
                    }) => <FormItem>
                            <FormLabel>Notes (Optional)</FormLabel>
                            <FormControl>
                              <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" placeholder="Any additional information" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />
                      
                      <div className="flex justify-end">
                        <Button type="submit">
                          <DollarSign className="mr-2 h-4 w-4" />
                          Record Tithe
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Recent Tithes</CardTitle>
                  <CardDescription>
                    View and manage recent tithe records.
                  </CardDescription>
                  <div className="mt-4">
                    <Input type="search" placeholder="Search tithes..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Member</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Reference</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mockTithes.length > 0 ? mockTithes.map(tithe => <TableRow key={tithe.id}>
                                <TableCell>{tithe.date}</TableCell>
                                <TableCell>{tithe.member}</TableCell>
                                <TableCell>${tithe.amount.toLocaleString()}</TableCell>
                                <TableCell>{tithe.method}</TableCell>
                                <TableCell>{tithe.reference}</TableCell>
                              </TableRow>) : <TableRow>
                              <TableCell colSpan={5} className="text-center h-24">
                                No tithes found
                              </TableCell>
                            </TableRow>}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button variant="outline">
                      <ArrowUpRight className="mr-2 h-4 w-4" />
                      View All Tithes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="offerings">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Record Offering</CardTitle>
                  <CardDescription>
                    Record a new offering collection.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...offeringForm}>
                    <form onSubmit={offeringForm.handleSubmit(onOfferingSubmit)} className="space-y-4">
                      <FormField control={offeringForm.control} name="date" render={({
                      field
                    }) => <FormItem>
                            <FormLabel>Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />
                      
                      <FormField control={offeringForm.control} name="service" render={({
                      field
                    }) => <FormItem>
                            <FormLabel>Service/Event</FormLabel>
                            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" {...field}>
                              <option value="">Select service/event</option>
                              <option value="sunday_morning">Sunday Morning</option>
                              <option value="sunday_evening">Sunday Evening</option>
                              <option value="midweek">Midweek Service</option>
                              <option value="prayer_meeting">Prayer Meeting</option>
                              <option value="special_event">Special Event</option>
                            </select>
                            <FormMessage />
                          </FormItem>} />
                      
                      <FormField control={offeringForm.control} name="amount" render={({
                      field
                    }) => <FormItem>
                            <FormLabel>Amount ($)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />
                      
                      <FormField control={offeringForm.control} name="category" render={({
                      field
                    }) => <FormItem>
                            <FormLabel>Category</FormLabel>
                            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" {...field}>
                              <option value="">Select category</option>
                              <option value="general">General</option>
                              <option value="missions">Missions</option>
                              <option value="building">Building Fund</option>
                              <option value="youth">Youth Ministry</option>
                              <option value="children">Children's Ministry</option>
                            </select>
                            <FormMessage />
                          </FormItem>} />
                      
                      <FormField control={offeringForm.control} name="notes" render={({
                      field
                    }) => <FormItem>
                            <FormLabel>Notes (Optional)</FormLabel>
                            <FormControl>
                              <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" placeholder="Any additional information" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />
                      
                      <div className="flex justify-end">
                        <Button type="submit">
                          <DollarSign className="mr-2 h-4 w-4" />
                          Record Offering
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Recent Offerings</CardTitle>
                  <CardDescription>
                    View and manage recent offering collections.
                  </CardDescription>
                  <div className="mt-4">
                    <Input type="search" placeholder="Search offerings..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Service</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Reference</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mockOfferings.length > 0 ? mockOfferings.map(offering => <TableRow key={offering.id}>
                                <TableCell>{offering.date}</TableCell>
                                <TableCell>{offering.service}</TableCell>
                                <TableCell>${offering.amount.toLocaleString()}</TableCell>
                                <TableCell>{offering.category}</TableCell>
                                <TableCell>{offering.reference}</TableCell>
                              </TableRow>) : <TableRow>
                              <TableCell colSpan={5} className="text-center h-24">
                                No offerings found
                              </TableCell>
                            </TableRow>}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button variant="outline">
                      <ArrowUpRight className="mr-2 h-4 w-4" />
                      View All Offerings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="special-giving">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Record Special Giving</CardTitle>
                  <CardDescription>
                    Record a new special donation or contribution.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...specialGivingForm}>
                    <form onSubmit={specialGivingForm.handleSubmit(onSpecialGivingSubmit)} className="space-y-4">
                      <FormField control={specialGivingForm.control} name="date" render={({
                      field
                    }) => <FormItem>
                            <FormLabel>Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />
                      
                      <FormField control={specialGivingForm.control} name="fund" render={({
                      field
                    }) => <FormItem>
                            <FormLabel>Fund/Project</FormLabel>
                            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" {...field}>
                              <option value="">Select fund/project</option>
                              <option value="building_fund">Building Fund</option>
                              <option value="missions">Mission Fund</option>
                              <option value="youth_camp">Youth Camp</option>
                              <option value="community_outreach">Community Outreach</option>
                              <option value="benevolence">Benevolence Fund</option>
                            </select>
                            <FormMessage />
                          </FormItem>} />
                      
                      <FormField control={specialGivingForm.control} name="amount" render={({
                      field
                    }) => <FormItem>
                            <FormLabel>Amount ($)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />
                      
                      <FormField control={specialGivingForm.control} name="isAnonymous" render={({
                      field
                    }) => <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <input type="checkbox" checked={field.value} onChange={e => {
                          field.onChange(e.target.checked);
                        }} className="h-4 w-4 mt-1" />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Anonymous Donor</FormLabel>
                              <FormDescription>
                                Check if the donor wishes to remain anonymous
                              </FormDescription>
                            </div>
                          </FormItem>} />
                      
                      {!specialGivingForm.watch("isAnonymous") && <FormField control={specialGivingForm.control} name="donorId" render={({
                      field
                    }) => <FormItem>
                              <FormLabel>Donor</FormLabel>
                              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" {...field}>
                                <option value="">Select a donor</option>
                                <option value="1">John Smith</option>
                                <option value="2">Sarah Johnson</option>
                                <option value="3">Michael Brown</option>
                                <option value="4">Emily Wilson</option>
                                <option value="5">David Lee</option>
                                <option value="custom">Enter custom name</option>
                              </select>
                              <FormMessage />
                            </FormItem>} />}
                      
                      <FormField control={specialGivingForm.control} name="notes" render={({
                      field
                    }) => <FormItem>
                            <FormLabel>Notes (Optional)</FormLabel>
                            <FormControl>
                              <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" placeholder="Any additional information" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />
                      
                      <div className="flex justify-end">
                        <Button type="submit">
                          <DollarSign className="mr-2 h-4 w-4" />
                          Record Special Giving
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Recent Special Giving</CardTitle>
                  <CardDescription>
                    View and manage recent special donations.
                  </CardDescription>
                  <div className="mt-4">
                    <Input type="search" placeholder="Search special giving..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Fund/Project</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Donor</TableHead>
                            <TableHead>Reference</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mockSpecialGiving.length > 0 ? mockSpecialGiving.map(giving => <TableRow key={giving.id}>
                                <TableCell>{giving.date}</TableCell>
                                <TableCell>{giving.fund}</TableCell>
                                <TableCell>${giving.amount.toLocaleString()}</TableCell>
                                <TableCell>{giving.donor}</TableCell>
                                <TableCell>{giving.reference}</TableCell>
                              </TableRow>) : <TableRow>
                              <TableCell colSpan={5} className="text-center h-24">
                                No special giving found
                              </TableCell>
                            </TableRow>}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button variant="outline">
                      <ArrowUpRight className="mr-2 h-4 w-4" />
                      View All Special Giving
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="expenses">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Record Expense</CardTitle>
                  <CardDescription>
                    Record a new expense or payment.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...expenseForm}>
                    <form onSubmit={expenseForm.handleSubmit(onExpenseSubmit)} className="space-y-4">
                      <FormField control={expenseForm.control} name="date" render={({
                      field
                    }) => <FormItem>
                            <FormLabel>Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />
                      
                      <FormField control={expenseForm.control} name="category" render={({
                      field
                    }) => <FormItem>
                            <FormLabel>Category</FormLabel>
                            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" {...field}>
                              <option value="">Select category</option>
                              <option value="utilities">Utilities</option>
                              <option value="maintenance">Maintenance</option>
                              <option value="office">Office Supplies</option>
                              <option value="ministry">Ministry Expenses</option>
                              <option value="staffing">Staff & Salaries</option>
                              <option value="equipment">Equipment</option>
                              <option value="outreach">Outreach</option>
                              <option value="other">Other</option>
                            </select>
                            <FormMessage />
                          </FormItem>} />
                      
                      <FormField control={expenseForm.control} name="description" render={({
                      field
                    }) => <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input placeholder="Electricity Bill" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />
                      
                      <FormField control={expenseForm.control} name="amount" render={({
                      field
                    }) => <FormItem>
                            <FormLabel>Amount ($)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />
                      
                      <FormField control={expenseForm.control} name="payee" render={({
                      field
                    }) => <FormItem>
                            <FormLabel>Payee/Vendor</FormLabel>
                            <FormControl>
                              <Input placeholder="Power Company" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />
                      
                      <FormField control={expenseForm.control} name="receiptImage" render={({
                      field
                    }) => <FormItem>
                            <FormLabel>Receipt (Optional)</FormLabel>
                            <FormControl>
                              <Input type="file" className="cursor-pointer" />
                            </FormControl>
                            <FormDescription>
                              Upload an image of the receipt
                            </FormDescription>
                            <FormMessage />
                          </FormItem>} />
                      
                      <FormField control={expenseForm.control} name="notes" render={({
                      field
                    }) => <FormItem>
                            <FormLabel>Notes (Optional)</FormLabel>
                            <FormControl>
                              <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" placeholder="Any additional information" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />
                      
                      <div className="flex justify-end">
                        <Button type="submit">
                          <Receipt className="mr-2 h-4 w-4" />
                          Record Expense
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Recent Expenses</CardTitle>
                  <CardDescription>
                    View and manage recent expenses.
                  </CardDescription>
                  <div className="mt-4">
                    <Input type="search" placeholder="Search expenses..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Payee</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mockExpenses.length > 0 ? mockExpenses.map(expense => <TableRow key={expense.id}>
                                <TableCell>{expense.date}</TableCell>
                                <TableCell>{expense.category}</TableCell>
                                <TableCell>{expense.description}</TableCell>
                                <TableCell>${expense.amount.toLocaleString()}</TableCell>
                                <TableCell>{expense.payee}</TableCell>
                              </TableRow>) : <TableRow>
                              <TableCell colSpan={5} className="text-center h-24">
                                No expenses found
                              </TableCell>
                            </TableRow>}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button variant="outline">
                      <ArrowUpRight className="mr-2 h-4 w-4" />
                      View All Expenses
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Financial Reports</CardTitle>
                <CardDescription>
                  Generate and view detailed financial reports.
                </CardDescription>
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center mt-4">
                  <div className="flex gap-2">
                    <Button variant={dateFilter === "month" ? "default" : "outline"} onClick={() => setDateFilter("month")}>
                      Month
                    </Button>
                    <Button variant={dateFilter === "quarter" ? "default" : "outline"} onClick={() => setDateFilter("quarter")}>
                      Quarter
                    </Button>
                    <Button variant={dateFilter === "year" ? "default" : "outline"} onClick={() => setDateFilter("year")}>
                      Year
                    </Button>
                    <Button variant={dateFilter === "custom" ? "default" : "outline"} onClick={() => setDateFilter("custom")}>
                      Custom
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <Filter className="mr-2 h-4 w-4" />
                      Filters
                    </Button>
                    <Button variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Income Statement</CardTitle>
                      <CardDescription>
                        Summary of income and expenses for the selected period
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border overflow-hidden">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="font-bold">Category</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">% of Total</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                <TableCell colSpan={3} className="font-semibold bg-gray-50">Income</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="pl-6">Tithes</TableCell>
                                <TableCell className="text-right">$15,000.00</TableCell>
                                <TableCell className="text-right">54.5%</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="pl-6">Offerings</TableCell>
                                <TableCell className="text-right">$7,500.00</TableCell>
                                <TableCell className="text-right">27.3%</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="pl-6">Special Giving</TableCell>
                                <TableCell className="text-right">$3,500.00</TableCell>
                                <TableCell className="text-right">12.7%</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="pl-6">Other Income</TableCell>
                                <TableCell className="text-right">$1,500.00</TableCell>
                                <TableCell className="text-right">5.5%</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-semibold">Total Income</TableCell>
                                <TableCell className="text-right font-semibold">$27,500.00</TableCell>
                                <TableCell className="text-right font-semibold">100%</TableCell>
                              </TableRow>
                              
                              <TableRow>
                                <TableCell colSpan={3} className="font-semibold bg-gray-50">Expenses</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="pl-6">Staff & Salaries</TableCell>
                                <TableCell className="text-right">$12,000.00</TableCell>
                                <TableCell className="text-right">52.7%</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="pl-6">Facilities</TableCell>
                                <TableCell className="text-right">$4,500.00</TableCell>
                                <TableCell className="text-right">19.8%</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="pl-6">Ministries</TableCell>
                                <TableCell className="text-right">$3,250.00</TableCell>
                                <TableCell className="text-right">14.3%</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="pl-6">Administration</TableCell>
                                <TableCell className="text-right">$1,500.00</TableCell>
                                <TableCell className="text-right">6.6%</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="pl-6">Outreach</TableCell>
                                <TableCell className="text-right">$1,500.00</TableCell>
                                <TableCell className="text-right">6.6%</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-semibold">Total Expenses</TableCell>
                                <TableCell className="text-right font-semibold">$22,750.00</TableCell>
                                <TableCell className="text-right font-semibold">100%</TableCell>
                              </TableRow>
                              
                              <TableRow>
                                <TableCell className="font-bold">Net Income</TableCell>
                                <TableCell className="text-right font-bold">$4,750.00</TableCell>
                                <TableCell className="text-right font-bold">17.3%</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Income Trends</CardTitle>
                        <CardDescription>
                          Monthly income for the current year
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px]">
                          <LineChart data={[{
                          month: "Jan",
                          tithes: 12500,
                          offerings: 7500,
                          specialGiving: 2000
                        }, {
                          month: "Feb",
                          tithes: 13000,
                          offerings: 8000,
                          specialGiving: 1500
                        }, {
                          month: "Mar",
                          tithes: 12800,
                          offerings: 7800,
                          specialGiving: 3000
                        }, {
                          month: "Apr",
                          tithes: 13200,
                          offerings: 8200,
                          specialGiving: 2500
                        }, {
                          month: "May",
                          tithes: 14000,
                          offerings: 8500,
                          specialGiving: 4000
                        }, {
                          month: "Jun",
                          tithes: 13500,
                          offerings: 8000,
                          specialGiving: 2000
                        }, {
                          month: "Jul",
                          tithes: 13800,
                          offerings: 8200,
                          specialGiving: 1800
                        }, {
                          month: "Aug",
                          tithes: 14200,
                          offerings: 8300,
                          specialGiving: 2200
                        }, {
                          month: "Sep",
                          tithes: 14500,
                          offerings: 8600,
                          specialGiving: 5000
                        }, {
                          month: "Oct",
                          tithes: 15000,
                          offerings: 9000,
                          specialGiving: 3500
                        }]} index="month" categories={["tithes", "offerings", "specialGiving"]} colors={["#8b5cf6", "#a78bfa", "#c4b5fd"]} valueFormatter={value => `$${value.toLocaleString()}`} className="h-full" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Expense Breakdown</CardTitle>
                        <CardDescription>
                          Distribution by expense category
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px]">
                          <PieChart data={[{
                          category: "Staffing",
                          value: 12000
                        }, {
                          category: "Facilities",
                          value: 4500
                        }, {
                          category: "Ministries",
                          value: 3250
                        }, {
                          category: "Administration",
                          value: 1500
                        }, {
                          category: "Outreach",
                          value: 1500
                        }]} index="category" categories={["value"]} colors={["#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe"]} valueFormatter={value => `$${value.toLocaleString()}`} className="h-full" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button>
                      <Download className="mr-2 h-4 w-4" />
                      Download Full Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RegionalAdminLayout>;
};
export default RegionalFinances;