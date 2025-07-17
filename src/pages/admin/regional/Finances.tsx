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
import { RecordTitheDialog } from "@/components/admin/regional/RecordTitheDialog";
import RecordOfferingDialog from "@/components/admin/regional/RecordOfferingDialog";
import RecordSpecialGivingDialog from "@/components/admin/regional/RecordSpecialGivingDialog";

// Mock data for demonstration
const mockTithes = [
  { id: 1, date: "2023-10-22", member: "John Smith", amount: 500, method: "Bank Transfer", reference: "T2023-0145" },
  { id: 2, date: "2023-10-22", member: "Sarah Johnson", amount: 350, method: "Cash", reference: "T2023-0146" },
  { id: 3, date: "2023-10-15", member: "Michael Brown", amount: 450, method: "Credit Card", reference: "T2023-0142" },
  { id: 4, date: "2023-10-15", member: "Emily Wilson", amount: 300, method: "Bank Transfer", reference: "T2023-0143" },
];

const mockOfferings = [
  { id: 1, date: "2023-10-22", service: "Sunday Morning", amount: 2500, category: "General", reference: "O2023-0145" },
  { id: 2, date: "2023-10-22", service: "Sunday Evening", amount: 1200, category: "General", reference: "O2023-0146" },
  { id: 3, date: "2023-10-15", service: "Sunday Morning", amount: 2350, category: "General", reference: "O2023-0142" },
  { id: 4, date: "2023-10-15", service: "Midweek", amount: 850, category: "General", reference: "O2023-0143" },
];

const mockSpecialGiving = [
  { id: 1, date: "2023-10-20", fund: "Building Fund", amount: 5000, donor: "John & Mary Smith", reference: "S2023-0045" },
  { id: 2, date: "2023-10-18", fund: "Mission Fund", amount: 2500, donor: "Anonymous", reference: "S2023-0046" },
  { id: 3, date: "2023-10-10", fund: "Youth Camp", amount: 1500, donor: "Robert Johnson", reference: "S2023-0043" },
  { id: 4, date: "2023-10-05", fund: "Building Fund", amount: 3000, donor: "Sarah Williams", reference: "S2023-0042" },
];

const mockExpenses = [
  { id: 1, date: "2023-10-21", category: "Utilities", description: "Electricity Bill", amount: 850, payee: "Power Company", reference: "E2023-0245" },
  { id: 2, date: "2023-10-18", category: "Maintenance", description: "Plumbing Repairs", amount: 1200, payee: "City Plumbers", reference: "E2023-0244" },
  { id: 3, date: "2023-10-15", category: "Office", description: "Office Supplies", amount: 350, payee: "Office Store", reference: "E2023-0243" },
  { id: 4, date: "2023-10-10", category: "Ministry", description: "Youth Event Supplies", amount: 500, payee: "Party Supplies", reference: "E2023-0242" },
];

// Form schema for offering recording
const offeringSchema = z.object({
  date: z.string().min(1, { message: "Date is required" }),
  service: z.string().min(1, { message: "Please select a service" }),
  amount: z.string().min(1, { message: "Amount is required" }),
  category: z.string().min(1, { message: "Please select a category" }),
  notes: z.string().optional(),
});

// Form schema for special giving recording
const specialGivingSchema = z.object({
  date: z.string().min(1, { message: "Date is required" }),
  fund: z.string().min(1, { message: "Please select a fund" }),
  amount: z.string().min(1, { message: "Amount is required" }),
  donorId: z.string().optional(),
  isAnonymous: z.boolean().default(false),
  notes: z.string().optional(),
});

// Form schema for expense recording
const expenseSchema = z.object({
  date: z.string().min(1, { message: "Date is required" }),
  category: z.string().min(1, { message: "Please select a category" }),
  description: z.string().min(3, { message: "Description is required" }),
  amount: z.string().min(1, { message: "Amount is required" }),
  payee: z.string().min(3, { message: "Payee is required" }),
  receiptImage: z.string().optional(),
  notes: z.string().optional(),
});

const RegionalFinances: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [recordTitheDialogOpen, setRecordTitheDialogOpen] = useState(false);
  const [offeringDialogOpen, setOfferingDialogOpen] = useState(false);
  const [recordSpecialGivingDialogOpen, setRecordSpecialGivingDialogOpen] = useState(false);

  const offeringForm = useForm<z.infer<typeof offeringSchema>>({
    resolver: zodResolver(offeringSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      service: "",
      amount: "",
      category: "",
      notes: "",
    },
  });

  const specialGivingForm = useForm<z.infer<typeof specialGivingSchema>>({
    resolver: zodResolver(specialGivingSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      fund: "",
      amount: "",
      donorId: "",
      isAnonymous: false,
      notes: "",
    },
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
      notes: "",
    },
  });

  function onOfferingSubmit(values: z.infer<typeof offeringSchema>) {
    console.log(values);
    // In a real app, this would save the offering to a database
    alert("Offering recorded successfully!");
    offeringForm.reset({
      date: new Date().toISOString().split('T')[0],
      service: "",
      amount: "",
      category: "",
      notes: "",
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
      notes: "",
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
      notes: "",
    });
  }

  return (
    <RegionalAdminLayout>
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
            <TabsTrigger value="special-giving">Special Giving</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
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
                        <PieChart
                          data={[
                            { category: "Tithes", value: 15000 },
                            { category: "Offerings", value: 7500 },
                            { category: "Special Giving", value: 3500 },
                            { category: "Other", value: 1500 },
                          ]}
                          index="category"
                          categories={["value"]}
                          colors={["#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe"]}
                          valueFormatter={(value) => `$${value.toLocaleString()}`}
                          className="h-full"
                        />
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
                        <PieChart
                          data={[
                            { category: "Staffing", value: 12000 },
                            { category: "Facilities", value: 4500 },
                            { category: "Ministries", value: 3250 },
                            { category: "Administration", value: 1500 },
                            { category: "Outreach", value: 1500 },
                          ]}
                          index="category"
                          categories={["value"]}
                          colors={["#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe"]}
                          valueFormatter={(value) => `$${value.toLocaleString()}`}
                          className="h-full"
                        />
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
                      <LineChart
                        data={[
                          { month: "Nov", income: 25000, expenses: 20500 },
                          { month: "Dec", income: 27500, expenses: 22000 },
                          { month: "Jan", income: 24500, expenses: 21000 },
                          { month: "Feb", income: 25000, expenses: 20500 },
                          { month: "Mar", income: 26000, expenses: 21500 },
                          { month: "Apr", income: 25500, expenses: 21000 },
                          { month: "May", income: 26500, expenses: 22000 },
                          { month: "Jun", income: 27000, expenses: 22500 },
                          { month: "Jul", income: 26000, expenses: 21500 },
                          { month: "Aug", income: 26500, expenses: 22000 },
                          { month: "Sep", income: 27000, expenses: 22500 },
                          { month: "Oct", income: 27500, expenses: 22750 },
                        ]}
                        index="month"
                        categories={["income", "expenses"]}
                        colors={["#8b5cf6", "#e11d48"]}
                        valueFormatter={(value) => `$${value.toLocaleString()}`}
                        className="h-full"
                      />
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="tithes">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Tithes</CardTitle>
                    <CardDescription>
                      Latest tithe records from members.
                    </CardDescription>
                  </div>
                  <Button onClick={() => setRecordTitheDialogOpen(true)}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Record Tithe
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mt-4">
                  <Input
                    type="search"
                    placeholder="Search tithes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="mt-6">
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
                          {mockTithes.length > 0 ? (
                            mockTithes.map((tithe) => (
                              <TableRow key={tithe.id}>
                                <TableCell>{tithe.date}</TableCell>
                                <TableCell>{tithe.member}</TableCell>
                                <TableCell>${tithe.amount.toLocaleString()}</TableCell>
                                <TableCell>{tithe.method}</TableCell>
                                <TableCell>{tithe.reference}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center h-24">
                                No tithes found
                              </TableCell>
                            </TableRow>
                          )}
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="offerings">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>Recent Offerings</CardTitle>
                  <CardDescription>
                    View and manage recent offering records.
                  </CardDescription>
                </div>
                <Button onClick={() => setOfferingDialogOpen(true)}>
                  <Receipt className="mr-2 h-4 w-4" />
                  Record Offering
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Search className="w-4 h-4" />
                    <Input
                      placeholder="Search offerings..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
                    />
                  </div>

                  <div className="rounded-md border">
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
                        {mockOfferings.length > 0 ? (
                          mockOfferings.map((offering) => (
                            <TableRow key={offering.id}>
                              <TableCell>{offering.date}</TableCell>
                              <TableCell>{offering.service}</TableCell>
                              <TableCell>${offering.amount.toLocaleString()}</TableCell>
                              <TableCell>{offering.category}</TableCell>
                              <TableCell>{offering.reference}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center h-24">
                              No offerings found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <Button variant="outline" className="w-full">
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                    View All Offerings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="special-giving">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Special Giving</CardTitle>
                    <CardDescription>
                      View and manage recent special donations.
                    </CardDescription>
                  </div>
                  <Button onClick={() => setRecordSpecialGivingDialogOpen(true)}>
                    <PiggyBank className="mr-2 h-4 w-4" />
                    Record Special Giving
                  </Button>
                </div>
                <div className="mt-4">
                  <Input
                    type="search"
                    placeholder="Search special giving..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Fund</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Donor</TableHead>
                          <TableHead>Reference</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockSpecialGiving.length > 0 ? (
                          mockSpecialGiving.map((giving) => (
                            <TableRow key={giving.id}>
                              <TableCell>{giving.date}</TableCell>
                              <TableCell>{giving.fund}</TableCell>
                              <TableCell>${giving.amount.toLocaleString()}</TableCell>
                              <TableCell>{giving.donor}</TableCell>
                              <TableCell>{giving.reference}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center h-24">
                              No special giving found
                            </TableCell>
                          </TableRow>
                        )}
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
              <Card>
                <CardHeader>
                  <CardTitle>Record Special Giving</CardTitle>
                  <CardDescription>
                    Record a special donation or pledge.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...specialGivingForm}>
                    <form onSubmit={specialGivingForm.handleSubmit(onSpecialGivingSubmit)} className="space-y-4">
                      <FormField
                        control={specialGivingForm.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={specialGivingForm.control}
                        name="fund"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fund/Project</FormLabel>
                            <select 
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                              {...field}
                            >
                              <option value="">Select a fund</option>
                              <option value="building">Building Fund</option>
                              <option value="missions">Mission Fund</option>
                              <option value="youth">Youth Ministry</option>
                              <option value="outreach">Community Outreach</option>
                              <option value="other">Other</option>
                            </select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={specialGivingForm.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount ($)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="space-y-3">
                        <FormField
                          control={specialGivingForm.control}
                          name="isAnonymous"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border border-input bg-background"
                                  checked={field.value}
                                  onChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  Anonymous Donation
                                </FormLabel>
                                <FormDescription>
                                  Check if the donor wishes to remain anonymous
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        {!specialGivingForm.watch("isAnonymous") && (
                          <FormField
                            control={specialGivingForm.control}
                            name="donorId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Donor</FormLabel>
                                <select 
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                  {...field}
                                >
                                  <option value="">Select a donor</option>
                                  <option value="1">John Smith</option>
                                  <option value="2">Sarah Johnson</option>
                                  <option value="3">Michael Brown</option>
                                  <option value="4">Emily Wilson</option>
                                  <option value="5">David Lee</option>
                                </select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                      
                      <FormField
                        control={specialGivingForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes (Optional)</FormLabel>
                            <FormControl>
                              <textarea 
                                placeholder="Additional notes about this special giving..." 
                                className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" className="w-full">
                        <PiggyBank className="mr-2 h-4 w-4" />
                        Record Special Giving
                      </Button>
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
                    <Input
                      type="search"
                      placeholder="Search special giving..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Fund</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Donor</TableHead>
                            <TableHead>Reference</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mockSpecialGiving.length > 0 ? (
                            mockSpecialGiving.map((giving) => (
                              <TableRow key={giving.id}>
                                <TableCell>{giving.date}</TableCell>
                                <TableCell>{giving.fund}</TableCell>
                                <TableCell>${giving.amount.toLocaleString()}</TableCell>
                                <TableCell>{giving.donor}</TableCell>
                                <TableCell>{giving.reference}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center h-24">
                                No special giving found
                              </TableCell>
                            </TableRow>
                          )}
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
                      <FormField
                        control={expenseForm.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={expenseForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <select 
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                              {...field}
                            >
                              <option value="">Select a category</option>
                              <option value="utilities">Utilities</option>
                              <option value="maintenance">Maintenance & Repairs</option>
                              <option value="office">Office Supplies</option>
                              <option value="ministry">Ministry Supplies</option>
                              <option value="travel">Travel & Transportation</option>
                              <option value="other">Other</option>
                            </select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={expenseForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input placeholder="Brief description of the expense" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={expenseForm.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount ($)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={expenseForm.control}
                        name="payee"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payee</FormLabel>
                            <FormControl>
                              <Input placeholder="Who was paid" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={expenseForm.control}
                        name="receiptImage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Receipt Image (Optional)</FormLabel>
                            <FormControl>
                              <Input type="file" accept="image/*" {...field} />
                            </FormControl>
                            <FormDescription>
                              Upload a photo of the receipt for your records
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={expenseForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes (Optional)</FormLabel>
                            <FormControl>
                              <textarea 
                                placeholder="Additional notes about this expense..." 
                                className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" className="w-full">
                        <Receipt className="mr-2 h-4 w-4" />
                        Record Expense
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Recent Expenses</CardTitle>
                  <CardDescription>
                    View and manage recent expense records.
                  </CardDescription>
                  <div className="mt-4">
                    <Input
                      type="search"
                      placeholder="Search expenses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
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
                          {mockExpenses.length > 0 ? (
                            mockExpenses.map((expense) => (
                              <TableRow key={expense.id}>
                                <TableCell>{expense.date}</TableCell>
                                <TableCell>{expense.category}</TableCell>
                                <TableCell>{expense.description}</TableCell>
                                <TableCell>${expense.amount.toLocaleString()}</TableCell>
                                <TableCell>{expense.payee}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center h-24">
                                No expenses found
                              </TableCell>
                            </TableRow>
                          )}
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
                  Generate and view detailed financial reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Income Statement</CardTitle>
                      <CardDescription>
                        Current month financial summary
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Total Income</span>
                          <span className="text-sm font-bold text-green-600">$27,500</span>
                        </div>
                        <div className="pl-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Tithes</span>
                            <span>$15,000</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Offerings</span>
                            <span>$7,500</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Special Giving</span>
                            <span>$3,500</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Other Income</span>
                            <span>$1,500</span>
                          </div>
                        </div>
                        
                        <hr />
                        
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Total Expenses</span>
                          <span className="text-sm font-bold text-red-600">$22,750</span>
                        </div>
                        <div className="pl-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Staffing</span>
                            <span>$12,000</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Facilities</span>
                            <span>$4,500</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Ministries</span>
                            <span>$3,250</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Administration</span>
                            <span>$1,500</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Outreach</span>
                            <span>$1,500</span>
                          </div>
                        </div>
                        
                        <hr />
                        
                        <div className="flex justify-between">
                          <span className="font-semibold">Net Income</span>
                          <span className="font-bold text-green-600">$4,750</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Quick Actions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Button variant="outline" className="w-full justify-start">
                          <Download className="mr-2 h-4 w-4" />
                          Download Monthly Report
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Calendar className="mr-2 h-4 w-4" />
                          Generate Custom Report
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <TrendingUp className="mr-2 h-4 w-4" />
                          View Year-to-Date Summary
                        </Button>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Report Filters</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Date Range</label>
                          <select className="w-full p-2 border rounded">
                            <option>This Month</option>
                            <option>Last Month</option>
                            <option>This Quarter</option>
                            <option>This Year</option>
                            <option>Custom Range</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Report Type</label>
                          <select className="w-full p-2 border rounded">
                            <option>All Transactions</option>
                            <option>Income Only</option>
                            <option>Expenses Only</option>
                            <option>By Category</option>
                          </select>
                        </div>
                        <Button className="w-full">
                          <Filter className="mr-2 h-4 w-4" />
                          Apply Filters
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Income Trends</CardTitle>
                      <CardDescription>
                        Monthly income over the past 6 months
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px]">
                        <LineChart
                          data={[
                            { month: "May", income: 25500 },
                            { month: "Jun", income: 27000 },
                            { month: "Jul", income: 26000 },
                            { month: "Aug", income: 26500 },
                            { month: "Sep", income: 27000 },
                            { month: "Oct", income: 27500 },
                          ]}
                          index="month"
                          categories={["income"]}
                          colors={["#8b5cf6"]}
                          valueFormatter={(value) => `$${value.toLocaleString()}`}
                          className="h-full"
                        />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Expense Breakdown</CardTitle>
                      <CardDescription>
                        Current month expense distribution
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px]">
                        <BarChart
                          data={[
                            { category: "Staffing", amount: 12000 },
                            { category: "Facilities", amount: 4500 },
                            { category: "Ministries", amount: 3250 },
                            { category: "Admin", amount: 1500 },
                            { category: "Outreach", amount: 1500 },
                          ]}
                          index="category"
                          categories={["amount"]}
                          colors={["#8b5cf6"]}
                          valueFormatter={(value) => `$${value.toLocaleString()}`}
                          className="h-full"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <RecordTitheDialog 
        open={recordTitheDialogOpen} 
        onOpenChange={setRecordTitheDialogOpen} 
      />
      <RecordOfferingDialog 
        open={offeringDialogOpen} 
        onOpenChange={setOfferingDialogOpen} 
      />
      <RecordSpecialGivingDialog 
        open={recordSpecialGivingDialogOpen} 
        onOpenChange={setRecordSpecialGivingDialogOpen} 
      />
    </RegionalAdminLayout>
  );
};

export default RegionalFinances;