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
import { DollarSign, Calendar, Receipt, PiggyBank, Download, ArrowUpRight, Filter, TrendingUp, Search, ChevronLeft, ChevronRight, X, CalendarDays, CreditCard, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
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
  { id: 16, date: "2023-08-27", member: "Nancy Rodriguez", amount: 600, method: "Bank Transfer", reference: "T2023-0130" },
  { id: 17, date: "2023-08-27", member: "Brian Lewis", amount: 375, method: "Credit Card", reference: "T2023-0129" },
  { id: 18, date: "2023-08-20", member: "Catherine Hall", amount: 525, method: "Cash", reference: "T2023-0128" },
  { id: 19, date: "2023-08-20", member: "Steven Allen", amount: 480, method: "Bank Transfer", reference: "T2023-0127" },
  { id: 20, date: "2023-08-13", member: "Angela Young", amount: 420, method: "Credit Card", reference: "T2023-0126" },
  { id: 21, date: "2023-08-13", member: "Kenneth King", amount: 650, method: "Bank Transfer", reference: "T2023-0125" },
  { id: 22, date: "2023-08-06", member: "Dorothy Wright", amount: 390, method: "Cash", reference: "T2023-0124" },
  { id: 23, date: "2023-08-06", member: "Paul Lopez", amount: 575, method: "Bank Transfer", reference: "T2023-0123" },
  { id: 24, date: "2023-07-30", member: "Helen Hill", amount: 340, method: "Credit Card", reference: "T2023-0122" },
  { id: 25, date: "2023-07-30", member: "Ronald Green", amount: 720, method: "Bank Transfer", reference: "T2023-0121" },
  { id: 26, date: "2023-07-23", member: "Betty Adams", amount: 460, method: "Cash", reference: "T2023-0120" },
  { id: 27, date: "2023-07-23", member: "George Baker", amount: 510, method: "Bank Transfer", reference: "T2023-0119" },
  { id: 28, date: "2023-07-16", member: "Sandra Gonzalez", amount: 385, method: "Credit Card", reference: "T2023-0118" },
  { id: 29, date: "2023-07-16", member: "William Nelson", amount: 630, method: "Bank Transfer", reference: "T2023-0117" },
  { id: 30, date: "2023-07-09", member: "Sharon Carter", amount: 450, method: "Cash", reference: "T2023-0116" },
];

const mockOfferings = [
  { id: 1, date: "2023-10-22", service: "Sunday Morning", amount: 2500, category: "General", reference: "O2023-0145" },
  { id: 2, date: "2023-10-22", service: "Sunday Evening", amount: 1200, category: "General", reference: "O2023-0146" },
  { id: 3, date: "2023-10-15", service: "Sunday Morning", amount: 2350, category: "General", reference: "O2023-0142" },
  { id: 4, date: "2023-10-15", service: "Midweek", amount: 850, category: "General", reference: "O2023-0143" },
  { id: 5, date: "2023-10-08", service: "Sunday Morning", amount: 2800, category: "General", reference: "O2023-0141" },
  { id: 6, date: "2023-10-08", service: "Sunday Evening", amount: 950, category: "General", reference: "O2023-0140" },
  { id: 7, date: "2023-10-01", service: "Sunday Morning", amount: 2650, category: "General", reference: "O2023-0139" },
  { id: 8, date: "2023-10-01", service: "Special Event", amount: 1800, category: "Special", reference: "O2023-0138" },
  { id: 9, date: "2023-09-24", service: "Sunday Morning", amount: 2400, category: "General", reference: "O2023-0137" },
  { id: 10, date: "2023-09-24", service: "Midweek", amount: 750, category: "General", reference: "O2023-0136" },
  { id: 11, date: "2023-09-17", service: "Sunday Morning", amount: 2750, category: "General", reference: "O2023-0135" },
  { id: 12, date: "2023-09-17", service: "Sunday Evening", amount: 1100, category: "General", reference: "O2023-0134" },
  { id: 13, date: "2023-09-10", service: "Sunday Morning", amount: 2300, category: "Building", reference: "O2023-0133" },
  { id: 14, date: "2023-09-10", service: "Special Event", amount: 2200, category: "Mission", reference: "O2023-0132" },
  { id: 15, date: "2023-09-03", service: "Sunday Morning", amount: 2550, category: "General", reference: "O2023-0131" },
  { id: 16, date: "2023-09-03", service: "Sunday Evening", amount: 980, category: "General", reference: "O2023-0130" },
  { id: 17, date: "2023-08-27", service: "Sunday Morning", amount: 2450, category: "General", reference: "O2023-0129" },
  { id: 18, date: "2023-08-27", service: "Midweek", amount: 820, category: "Youth", reference: "O2023-0128" },
  { id: 19, date: "2023-08-20", service: "Sunday Morning", amount: 2700, category: "General", reference: "O2023-0127" },
  { id: 20, date: "2023-08-20", service: "Sunday Evening", amount: 1050, category: "General", reference: "O2023-0126" },
  { id: 21, date: "2023-08-13", service: "Sunday Morning", amount: 2350, category: "Building", reference: "O2023-0125" },
  { id: 22, date: "2023-08-13", service: "Special Event", amount: 1900, category: "Mission", reference: "O2023-0124" },
  { id: 23, date: "2023-08-06", service: "Sunday Morning", amount: 2600, category: "General", reference: "O2023-0123" },
  { id: 24, date: "2023-08-06", service: "Midweek", amount: 780, category: "General", reference: "O2023-0122" },
  { id: 25, date: "2023-07-30", service: "Sunday Morning", amount: 2500, category: "General", reference: "O2023-0121" },
  { id: 26, date: "2023-07-30", service: "Sunday Evening", amount: 1150, category: "Youth", reference: "O2023-0120" },
  { id: 27, date: "2023-07-23", service: "Sunday Morning", amount: 2400, category: "General", reference: "O2023-0119" },
  { id: 28, date: "2023-07-23", service: "Special Event", amount: 2100, category: "Special", reference: "O2023-0118" },
  { id: 29, date: "2023-07-16", service: "Sunday Morning", amount: 2650, category: "General", reference: "O2023-0117" },
  { id: 30, date: "2023-07-16", service: "Midweek", amount: 850, category: "General", reference: "O2023-0116" },
  { id: 31, date: "2023-07-09", service: "Sunday Morning", amount: 2300, category: "Building", reference: "O2023-0115" },
  { id: 32, date: "2023-07-09", service: "Sunday Evening", amount: 920, category: "General", reference: "O2023-0114" },
  { id: 33, date: "2023-07-02", service: "Sunday Morning", amount: 2750, category: "General", reference: "O2023-0113" },
  { id: 34, date: "2023-07-02", service: "Special Event", amount: 1800, category: "Mission", reference: "O2023-0112" },
  { id: 35, date: "2023-06-25", service: "Sunday Morning", amount: 2450, category: "General", reference: "O2023-0111" },
];

const mockSpecialGiving = [
  { id: 1, date: "2023-10-20", fund: "Building Fund", amount: 5000, donor: "John & Mary Smith", reference: "S2023-0045" },
  { id: 2, date: "2023-10-18", fund: "Mission Fund", amount: 2500, donor: "Anonymous", reference: "S2023-0046" },
  { id: 3, date: "2023-10-10", fund: "Youth Camp", amount: 1500, donor: "Robert Johnson", reference: "S2023-0043" },
  { id: 4, date: "2023-10-05", fund: "Building Fund", amount: 3000, donor: "Sarah Williams", reference: "S2023-0042" },
  { id: 5, date: "2023-09-28", fund: "Music Ministry", amount: 1800, donor: "David & Lisa Brown", reference: "S2023-0041" },
  { id: 6, date: "2023-09-25", fund: "Mission Fund", amount: 4200, donor: "Michael Thompson", reference: "S2023-0040" },
  { id: 7, date: "2023-09-20", fund: "Building Fund", amount: 2750, donor: "Anonymous", reference: "S2023-0039" },
  { id: 8, date: "2023-09-15", fund: "Youth Camp", amount: 2200, donor: "Jennifer Davis", reference: "S2023-0038" },
  { id: 9, date: "2023-09-12", fund: "Benevolence", amount: 1600, donor: "Mark Wilson", reference: "S2023-0037" },
  { id: 10, date: "2023-09-08", fund: "Building Fund", amount: 3500, donor: "Patricia Garcia", reference: "S2023-0036" },
  { id: 11, date: "2023-09-05", fund: "Mission Fund", amount: 2800, donor: "James Martinez", reference: "S2023-0035" },
  { id: 12, date: "2023-09-01", fund: "Music Ministry", amount: 1400, donor: "Linda Anderson", reference: "S2023-0034" },
  { id: 13, date: "2023-08-28", fund: "Youth Camp", amount: 1950, donor: "Christopher Taylor", reference: "S2023-0033" },
  { id: 14, date: "2023-08-25", fund: "Building Fund", amount: 4800, donor: "Barbara Thomas", reference: "S2023-0032" },
  { id: 15, date: "2023-08-20", fund: "Benevolence", amount: 1300, donor: "Daniel Jackson", reference: "S2023-0031" },
  { id: 16, date: "2023-08-18", fund: "Mission Fund", amount: 3200, donor: "Susan White", reference: "S2023-0030" },
  { id: 17, date: "2023-08-15", fund: "Building Fund", amount: 2600, donor: "Matthew Harris", reference: "S2023-0029" },
  { id: 18, date: "2023-08-12", fund: "Music Ministry", amount: 1750, donor: "Nancy Martin", reference: "S2023-0028" },
  { id: 19, date: "2023-08-08", fund: "Youth Camp", amount: 2100, donor: "Joseph Lee", reference: "S2023-0027" },
  { id: 20, date: "2023-08-05", fund: "Building Fund", amount: 3800, donor: "Dorothy Walker", reference: "S2023-0026" },
  { id: 21, date: "2023-08-01", fund: "Mission Fund", amount: 2400, donor: "Anthony Hall", reference: "S2023-0025" },
  { id: 22, date: "2023-07-28", fund: "Benevolence", amount: 1850, donor: "Helen Allen", reference: "S2023-0024" },
  { id: 23, date: "2023-07-25", fund: "Building Fund", amount: 4100, donor: "Mark Young", reference: "S2023-0023" },
  { id: 24, date: "2023-07-20", fund: "Music Ministry", amount: 1650, donor: "Michelle King", reference: "S2023-0022" },
  { id: 25, date: "2023-07-18", fund: "Youth Camp", amount: 2350, donor: "Steven Wright", reference: "S2023-0021" },
  { id: 26, date: "2023-07-15", fund: "Building Fund", amount: 3100, donor: "Carol Lopez", reference: "S2023-0020" },
  { id: 27, date: "2023-07-12", fund: "Mission Fund", amount: 2700, donor: "Kevin Hill", reference: "S2023-0019" },
  { id: 28, date: "2023-07-08", fund: "Benevolence", amount: 1450, donor: "Sharon Green", reference: "S2023-0018" },
  { id: 29, date: "2023-07-05", fund: "Building Fund", amount: 3600, donor: "Thomas Adams", reference: "S2023-0017" },
  { id: 30, date: "2023-07-01", fund: "Music Ministry", amount: 1900, donor: "Betty Baker", reference: "S2023-0016" },
  { id: 31, date: "2023-06-28", fund: "Youth Camp", amount: 2250, donor: "Charles Gonzalez", reference: "S2023-0015" },
  { id: 32, date: "2023-06-25", fund: "Building Fund", amount: 4500, donor: "Anonymous", reference: "S2023-0014" },
  { id: 33, date: "2023-06-20", fund: "Mission Fund", amount: 2950, donor: "Donna Nelson", reference: "S2023-0013" },
  { id: 34, date: "2023-06-18", fund: "Benevolence", amount: 1550, donor: "Paul Carter", reference: "S2023-0012" },
  { id: 35, date: "2023-06-15", fund: "Building Fund", amount: 3300, donor: "Ruth Mitchell", reference: "S2023-0011" },
];

const mockExpenses = [
  { id: 1, date: "2023-10-21", category: "Utilities", description: "Electricity Bill", amount: 850, payee: "Power Company", reference: "E2023-0245" },
  { id: 2, date: "2023-10-18", category: "Maintenance", description: "Plumbing Repairs", amount: 1200, payee: "City Plumbers", reference: "E2023-0244" },
  { id: 3, date: "2023-10-15", category: "Office Supplies", description: "Printer Paper and Ink", amount: 350, payee: "Office Store", reference: "E2023-0243" },
  { id: 4, date: "2023-10-10", category: "Programs", description: "Youth Event Supplies", amount: 500, payee: "Party Supplies", reference: "E2023-0242" },
  { id: 5, date: "2023-10-08", category: "Transportation", description: "Van Fuel", amount: 180, payee: "Gas Station", reference: "E2023-0241" },
  { id: 6, date: "2023-10-05", category: "Equipment", description: "Sound System Repair", amount: 750, payee: "Audio Tech", reference: "E2023-0240" },
  { id: 7, date: "2023-10-03", category: "Utilities", description: "Water Bill", amount: 220, payee: "City Water", reference: "E2023-0239" },
  { id: 8, date: "2023-10-01", category: "Maintenance", description: "HVAC Service", amount: 450, payee: "Comfort Systems", reference: "E2023-0238" },
  { id: 9, date: "2023-09-28", category: "Office Supplies", description: "Cleaning Supplies", amount: 125, payee: "Janitorial Supply", reference: "E2023-0237" },
  { id: 10, date: "2023-09-25", category: "Programs", description: "Children's Ministry Materials", amount: 280, payee: "Christian Books", reference: "E2023-0236" },
  { id: 11, date: "2023-09-22", category: "Transportation", description: "Bus Rental", amount: 800, payee: "Charter Bus Co", reference: "E2023-0235" },
  { id: 12, date: "2023-09-20", category: "Equipment", description: "Laptop Purchase", amount: 1500, payee: "Computer Store", reference: "E2023-0234" },
  { id: 13, date: "2023-09-18", category: "Utilities", description: "Internet Service", amount: 120, payee: "ISP Provider", reference: "E2023-0233" },
  { id: 14, date: "2023-09-15", category: "Maintenance", description: "Roof Repairs", amount: 2200, payee: "Roofing Company", reference: "E2023-0232" },
  { id: 15, date: "2023-09-12", category: "Office Supplies", description: "Stationery and Forms", amount: 95, payee: "Print Shop", reference: "E2023-0231" },
  { id: 16, date: "2023-09-10", category: "Programs", description: "Music Ministry Equipment", amount: 650, payee: "Music Store", reference: "E2023-0230" },
  { id: 17, date: "2023-09-08", category: "Transportation", description: "Vehicle Maintenance", amount: 380, payee: "Auto Service", reference: "E2023-0229" },
  { id: 18, date: "2023-09-05", category: "Equipment", description: "Video Projector", amount: 1200, payee: "Electronics Store", reference: "E2023-0228" },
  { id: 19, date: "2023-09-03", category: "Utilities", description: "Phone Bill", amount: 85, payee: "Telecom Company", reference: "E2023-0227" },
  { id: 20, date: "2023-09-01", category: "Maintenance", description: "Carpet Cleaning", amount: 320, payee: "Cleaning Service", reference: "E2023-0226" },
  { id: 21, date: "2023-08-28", category: "Office Supplies", description: "Computer Accessories", amount: 240, payee: "Tech Store", reference: "E2023-0225" },
  { id: 22, date: "2023-08-25", category: "Programs", description: "Vacation Bible School", amount: 850, payee: "VBS Supplies", reference: "E2023-0224" },
  { id: 23, date: "2023-08-22", category: "Transportation", description: "Mission Trip Fuel", amount: 420, payee: "Gas Station", reference: "E2023-0223" },
  { id: 24, date: "2023-08-20", category: "Equipment", description: "Chairs Purchase", amount: 960, payee: "Furniture Store", reference: "E2023-0222" },
  { id: 25, date: "2023-08-18", category: "Utilities", description: "Electricity Bill", amount: 890, payee: "Power Company", reference: "E2023-0221" },
  { id: 26, date: "2023-08-15", category: "Maintenance", description: "Landscaping", amount: 540, payee: "Lawn Service", reference: "E2023-0220" },
  { id: 27, date: "2023-08-12", category: "Office Supplies", description: "Bulletin Printing", amount: 180, payee: "Print Shop", reference: "E2023-0219" },
  { id: 28, date: "2023-08-10", category: "Programs", description: "Youth Camp Registration", amount: 1200, payee: "Camp Organization", reference: "E2023-0218" },
  { id: 29, date: "2023-08-08", category: "Transportation", description: "Van Insurance", amount: 650, payee: "Insurance Company", reference: "E2023-0217" },
  { id: 30, date: "2023-08-05", category: "Equipment", description: "Microphones", amount: 480, payee: "Audio Equipment", reference: "E2023-0216" },
  { id: 31, date: "2023-08-03", category: "Utilities", description: "Water Bill", amount: 195, payee: "City Water", reference: "E2023-0215" },
  { id: 32, date: "2023-08-01", category: "Maintenance", description: "Bathroom Repairs", amount: 720, payee: "Plumbing Service", reference: "E2023-0214" },
  { id: 33, date: "2023-07-28", category: "Office Supplies", description: "Filing Cabinets", amount: 340, payee: "Office Furniture", reference: "E2023-0213" },
  { id: 34, date: "2023-07-25", category: "Programs", description: "Guest Speaker Fee", amount: 800, payee: "Conference Speaker", reference: "E2023-0212" },
  { id: 35, date: "2023-07-22", category: "Transportation", description: "Bus Maintenance", amount: 290, payee: "Bus Service", reference: "E2023-0211" },
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

  // Offering filtering and pagination state
  const [offeringSearchTerm, setOfferingSearchTerm] = useState("");
  const [offeringCurrentPage, setOfferingCurrentPage] = useState(1);
  const [offeringItemsPerPage, setOfferingItemsPerPage] = useState(10);
  const [showOfferingFilters, setShowOfferingFilters] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [offeringAmountRange, setOfferingAmountRange] = useState({ min: "", max: "" });
  const [offeringDateRange, setOfferingDateRange] = useState<{ from?: Date; to?: Date }>({});

  // Special giving filtering and pagination state
  const [specialGivingSearchTerm, setSpecialGivingSearchTerm] = useState("");
  const [specialGivingCurrentPage, setSpecialGivingCurrentPage] = useState(1);
  const [specialGivingItemsPerPage, setSpecialGivingItemsPerPage] = useState(10);

  // Expense filtering and pagination state
  const [expenseSearchQuery, setExpenseSearchQuery] = useState("");
  const [expenseCurrentPage, setExpenseCurrentPage] = useState(1);
  const [expenseItemsPerPage, setExpenseItemsPerPage] = useState(10);
  const [showExpenseFilters, setShowExpenseFilters] = useState(false);
  const [expenseFilters, setExpenseFilters] = useState({
    categories: [] as string[],
    minAmount: '',
    maxAmount: '',
    startDate: '',
    endDate: '',
    payee: ''
  });
  const [showRecordExpenseDialog, setShowRecordExpenseDialog] = useState(false);

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

  // Filter and pagination logic for offerings
  const serviceTypes = ["Sunday Morning", "Sunday Evening", "Midweek", "Special Event"];
  const offeringCategories = ["General", "Building", "Mission", "Youth", "Special"];
  
  const filteredOfferings = mockOfferings.filter((offering) => {
    // Search filter
    const matchesSearch = 
      offering.service.toLowerCase().includes(offeringSearchTerm.toLowerCase()) ||
      offering.category.toLowerCase().includes(offeringSearchTerm.toLowerCase()) ||
      offering.reference.toLowerCase().includes(offeringSearchTerm.toLowerCase());
    
    // Service type filter
    const matchesService = selectedServices.length === 0 || selectedServices.includes(offering.service);
    
    // Category filter
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(offering.category);
    
    // Amount range filter
    const matchesAmount = 
      (!offeringAmountRange.min || offering.amount >= parseFloat(offeringAmountRange.min)) &&
      (!offeringAmountRange.max || offering.amount <= parseFloat(offeringAmountRange.max));
    
    // Date range filter
    const offeringDate = new Date(offering.date);
    const matchesDate = 
      (!offeringDateRange.from || offeringDate >= offeringDateRange.from) &&
      (!offeringDateRange.to || offeringDate <= offeringDateRange.to);
    
    return matchesSearch && matchesService && matchesCategory && matchesAmount && matchesDate;
  });

  const offeringTotalPages = Math.ceil(filteredOfferings.length / offeringItemsPerPage);
  const offeringStartIndex = (offeringCurrentPage - 1) * offeringItemsPerPage;
  const paginatedOfferings = filteredOfferings.slice(offeringStartIndex, offeringStartIndex + offeringItemsPerPage);

  const clearOfferingFilters = () => {
    setSelectedServices([]);
    setSelectedCategories([]);
    setOfferingAmountRange({ min: "", max: "" });
    setOfferingDateRange({});
    setOfferingSearchTerm("");
    setOfferingCurrentPage(1);
  };

  const hasActiveOfferingFilters = 
    selectedServices.length > 0 || 
    selectedCategories.length > 0 ||
    offeringAmountRange.min || 
    offeringAmountRange.max || 
    offeringDateRange.from || 
    offeringDateRange.to ||
    offeringSearchTerm;

  // Special giving filtering and pagination
  const filteredSpecialGiving = mockSpecialGiving.filter((giving) => {
    const matchesSearch = 
      giving.fund.toLowerCase().includes(specialGivingSearchTerm.toLowerCase()) ||
      giving.donor.toLowerCase().includes(specialGivingSearchTerm.toLowerCase()) ||
      giving.reference.toLowerCase().includes(specialGivingSearchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const specialGivingTotalPages = Math.ceil(filteredSpecialGiving.length / specialGivingItemsPerPage);
  const specialGivingStartIndex = (specialGivingCurrentPage - 1) * specialGivingItemsPerPage;
  const paginatedSpecialGiving = filteredSpecialGiving.slice(specialGivingStartIndex, specialGivingStartIndex + specialGivingItemsPerPage);

  // Expense filtering and pagination logic
  const filteredExpenses = mockExpenses.filter((expense) => {
    // Search filter
    const matchesSearch = 
      expense.description.toLowerCase().includes(expenseSearchQuery.toLowerCase()) ||
      expense.category.toLowerCase().includes(expenseSearchQuery.toLowerCase()) ||
      expense.payee.toLowerCase().includes(expenseSearchQuery.toLowerCase()) ||
      expense.reference.toLowerCase().includes(expenseSearchQuery.toLowerCase());
    
    // Category filter
    const matchesCategory = expenseFilters.categories.length === 0 || expenseFilters.categories.includes(expense.category);
    
    // Amount range filter
    const matchesAmount = 
      (!expenseFilters.minAmount || expense.amount >= parseFloat(expenseFilters.minAmount)) &&
      (!expenseFilters.maxAmount || expense.amount <= parseFloat(expenseFilters.maxAmount));
    
    // Date range filter
    const expenseDate = new Date(expense.date);
    const matchesDate = 
      (!expenseFilters.startDate || expenseDate >= new Date(expenseFilters.startDate)) &&
      (!expenseFilters.endDate || expenseDate <= new Date(expenseFilters.endDate));
    
    // Payee filter
    const matchesPayee = !expenseFilters.payee || expense.payee.toLowerCase().includes(expenseFilters.payee.toLowerCase());
    
    return matchesSearch && matchesCategory && matchesAmount && matchesDate && matchesPayee;
  });

  const expenseTotalPages = Math.ceil(filteredExpenses.length / expenseItemsPerPage);
  const getExpenseStartIndex = () => (expenseCurrentPage - 1) * expenseItemsPerPage;
  const getCurrentExpenseItems = () => filteredExpenses.slice(getExpenseStartIndex(), getExpenseStartIndex() + expenseItemsPerPage);

  const getExpensePageNumbers = () => {
    const pages = [];
    const totalPages = expenseTotalPages;
    const current = expenseCurrentPage;
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (current >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  function onExpenseSubmit(values: { date: Date; amount: string; category: string; notes?: string; description: string; payee: string; }) {
    console.log(values);
    // In a real app, this would save the expense to a database
    alert("Expense recorded successfully!");
  }

  return (
    <RegionalAdminLayout>
      <div className="-mt-4">
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
                <CardDescription>
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
            <Card className="h-[calc(100vh-8rem)]">
              <CardContent className="p-6 h-full flex flex-col">
                {/* Fixed Controls Section */}
                <div className="space-y-4 flex-shrink-0 mb-4">
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
                          <div className="space-y-2 w-3/4">
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
                          <div className="space-y-2 w-3/4">
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
                          <div className="space-y-2 w-2/3">
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
                </div>

                {/* Scrollable Table Container */}
                <div className="flex-1 min-h-0 rounded-md border">
                  <div className="h-full overflow-auto">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-background z-10 border-b">
                        <tr className="border-b">
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">Date</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">Member</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">Amount</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">Method</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">Reference</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedTithes.length > 0 ? (
                          paginatedTithes.map((tithe) => (
                            <tr key={tithe.id} className="border-b transition-colors hover:bg-muted/50">
                              <td className="p-4 align-middle font-mono text-xs">
                                {new Date(tithe.date).toLocaleDateString()}
                              </td>
                              <td className="p-4 align-middle font-medium">{tithe.member}</td>
                              <td className="p-4 align-middle font-semibold text-green-600">
                                ${tithe.amount.toLocaleString()}
                              </td>
                              <td className="p-4 align-middle">
                                <Badge variant="outline" className="text-xs">
                                  {tithe.method}
                                </Badge>
                              </td>
                              <td className="p-4 align-middle font-mono text-xs text-muted-foreground">
                                {tithe.reference}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="text-center h-24 p-4">
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
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Fixed Pagination Section */}
                {totalPages > 1 && (
                  <div className="flex-shrink-0 flex items-center justify-between pt-4 border-t bg-background">
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
            <Card className="h-[calc(100vh-8rem)]">
              <CardContent className="p-6 h-full flex flex-col">
                {/* Fixed Controls Section */}
                <div className="space-y-4 flex-shrink-0 mb-4">
                  {/* Search and Filter Controls */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by service, category, or reference..."
                          value={offeringSearchTerm}
                          onChange={(e) => setOfferingSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={showOfferingFilters ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowOfferingFilters(!showOfferingFilters)}
                        className="relative"
                      >
                        <Filter className="h-4 w-4" />
                        Filter
                        {hasActiveOfferingFilters && (
                          <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
                            !
                          </Badge>
                        )}
                      </Button>
                      <Button onClick={() => setOfferingDialogOpen(true)}>
                        <Receipt className="mr-2 h-4 w-4" />
                        Record Offering
                      </Button>
                    </div>
                  </div>

                  {/* Filter Panel */}
                  {showOfferingFilters && (
                    <Card className="border-dashed">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* Service Type Filter */}
                          <div className="space-y-2 w-3/4">
                            <label className="text-sm font-medium">Service Type</label>
                            <div className="space-y-2">
                              {serviceTypes.map((service) => (
                                <div key={service} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`service-${service}`}
                                    checked={selectedServices.includes(service)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedServices([...selectedServices, service]);
                                      } else {
                                        setSelectedServices(selectedServices.filter(s => s !== service));
                                      }
                                    }}
                                  />
                                  <label htmlFor={`service-${service}`} className="text-sm">
                                    {service}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Category Filter */}
                          <div className="space-y-2 w-3/4">
                            <label className="text-sm font-medium">Category</label>
                            <div className="space-y-2">
                              {offeringCategories.map((category) => (
                                <div key={category} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`category-${category}`}
                                    checked={selectedCategories.includes(category)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedCategories([...selectedCategories, category]);
                                      } else {
                                        setSelectedCategories(selectedCategories.filter(c => c !== category));
                                      }
                                    }}
                                  />
                                  <label htmlFor={`category-${category}`} className="text-sm">
                                    {category}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Amount Range Filter */}
                          <div className="space-y-2 w-3/4">
                            <label className="text-sm font-medium">Amount Range</label>
                            <div className="flex space-x-2">
                              <Input
                                type="number"
                                placeholder="Min"
                                value={offeringAmountRange.min}
                                onChange={(e) => setOfferingAmountRange({ ...offeringAmountRange, min: e.target.value })}
                              />
                              <Input
                                type="number"
                                placeholder="Max"
                                value={offeringAmountRange.max}
                                onChange={(e) => setOfferingAmountRange({ ...offeringAmountRange, max: e.target.value })}
                              />
                            </div>
                          </div>

                          {/* Date Range Filter */}
                          <div className="space-y-2 w-2/3">
                            <label className="text-sm font-medium">Date Range</label>
                            <div className="flex space-x-2">
                              <Input
                                type="date"
                                value={offeringDateRange.from ? offeringDateRange.from.toISOString().split('T')[0] : ''}
                                onChange={(e) => setOfferingDateRange({ 
                                  ...offeringDateRange, 
                                  from: e.target.value ? new Date(e.target.value) : undefined 
                                })}
                              />
                              <Input
                                type="date"
                                value={offeringDateRange.to ? offeringDateRange.to.toISOString().split('T')[0] : ''}
                                onChange={(e) => setOfferingDateRange({ 
                                  ...offeringDateRange, 
                                  to: e.target.value ? new Date(e.target.value) : undefined 
                                })}
                              />
                            </div>
                          </div>
                        </div>

                        {hasActiveOfferingFilters && (
                          <div className="mt-4 pt-4 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={clearOfferingFilters}
                              className="text-muted-foreground"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Clear All Filters
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                </div>

                {/* Scrollable Table Section */}
                <div className="flex-1 min-h-0 rounded-md border">
                  <div className="h-full overflow-auto">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-background z-10 border-b">
                        <tr className="border-b">
                           <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">Date</th>
                           <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">Service</th>
                           <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">Category</th>
                           <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">Amount</th>
                           <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">Reference</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedOfferings.length > 0 ? (
                          paginatedOfferings.map((offering) => (
                            <tr key={offering.id} className="border-b transition-colors hover:bg-muted/50">
                               <td className="p-4 align-middle font-mono text-xs">
                                 {offering.date}
                               </td>
                               <td className="p-4 align-middle font-medium">{offering.service}</td>
                               <td className="p-4 align-middle">
                                 <Badge variant="outline" className="text-xs">
                                   {offering.category}
                                 </Badge>
                               </td>
                               <td className="p-4 align-middle font-semibold text-green-600">
                                 ${offering.amount.toLocaleString()}
                               </td>
                               <td className="p-4 align-middle font-mono text-xs text-muted-foreground">
                                 {offering.reference}
                               </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="text-center h-24 p-4">
                              No offerings found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Fixed Pagination Section */}
                <div className="flex-shrink-0 flex items-center justify-between pt-4 border-t bg-background">
                  <div className="text-sm text-muted-foreground">
                    Showing {offeringStartIndex + 1} to {Math.min(offeringStartIndex + offeringItemsPerPage, filteredOfferings.length)} of {filteredOfferings.length} entries
                  </div>
                  
                  {/* Items per page control - centered */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Show</span>
                    <Select
                      value={offeringItemsPerPage.toString()}
                      onValueChange={(value) => {
                        setOfferingItemsPerPage(parseInt(value));
                        setOfferingCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">per page</span>
                  </div>
                  
                  {offeringTotalPages > 1 ? (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOfferingCurrentPage(Math.max(1, offeringCurrentPage - 1))}
                        disabled={offeringCurrentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <div className="flex space-x-1">
                        {Array.from({ length: Math.min(5, offeringTotalPages) }, (_, i) => {
                          let page;
                          if (offeringTotalPages <= 5) {
                            page = i + 1;
                          } else if (offeringCurrentPage <= 3) {
                            page = i + 1;
                          } else if (offeringCurrentPage >= offeringTotalPages - 2) {
                            page = offeringTotalPages - 4 + i;
                          } else {
                            page = offeringCurrentPage - 2 + i;
                          }
                          
                          return (
                            <React.Fragment key={page}>
                              <Button
                                variant={offeringCurrentPage === page ? "default" : "outline"}
                                size="sm"
                                className="w-8 h-8 p-0"
                                onClick={() => setOfferingCurrentPage(page)}
                              >
                                {page}
                              </Button>
                            </React.Fragment>
                          )
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOfferingCurrentPage(Math.min(offeringTotalPages, offeringCurrentPage + 1))}
                        disabled={offeringCurrentPage === offeringTotalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div></div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="special-giving">
            <Card className="h-[calc(100vh-8rem)]">
              <CardContent className="p-6 h-full flex flex-col">
                {/* Fixed Controls Section */}
                <div className="space-y-4 flex-shrink-0 mb-4">
                  {/* Search and Filter Controls */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by fund, donor, or reference..."
                          value={specialGivingSearchTerm}
                          onChange={(e) => setSpecialGivingSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="relative"
                      >
                        <Filter className="h-4 w-4" />
                        Filter
                      </Button>
                      <Button onClick={() => setRecordSpecialGivingDialogOpen(true)}>
                        <PiggyBank className="mr-2 h-4 w-4" />
                        Record Special Giving
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Scrollable Table Section */}
                <div className="flex-1 min-h-0 rounded-md border">
                  <div className="h-full overflow-auto">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-background z-10 border-b">
                        <tr className="border-b">
                           <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">Date</th>
                           <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">Donor</th>
                           <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">Fund</th>
                           <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">Amount</th>
                           <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">Reference</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedSpecialGiving.length > 0 ? (
                          paginatedSpecialGiving.map((giving) => (
                            <tr key={giving.id} className="border-b transition-colors hover:bg-muted/50">
                               <td className="p-4 align-middle font-mono text-xs">
                                 {giving.date}
                               </td>
                               <td className="p-4 align-middle font-medium">{giving.donor}</td>
                               <td className="p-4 align-middle">
                                 <Badge variant="outline" className="text-xs">
                                   {giving.fund}
                                 </Badge>
                               </td>
                               <td className="p-4 align-middle font-semibold text-green-600">
                                 ${giving.amount.toLocaleString()}
                               </td>
                               <td className="p-4 align-middle font-mono text-xs text-muted-foreground">
                                 {giving.reference}
                               </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="text-center h-24 p-4">
                              No special giving found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Fixed Pagination Section */}
                <div className="flex-shrink-0 flex items-center justify-between pt-4 border-t bg-background">
                  <div className="text-sm text-muted-foreground">
                    Showing {specialGivingStartIndex + 1} to {Math.min(specialGivingStartIndex + specialGivingItemsPerPage, filteredSpecialGiving.length)} of {filteredSpecialGiving.length} entries
                  </div>
                  
                  {/* Items per page control - centered */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Show</span>
                    <Select
                      value={specialGivingItemsPerPage.toString()}
                      onValueChange={(value) => {
                        setSpecialGivingItemsPerPage(parseInt(value));
                        setSpecialGivingCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">per page</span>
                  </div>
                  
                  {specialGivingTotalPages > 1 ? (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSpecialGivingCurrentPage(Math.max(1, specialGivingCurrentPage - 1))}
                        disabled={specialGivingCurrentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <div className="flex space-x-1">
                        {Array.from({ length: Math.min(5, specialGivingTotalPages) }, (_, i) => {
                          let page;
                          if (specialGivingTotalPages <= 5) {
                            page = i + 1;
                          } else if (specialGivingCurrentPage <= 3) {
                            page = i + 1;
                          } else if (specialGivingCurrentPage >= specialGivingTotalPages - 2) {
                            page = specialGivingTotalPages - 4 + i;
                          } else {
                            page = specialGivingCurrentPage - 2 + i;
                          }
                          
                          return (
                            <React.Fragment key={page}>
                              <Button
                                variant={specialGivingCurrentPage === page ? "default" : "outline"}
                                size="sm"
                                className="w-8 h-8 p-0"
                                onClick={() => setSpecialGivingCurrentPage(page)}
                              >
                                {page}
                              </Button>
                            </React.Fragment>
                          )
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSpecialGivingCurrentPage(Math.min(specialGivingTotalPages, specialGivingCurrentPage + 1))}
                        disabled={specialGivingCurrentPage === specialGivingTotalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div></div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="expenses">
            <Card className="h-[calc(100vh-8rem)]">
              <CardContent className="p-6 h-full flex flex-col">
                {/* Search and Action Bar */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
                  <div className="flex-1 w-full sm:max-w-md">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search by description, category, or reference..."
                        value={expenseSearchQuery}
                        onChange={(e) => setExpenseSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowExpenseFilters(!showExpenseFilters)}
                      className="flex items-center gap-2"
                    >
                      <Filter className="h-4 w-4" />
                      Filter
                    </Button>
                    <Button className="flex items-center gap-2" onClick={() => setShowRecordExpenseDialog(true)}>
                      <Plus className="h-4 w-4" />
                      Record Expense
                    </Button>
                  </div>
                </div>

                {/* Filter Panel */}
                {showExpenseFilters && (
                  <div className="mb-6 p-4 border rounded-lg bg-muted/50">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Category</Label>
                        <div className="space-y-2">
                          {['Utilities', 'Office Supplies', 'Maintenance', 'Transportation', 'Equipment', 'Programs'].map((category) => (
                            <div key={category} className="flex items-center space-x-2">
                              <Checkbox
                                id={`expense-category-${category}`}
                                checked={expenseFilters.categories.includes(category)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setExpenseFilters(prev => ({
                                      ...prev,
                                      categories: [...prev.categories, category]
                                    }));
                                  } else {
                                    setExpenseFilters(prev => ({
                                      ...prev,
                                      categories: prev.categories.filter(c => c !== category)
                                    }));
                                  }
                                }}
                              />
                              <Label htmlFor={`expense-category-${category}`} className="text-sm">
                                {category}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Amount Range</Label>
                        <div className="space-y-2">
                          <Input
                            type="number"
                            placeholder="Min amount"
                            value={expenseFilters.minAmount}
                            onChange={(e) => setExpenseFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                          />
                          <Input
                            type="number"
                            placeholder="Max amount"
                            value={expenseFilters.maxAmount}
                            onChange={(e) => setExpenseFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Date Range</Label>
                        <div className="space-y-2">
                          <Input
                            type="date"
                            value={expenseFilters.startDate}
                            onChange={(e) => setExpenseFilters(prev => ({ ...prev, startDate: e.target.value }))}
                          />
                          <Input
                            type="date"
                            value={expenseFilters.endDate}
                            onChange={(e) => setExpenseFilters(prev => ({ ...prev, endDate: e.target.value }))}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Payee</Label>
                        <Input
                          placeholder="Search payee..."
                          value={expenseFilters.payee}
                          onChange={(e) => setExpenseFilters(prev => ({ ...prev, payee: e.target.value }))}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setExpenseFilters({
                            categories: [],
                            minAmount: '',
                            maxAmount: '',
                            startDate: '',
                            endDate: '',
                            payee: ''
                          });
                        }}
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </div>
                )}

                {/* Scrollable Table Section */}
                <div className="flex-1 min-h-0 rounded-md border">
                  <div className="h-full overflow-auto">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-background z-10 border-b">
                        <tr className="border-b">
                           <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">Date</th>
                           <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">Description</th>
                           <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">Category</th>
                           <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">Amount</th>
                           <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">Payee</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getCurrentExpenseItems().length > 0 ? (
                          getCurrentExpenseItems().map((expense) => (
                            <tr key={expense.id} className="border-b transition-colors hover:bg-muted/50">
                               <td className="p-4 align-middle font-mono text-xs">
                                 {format(new Date(expense.date), 'yyyy-MM-dd')}
                               </td>
                               <td className="p-4 align-middle font-medium">{expense.description}</td>
                               <td className="p-4 align-middle">
                                 <Badge variant="outline" className="text-xs">
                                   {expense.category}
                                 </Badge>
                               </td>
                               <td className="p-4 align-middle font-semibold text-red-600">
                                 ${expense.amount.toLocaleString()}
                               </td>
                               <td className="p-4 align-middle font-mono text-xs text-muted-foreground">
                                 {expense.payee}
                               </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="text-center h-24 p-4">
                              No expenses found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Fixed Pagination Section */}
                <div className="flex-shrink-0 flex items-center justify-between pt-4 border-t bg-background">
                  <div className="text-sm text-muted-foreground">
                    Showing {getExpenseStartIndex() + 1} to {Math.min(getExpenseStartIndex() + expenseItemsPerPage, filteredExpenses.length)} of {filteredExpenses.length} entries
                  </div>
                  
                  {/* Items per page control - centered */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Show</span>
                    <Select
                      value={expenseItemsPerPage.toString()}
                      onValueChange={(value) => {
                        setExpenseItemsPerPage(parseInt(value));
                        setExpenseCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">per page</span>
                  </div>
                  
                  {expenseTotalPages > 1 ? (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpenseCurrentPage(Math.max(1, expenseCurrentPage - 1))}
                        disabled={expenseCurrentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <div className="flex space-x-1">
                        {Array.from({ length: Math.min(5, expenseTotalPages) }, (_, i) => {
                          let page;
                          if (expenseTotalPages <= 5) {
                            page = i + 1;
                          } else if (expenseCurrentPage <= 3) {
                            page = i + 1;
                          } else if (expenseCurrentPage >= expenseTotalPages - 2) {
                            page = expenseTotalPages - 4 + i;
                          } else {
                            page = expenseCurrentPage - 2 + i;
                          }
                          
                          return (
                            <React.Fragment key={page}>
                              <Button
                                variant={expenseCurrentPage === page ? "default" : "outline"}
                                size="sm"
                                className="w-8 h-8 p-0"
                                onClick={() => setExpenseCurrentPage(page)}
                              >
                                {page}
                              </Button>
                            </React.Fragment>
                          )
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpenseCurrentPage(Math.min(expenseTotalPages, expenseCurrentPage + 1))}
                        disabled={expenseCurrentPage === expenseTotalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div></div>
                  )}
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
        open={showRecordExpenseDialog}
        onOpenChange={setShowRecordExpenseDialog}
        onSubmit={onExpenseSubmit}
      />
    </RegionalAdminLayout>
  );
};

export default RegionalFinances;
