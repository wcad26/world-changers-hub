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
import { DollarSign, Calendar, Receipt, PiggyBank, Download, ArrowUpRight, Filter, TrendingUp, Search, ChevronLeft, ChevronRight, X, CalendarDays, CreditCard } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, LineChart, PieChart } from "@/components/ui/chart";
import { RecordTitheDialog } from "@/components/admin/regional/RecordTitheDialog";
import RecordOfferingDialog from "@/components/admin/regional/RecordOfferingDialog";
import RecordSpecialGivingDialog from "@/components/admin/regional/RecordSpecialGivingDialog";
import RecordExpenseDialog from "@/components/admin/regional/RecordExpenseDialog";

// Mock data for demonstration
const mockTithes = [
  { id: 1, date: "2023-10-22", member: "John Smith", amount: 500, method: "Bank Transfer", reference: "T2023-0145" },
  { id: 2, date: "2023-10-22", member: "Sarah Johnson", amount: 350, method: "Cash", reference: "T2023-0146" },
  { id: 3, date: "2023-10-15", member: "Michael Brown", amount: 450, method: "Credit Card", reference: "T2023-0142" },
  { id: 4, date: "2023-10-15", member: "Emily Wilson", amount: 300, method: "Bank Transfer", reference: "T2023-0143" },
  { id: 5, date: "2023-10-08", member: "David Miller", amount: 750, method: "Bank Transfer", reference: "T2023-0141" },
  { id: 6, date: "2023-10-08", member: "Jessica Davis", amount: 425, method: "Credit Card", reference: "T2023-0140" },
  { id: 7, date: "2023-10-01", member: "Robert Garcia", amount: 550, method: "Cash", reference: "T2023-0139" },
  { id: 8, date: "2023-09-24", member: "Lisa Martinez", amount: 400, method: "Bank Transfer", reference: "T2023-0138" },
  { id: 9, date: "2023-09-24", member: "Christopher Lee", amount: 625, method: "Credit Card", reference: "T2023-0137" },
  { id: 10, date: "2023-09-17", member: "Amanda Taylor", amount: 475, method: "Bank Transfer", reference: "T2023-0136" },
  { id: 11, date: "2023-09-17", member: "Kevin Anderson", amount: 325, method: "Cash", reference: "T2023-0135" },
  { id: 12, date: "2023-09-10", member: "Michelle Thomas", amount: 700, method: "Bank Transfer", reference: "T2023-0134" },
  { id: 13, date: "2023-09-10", member: "James Wilson", amount: 380, method: "Credit Card", reference: "T2023-0133" },
  { id: 14, date: "2023-09-03", member: "Rachel Moore", amount: 520, method: "Bank Transfer", reference: "T2023-0132" },
  { id: 15, date: "2023-09-03", member: "Daniel Clark", amount: 445, method: "Cash", reference: "T2023-0131" },
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

const RegionalFinances: React.FC = () => {
  // State for dialogs
  const [searchTerm, setSearchTerm] = useState("");
  const [recordTitheDialogOpen, setRecordTitheDialogOpen] = useState(false);
  const [offeringDialogOpen, setOfferingDialogOpen] = useState(false);
  const [recordSpecialGivingDialogOpen, setRecordSpecialGivingDialogOpen] = useState(false);
  const [recordExpenseDialogOpen, setRecordExpenseDialogOpen] = useState(false);
  
  // Tithe filtering and pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
  const [amountRange, setAmountRange] = useState({ min: "", max: "" });
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

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

  // Filter and pagination logic for tithes
  const paymentMethods = ["Bank Transfer", "Cash", "Credit Card"];
  
  const filteredTithes = mockTithes.filter((tithe) => {
    // Search filter
    const matchesSearch = 
      tithe.member.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tithe.reference.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Payment method filter
    const matchesMethod = selectedMethods.length === 0 || selectedMethods.includes(tithe.method);
    
    // Amount range filter
    const matchesAmount = 
      (!amountRange.min || tithe.amount >= parseFloat(amountRange.min)) &&
      (!amountRange.max || tithe.amount <= parseFloat(amountRange.max));
    
    // Date range filter
    const titheDate = new Date(tithe.date);
    const matchesDate = 
      (!dateRange.from || titheDate >= dateRange.from) &&
      (!dateRange.to || titheDate <= dateRange.to);
    
    return matchesSearch && matchesMethod && matchesAmount && matchesDate;
  });

  const totalPages = Math.ceil(filteredTithes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTithes = filteredTithes.slice(startIndex, startIndex + itemsPerPage);

  const clearFilters = () => {
    setSelectedMethods([]);
    setAmountRange({ min: "", max: "" });
    setDateRange({});
    setSearchTerm("");
    setCurrentPage(1);
  };

  const hasActiveFilters = 
    selectedMethods.length > 0 || 
    amountRange.min || 
    amountRange.max || 
    dateRange.from || 
    dateRange.to ||
    searchTerm;

  function onExpenseSubmit(values: { date: Date; amount: string; category: string; notes?: string; description: string; payee: string; }) {
    console.log(values);
    // In a real app, this would save the expense to a database
    alert("Expense recorded successfully!");
  }

  return (
    <RegionalAdminLayout>
      <div className="space-y-6">
        
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
              <CardContent className="space-y-4">
                {/* Search and Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by member name or reference..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowFilters(!showFilters)}
                      className="shrink-0"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                      {hasActiveFilters && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Active
                        </Badge>
                      )}
                    </Button>
                    <Button onClick={() => setRecordTitheDialogOpen(true)}>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Record Tithe
                    </Button>
                  </div>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                  <Card className="border-dashed">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Payment Method Filter */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Payment Method</label>
                          <div className="space-y-2">
                            {paymentMethods.map((method) => (
                              <div key={method} className="flex items-center space-x-2">
                                <Checkbox
                                  id={method}
                                  checked={selectedMethods.includes(method)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedMethods([...selectedMethods, method]);
                                    } else {
                                      setSelectedMethods(selectedMethods.filter(m => m !== method));
                                    }
                                  }}
                                />
                                <label htmlFor={method} className="text-sm">
                                  {method}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Amount Range Filter */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Amount Range</label>
                          <div className="flex space-x-2">
                            <Input
                              type="number"
                              placeholder="Min"
                              value={amountRange.min}
                              onChange={(e) => setAmountRange({...amountRange, min: e.target.value})}
                            />
                            <Input
                              type="number"
                              placeholder="Max"
                              value={amountRange.max}
                              onChange={(e) => setAmountRange({...amountRange, max: e.target.value})}
                            />
                          </div>
                        </div>

                        {/* Date Range Filter */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Date Range</label>
                          <div className="flex space-x-2">
                            <Input
                              type="date"
                              value={dateRange.from ? dateRange.from.toISOString().split('T')[0] : ''}
                              onChange={(e) => setDateRange({
                                ...dateRange,
                                from: e.target.value ? new Date(e.target.value) : undefined
                              })}
                            />
                            <Input
                              type="date"
                              value={dateRange.to ? dateRange.to.toISOString().split('T')[0] : ''}
                              onChange={(e) => setDateRange({
                                ...dateRange,
                                to: e.target.value ? new Date(e.target.value) : undefined
                              })}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Filter Actions */}
                      <div className="flex justify-between items-center mt-4 pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          Showing {filteredTithes.length} of {mockTithes.length} transactions
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={clearFilters}>
                            <X className="h-4 w-4 mr-1" />
                            Clear All
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Active Filter Chips */}
                {hasActiveFilters && (
                  <div className="flex flex-wrap gap-2">
                    {selectedMethods.map((method) => (
                      <Badge key={method} variant="secondary" className="gap-1">
                        <CreditCard className="h-3 w-3" />
                        {method}
                        <button
                          onClick={() => setSelectedMethods(selectedMethods.filter(m => m !== method))}
                          className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {(amountRange.min || amountRange.max) && (
                      <Badge variant="secondary" className="gap-1">
                        <DollarSign className="h-3 w-3" />
                        {amountRange.min && `$${amountRange.min}`}
                        {amountRange.min && amountRange.max && ' - '}
                        {amountRange.max && `$${amountRange.max}`}
                        <button
                          onClick={() => setAmountRange({ min: '', max: '' })}
                          className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {(dateRange.from || dateRange.to) && (
                      <Badge variant="secondary" className="gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {dateRange.from && dateRange.from.toLocaleDateString()}
                        {dateRange.from && dateRange.to && ' - '}
                        {dateRange.to && dateRange.to.toLocaleDateString()}
                        <button
                          onClick={() => setDateRange({})}
                          className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                  </div>
                )}

                {/* Scrollable Table */}
                <div className="rounded-md border">
                  <div className="max-h-[500px] overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background">
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Member</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Reference</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedTithes.length > 0 ? (
                          paginatedTithes.map((tithe) => (
                            <TableRow key={tithe.id}>
                              <TableCell className="font-mono text-xs">
                                {new Date(tithe.date).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="font-medium">{tithe.member}</TableCell>
                              <TableCell className="font-semibold text-green-600">
                                ${tithe.amount.toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {tithe.method}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono text-xs text-muted-foreground">
                                {tithe.reference}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center h-24">
                              <div className="flex flex-col items-center justify-center space-y-2">
                                <Search className="h-8 w-8 text-muted-foreground" />
                                <p className="text-muted-foreground">
                                  {hasActiveFilters ? 'No tithes match your filters' : 'No tithes found'}
                                </p>
                                {hasActiveFilters && (
                                  <Button variant="link" size="sm" onClick={clearFilters}>
                                    Clear filters
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredTithes.length)} of {filteredTithes.length} transactions
                    </div>
                    
                    {/* Items per page control - centered */}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">Show</span>
                      <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                        setItemsPerPage(parseInt(value));
                        setCurrentPage(1);
                      }}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-muted-foreground">per page</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page => 
                            page === 1 || 
                            page === totalPages || 
                            Math.abs(page - currentPage) <= 1
                          )
                          .map((page, index, array) => (
                            <React.Fragment key={page}>
                              {index > 0 && array[index - 1] !== page - 1 && (
                                <span className="px-2 text-muted-foreground">...</span>
                              )}
                              <Button
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className="w-8 h-8 p-0"
                              >
                                {page}
                              </Button>
                            </React.Fragment>
                          ))
                        }
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
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
          </TabsContent>
          
          <TabsContent value="expenses">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>Recent Expenses</CardTitle>
                  <CardDescription>
                    View and manage recent expense records.
                  </CardDescription>
                </div>
                <Button onClick={() => setRecordExpenseDialogOpen(true)} size="sm">
                  <Receipt className="w-4 h-4 mr-2" />
                  Record Expense
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="Search expenses..." 
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
                          <TableHead>Description</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockExpenses
                          .filter(expense => 
                            expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            expense.category.toLowerCase().includes(searchTerm.toLowerCase())
                          )
                          .slice(0, 5)
                          .map((expense) => (
                            <TableRow key={expense.id}>
                              <TableCell>{expense.date}</TableCell>
                              <TableCell>{expense.description}</TableCell>
                              <TableCell>
                                <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs">
                                  {expense.category}
                                </span>
                              </TableCell>
                              <TableCell className="font-medium text-destructive">
                                -${expense.amount.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <Button variant="outline" className="w-full">
                    <ArrowUpRight className="w-4 h-4 mr-2" />
                    View All Expenses
                  </Button>
                </div>
              </CardContent>
            </Card>
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
      
      <RecordExpenseDialog
        open={recordExpenseDialogOpen}
        onOpenChange={setRecordExpenseDialogOpen}
        onSubmit={onExpenseSubmit}
      />
    </RegionalAdminLayout>
  );
};

export default RegionalFinances;