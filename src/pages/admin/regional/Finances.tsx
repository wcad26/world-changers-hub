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
import { DollarSign, Calendar, Receipt, PiggyBank, Download, ArrowUpRight, Filter, TrendingUp, Search, ChevronLeft, ChevronRight, X, CalendarDays, CreditCard, Plus, BarChart3, TrendingDown } from "lucide-react";
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

const Finances = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState("overview");

  // Pagination states
  const [currentTithePage, setCurrentTithePage] = useState(1);
  const [currentOfferingPage, setCurrentOfferingPage] = useState(1);
  const [currentSpecialGivingPage, setCurrentSpecialGivingPage] = useState(1);
  const [currentExpensePage, setCurrentExpensePage] = useState(1);
  
  const itemsPerPage = 10;
  
  // Date filter states
  const [titheStartDate, setTitheStartDate] = useState<Date | null>(null);
  const [titheEndDate, setTitheEndDate] = useState<Date | null>(null);
  const [offeringStartDate, setOfferingStartDate] = useState<Date | null>(null);
  const [offeringEndDate, setOfferingEndDate] = useState<Date | null>(null);
  const [specialStartDate, setSpecialStartDate] = useState<Date | null>(null);
  const [specialEndDate, setSpecialEndDate] = useState<Date | null>(null);
  const [expenseStartDate, setExpenseStartDate] = useState<Date | null>(null);
  const [expenseEndDate, setExpenseEndDate] = useState<Date | null>(null);
  
  // Search states
  const [titheSearch, setTitheSearch] = useState("");
  const [offeringSearch, setOfferingSearch] = useState("");
  const [specialGivingSearch, setSpecialGivingSearch] = useState("");
  const [expenseSearch, setExpenseSearch] = useState("");
  
  // Category filters
  const [offeringCategoryFilter, setOfferingCategoryFilter] = useState<string | null>(null);
  const [specialGivingFundFilter, setSpecialGivingFundFilter] = useState<string | null>(null);
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string | null>(null);
  
  // Dialog states
  const [titheDialogOpen, setTitheDialogOpen] = useState(false);
  const [offeringDialogOpen, setOfferingDialogOpen] = useState(false);
  const [specialGivingDialogOpen, setSpecialGivingDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  
  // Prepare data for financial overview
  const totalIncome = mockTithes.reduce((sum, tithe) => sum + tithe.amount, 0) +
                    mockOfferings.reduce((sum, offering) => sum + offering.amount, 0) +
                    mockSpecialGiving.reduce((sum, giving) => sum + giving.amount, 0);
  
  const totalExpenses = mockExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  const netBalance = totalIncome - totalExpenses;
  
  // Filter unique categories for offering, special giving, and expenses
  const offeringCategories = Array.from(new Set(mockOfferings.map((offering) => offering.category)));
  const specialGivingFunds = Array.from(new Set(mockSpecialGiving.map((giving) => giving.fund)));
  const expenseCategories = Array.from(new Set(mockExpenses.map((expense) => expense.category)));
  
  // Filtered data based on search and date filters
  const filteredTithes = mockTithes.filter((tithe) => {
    const matchesSearch = tithe.member.toLowerCase().includes(titheSearch.toLowerCase());
    const matchesDateFilter = (!titheStartDate || new Date(tithe.date) >= titheStartDate) &&
                            (!titheEndDate || new Date(tithe.date) <= titheEndDate);
    return matchesSearch && matchesDateFilter;
  });
  
  const filteredOfferings = mockOfferings.filter((offering) => {
    const matchesSearch = offering.service.toLowerCase().includes(offeringSearch.toLowerCase());
    const matchesDateFilter = (!offeringStartDate || new Date(offering.date) >= offeringStartDate) &&
                            (!offeringEndDate || new Date(offering.date) <= offeringEndDate);
    const matchesCategory = !offeringCategoryFilter || offering.category === offeringCategoryFilter;
    return matchesSearch && matchesDateFilter && matchesCategory;
  });
  
  const filteredSpecialGiving = mockSpecialGiving.filter((giving) => {
    const matchesSearch = giving.donor.toLowerCase().includes(specialGivingSearch.toLowerCase());
    const matchesDateFilter = (!specialStartDate || new Date(giving.date) >= specialStartDate) &&
                            (!specialEndDate || new Date(giving.date) <= specialEndDate);
    const matchesFund = !specialGivingFundFilter || giving.fund === specialGivingFundFilter;
    return matchesSearch && matchesDateFilter && matchesFund;
  });
  
  const filteredExpenses = mockExpenses.filter((expense) => {
    const matchesSearch = expense.description.toLowerCase().includes(expenseSearch.toLowerCase());
    const matchesDateFilter = (!expenseStartDate || new Date(expense.date) >= expenseStartDate) &&
                            (!expenseEndDate || new Date(expense.date) <= expenseEndDate);
    const matchesCategory = !expenseCategoryFilter || expense.category === expenseCategoryFilter;
    return matchesSearch && matchesDateFilter && matchesCategory;
  });
  
  // Pagination calculations
  const tithePages = Math.ceil(filteredTithes.length / itemsPerPage);
  const offeringPages = Math.ceil(filteredOfferings.length / itemsPerPage);
  const specialGivingPages = Math.ceil(filteredSpecialGiving.length / itemsPerPage);
  const expensePages = Math.ceil(filteredExpenses.length / itemsPerPage);
  
  const tithesForPage = filteredTithes.slice((currentTithePage - 1) * itemsPerPage, currentTithePage * itemsPerPage);
  const offeringsForPage = filteredOfferings.slice((currentOfferingPage - 1) * itemsPerPage, currentOfferingPage * itemsPerPage);
  const specialGivingForPage = filteredSpecialGiving.slice((currentSpecialGivingPage - 1) * itemsPerPage, currentSpecialGivingPage * itemsPerPage);
  const expensesForPage = filteredExpenses.slice((currentExpensePage - 1) * itemsPerPage, currentExpensePage * itemsPerPage);
  
  // Combine all financial data for reports
  const financialData = [
    ...mockTithes.map(tithe => ({ 
      type: 'Tithe', 
      date: tithe.date, 
      amount: tithe.amount, 
      details: `From: ${tithe.member}`,
      category: 'Tithe'
    })),
    ...mockOfferings.map(offering => ({ 
      type: 'Offering', 
      date: offering.date, 
      amount: offering.amount, 
      details: `${offering.service} Service`,
      category: offering.category
    })),
    ...mockSpecialGiving.map(giving => ({ 
      type: 'Special Giving', 
      date: giving.date, 
      amount: giving.amount, 
      details: `From: ${giving.donor}`,
      category: giving.fund
    })),
    ...mockExpenses.map(expense => ({ 
      type: 'Expense', 
      date: expense.date, 
      amount: -expense.amount, 
      details: expense.description,
      category: expense.category
    })),
  ];
  
  // Sort financial data by date (newest first)
  financialData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Create data for pie charts
  const incomeDistribution = [
    { name: 'Tithes', value: mockTithes.reduce((sum, tithe) => sum + tithe.amount, 0) },
    { name: 'Offerings', value: mockOfferings.reduce((sum, offering) => sum + offering.amount, 0) },
    { name: 'Special Giving', value: mockSpecialGiving.reduce((sum, giving) => sum + giving.amount, 0) },
  ];
  
  const expenseDistribution = expenseCategories.map(category => ({
    name: category,
    value: mockExpenses
      .filter(expense => expense.category === category)
      .reduce((sum, expense) => sum + expense.amount, 0)
  }));
  
  const COLORS = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', '#d0ed57', '#ffc658'];

  return (
    <RegionalAdminLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Financial Management</h1>
        
        <Tabs defaultValue="overview" className="w-full" onValueChange={(value) => setActiveTab(value)}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tithes">Tithes</TabsTrigger>
            <TabsTrigger value="offerings">Offerings</TabsTrigger>
            <TabsTrigger value="special-giving">Special Giving</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
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
            
            <Card className="mb-6">
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </TabsContent>
          
          <TabsContent value="tithes">
            <Card className="h-[calc(100vh-8rem)]">
              <CardContent className="p-6 h-full flex flex-col">
                {/* Fixed Controls Section */}
                <div className="space-y-4 flex-shrink-0 mb-4">
                  {/* Search and Filter Controls */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search members..."
                        value={titheSearch}
                        onChange={(e) => setTitheSearch(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      {/* Date Filter Popover */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="flex gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Date Filter</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-4">
                          <div className="space-y-4">
                            <h4 className="font-medium">Filter by Date</h4>
                            <div className="flex flex-col gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="tithe-start-date">Start Date</Label>
                                <input
                                  id="tithe-start-date"
                                  type="date"
                                  onChange={(e) => setTitheStartDate(e.target.value ? new Date(e.target.value) : null)}
                                  className="w-full p-2 border rounded"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="tithe-end-date">End Date</Label>
                                <input
                                  id="tithe-end-date"
                                  type="date"
                                  onChange={(e) => setTitheEndDate(e.target.value ? new Date(e.target.value) : null)}
                                  className="w-full p-2 border rounded"
                                />
                              </div>
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setTitheStartDate(null);
                                  setTitheEndDate(null);
                                }}
                              >
                                Clear Filter
                              </Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                      
                      {/* Add Tithe Button */}
                      <Button onClick={() => setTitheDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Record Tithe
                      </Button>
                    </div>
                  </div>
                  
                  {/* Active Filters Display */}
                  {(titheStartDate || titheEndDate) && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Filters:</span>
                      {titheStartDate && titheEndDate && (
                        <Badge variant="outline" className="flex gap-1 items-center">
                          <CalendarDays className="h-3 w-3" />
                          <span>{format(titheStartDate, "MMM d, yyyy")} - {format(titheEndDate, "MMM d, yyyy")}</span>
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => {
                              setTitheStartDate(null);
                              setTitheEndDate(null);
                            }}
                          />
                        </Badge>
                      )}
                      {titheStartDate && !titheEndDate && (
                        <Badge variant="outline" className="flex gap-1 items-center">
                          <CalendarDays className="h-3 w-3" />
                          <span>From {format(titheStartDate, "MMM d, yyyy")}</span>
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => setTitheStartDate(null)}
                          />
                        </Badge>
                      )}
                      {!titheStartDate && titheEndDate && (
                        <Badge variant="outline" className="flex gap-1 items-center">
                          <CalendarDays className="h-3 w-3" />
                          <span>Until {format(titheEndDate, "MMM d, yyyy")}</span>
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => setTitheEndDate(null)}
                          />
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Table */}
                <div className="overflow-y-auto flex-grow">
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
                      {tithesForPage.map((tithe) => (
                        <TableRow key={tithe.id}>
                          <TableCell>{format(new Date(tithe.date), "MMM d, yyyy")}</TableCell>
                          <TableCell>{tithe.member}</TableCell>
                          <TableCell>₦{tithe.amount.toLocaleString()}</TableCell>
                          <TableCell>{tithe.method}</TableCell>
                          <TableCell>{tithe.reference}</TableCell>
                        </TableRow>
                      ))}
                      
                      {tithesForPage.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            {titheSearch || titheStartDate || titheEndDate ? 
                              "No tithes match your search criteria" : 
                              "No tithes recorded yet"}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Pagination */}
                {tithePages > 1 && (
                  <div className="flex justify-end mt-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentTithePage(Math.max(1, currentTithePage - 1));
                            }}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: tithePages }).map((_, index) => {
                          const page = index + 1;
                          // Show nearby pages and first/last pages
                          if (
                            page === 1 || 
                            page === tithePages || 
                            (page >= currentTithePage - 1 && page <= currentTithePage + 1)
                          ) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationLink 
                                  href="#"
                                  isActive={page === currentTithePage}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setCurrentTithePage(page);
                                  }}
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          }
                          
                          // Show ellipsis for gaps
                          if (
                            page === currentTithePage - 2 || 
                            page === currentTithePage + 2
                          ) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                          
                          return null;
                        })}
                        
                        <PaginationItem>
                          <PaginationNext 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentTithePage(Math.min(tithePages, currentTithePage + 1));
                            }}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Record Tithe Dialog */}
            <RecordTitheDialog 
              open={titheDialogOpen} 
              onOpenChange={setTitheDialogOpen} 
            />
          </TabsContent>
          
          <TabsContent value="offerings">
            <Card className="h-[calc(100vh-8rem)]">
              <CardContent className="p-6 h-full flex flex-col">
                {/* Fixed Controls Section */}
                <div className="space-y-4 flex-shrink-0 mb-4">
                  {/* Search and Filter Controls */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search services..."
                        value={offeringSearch}
                        onChange={(e) => setOfferingSearch(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    
                    <div className="flex gap-2 flex-wrap">
                      {/* Date Filter Popover */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="flex gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Date</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-4">
                          <div className="space-y-4">
                            <h4 className="font-medium">Filter by Date</h4>
                            <div className="flex flex-col gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="offering-start-date">Start Date</Label>
                                <input
                                  id="offering-start-date"
                                  type="date"
                                  onChange={(e) => setOfferingStartDate(e.target.value ? new Date(e.target.value) : null)}
                                  className="w-full p-2 border rounded"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="offering-end-date">End Date</Label>
                                <input
                                  id="offering-end-date"
                                  type="date"
                                  onChange={(e) => setOfferingEndDate(e.target.value ? new Date(e.target.value) : null)}
                                  className="w-full p-2 border rounded"
                                />
                              </div>
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setOfferingStartDate(null);
                                  setOfferingEndDate(null);
                                }}
                              >
                                Clear Filter
                              </Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                      
                      {/* Category Filter */}
                      <Select 
                        value={offeringCategoryFilter || ""} 
                        onValueChange={(value) => setOfferingCategoryFilter(value || null)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Categories</SelectItem>
                          {offeringCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {/* Add Offering Button */}
                      <Button onClick={() => setOfferingDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Record Offering
                      </Button>
                    </div>
                  </div>
                  
                  {/* Active Filters Display */}
                  {(offeringStartDate || offeringEndDate || offeringCategoryFilter) && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-muted-foreground">Filters:</span>
                      
                      {offeringStartDate && offeringEndDate && (
                        <Badge variant="outline" className="flex gap-1 items-center">
                          <CalendarDays className="h-3 w-3" />
                          <span>{format(offeringStartDate, "MMM d, yyyy")} - {format(offeringEndDate, "MMM d, yyyy")}</span>
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => {
                              setOfferingStartDate(null);
                              setOfferingEndDate(null);
                            }}
                          />
                        </Badge>
                      )}
                      
                      {offeringStartDate && !offeringEndDate && (
                        <Badge variant="outline" className="flex gap-1 items-center">
                          <CalendarDays className="h-3 w-3" />
                          <span>From {format(offeringStartDate, "MMM d, yyyy")}</span>
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => setOfferingStartDate(null)}
                          />
                        </Badge>
                      )}
                      
                      {!offeringStartDate && offeringEndDate && (
                        <Badge variant="outline" className="flex gap-1 items-center">
                          <CalendarDays className="h-3 w-3" />
                          <span>Until {format(offeringEndDate, "MMM d, yyyy")}</span>
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => setOfferingEndDate(null)}
                          />
                        </Badge>
                      )}
                      
                      {offeringCategoryFilter && (
                        <Badge variant="outline" className="flex gap-1 items-center">
                          <Filter className="h-3 w-3" />
                          <span>{offeringCategoryFilter}</span>
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => setOfferingCategoryFilter(null)}
                          />
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Table */}
                <div className="overflow-y-auto flex-grow">
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
                      {offeringsForPage.map((offering) => (
                        <TableRow key={offering.id}>
                          <TableCell>{format(new Date(offering.date), "MMM d, yyyy")}</TableCell>
                          <TableCell>{offering.service}</TableCell>
                          <TableCell>₦{offering.amount.toLocaleString()}</TableCell>
                          <TableCell>{offering.category}</TableCell>
                          <TableCell>{offering.reference}</TableCell>
                        </TableRow>
                      ))}
                      
                      {offeringsForPage.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            {offeringSearch || offeringStartDate || offeringEndDate || offeringCategoryFilter ? 
                              "No offerings match your search criteria" : 
                              "No offerings recorded yet"}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Pagination */}
                {offeringPages > 1 && (
                  <div className="flex justify-end mt-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentOfferingPage(Math.max(1, currentOfferingPage - 1));
                            }}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: offeringPages }).map((_, index) => {
                          const page = index + 1;
                          // Show nearby pages and first/last pages
                          if (
                            page === 1 || 
                            page === offeringPages || 
                            (page >= currentOfferingPage - 1 && page <= currentOfferingPage + 1)
                          ) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationLink 
                                  href="#"
                                  isActive={page === currentOfferingPage}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setCurrentOfferingPage(page);
                                  }}
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          }
                          
                          // Show ellipsis for gaps
                          if (
                            page === currentOfferingPage - 2 || 
                            page === currentOfferingPage + 2
                          ) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                          
                          return null;
                        })}
                        
                        <PaginationItem>
                          <PaginationNext 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentOfferingPage(Math.min(offeringPages, currentOfferingPage + 1));
                            }}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Record Offering Dialog */}
            <RecordOfferingDialog 
              open={offeringDialogOpen} 
              onOpenChange={setOfferingDialogOpen} 
            />
          </TabsContent>
          
          <TabsContent value="special-giving">
            <Card className="h-[calc(100vh-8rem)]">
              <CardContent className="p-6 h-full flex flex-col">
                {/* Fixed Controls Section */}
                <div className="space-y-4 flex-shrink-0 mb-4">
                  {/* Search and Filter Controls */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search donors..."
                        value={specialGivingSearch}
                        onChange={(e) => setSpecialGivingSearch(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    
                    <div className="flex gap-2 flex-wrap">
                      {/* Date Filter Popover */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="flex gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Date</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-4">
                          <div className="space-y-4">
                            <h4 className="font-medium">Filter by Date</h4>
                            <div className="flex flex-col gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="special-start-date">Start Date</Label>
                                <input
                                  id="special-start-date"
                                  type="date"
                                  onChange={(e) => setSpecialStartDate(e.target.value ? new Date(e.target.value) : null)}
                                  className="w-full p-2 border rounded"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="special-end-date">End Date</Label>
                                <input
                                  id="special-end-date"
                                  type="date"
                                  onChange={(e) => setSpecialEndDate(e.target.value ? new Date(e.target.value) : null)}
                                  className="w-full p-2 border rounded"
                                />
                              </div>
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setSpecialStartDate(null);
                                  setSpecialEndDate(null);
                                }}
                              >
                                Clear Filter
                              </Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                      
                      {/* Fund Filter */}
                      <Select 
                        value={specialGivingFundFilter || ""} 
                        onValueChange={(value) => setSpecialGivingFundFilter(value || null)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="All Funds" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Funds</SelectItem>
                          {specialGivingFunds.map((fund) => (
                            <SelectItem key={fund} value={fund}>
                              {fund}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {/* Add Special Giving Button */}
                      <Button onClick={() => setSpecialGivingDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Record Special Giving
                      </Button>
                    </div>
                  </div>
                  
                  {/* Active Filters Display */}
                  {(specialStartDate || specialEndDate || specialGivingFundFilter) && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-muted-foreground">Filters:</span>
                      
                      {specialStartDate && specialEndDate && (
                        <Badge variant="outline" className="flex gap-1 items-center">
                          <CalendarDays className="h-3 w-3" />
                          <span>{format(specialStartDate, "MMM d, yyyy")} - {format(specialEndDate, "MMM d, yyyy")}</span>
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => {
                              setSpecialStartDate(null);
                              setSpecialEndDate(null);
                            }}
                          />
                        </Badge>
                      )}
                      
                      {specialStartDate && !specialEndDate && (
                        <Badge variant="outline" className="flex gap-1 items-center">
                          <CalendarDays className="h-3 w-3" />
                          <span>From {format(specialStartDate, "MMM d, yyyy")}</span>
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => setSpecialStartDate(null)}
                          />
                        </Badge>
                      )}
                      
                      {!specialStartDate && specialEndDate && (
                        <Badge variant="outline" className="flex gap-1 items-center">
                          <CalendarDays className="h-3 w-3" />
                          <span>Until {format(specialEndDate, "MMM d, yyyy")}</span>
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => setSpecialEndDate(null)}
                          />
                        </Badge>
                      )}
                      
                      {specialGivingFundFilter && (
                        <Badge variant="outline" className="flex gap-1 items-center">
                          <Filter className="h-3 w-3" />
                          <span>{specialGivingFundFilter}</span>
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => setSpecialGivingFundFilter(null)}
                          />
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Table */}
                <div className="overflow-y-auto flex-grow">
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
                      {specialGivingForPage.map((giving) => (
                        <TableRow key={giving.id}>
                          <TableCell>{format(new Date(giving.date), "MMM d, yyyy")}</TableCell>
                          <TableCell>{giving.fund}</TableCell>
                          <TableCell>₦{giving.amount.toLocaleString()}</TableCell>
                          <TableCell>{giving.donor}</TableCell>
                          <TableCell>{giving.reference}</TableCell>
                        </TableRow>
                      ))}
                      
                      {specialGivingForPage.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            {specialGivingSearch || specialStartDate || specialEndDate || specialGivingFundFilter ? 
                              "No special giving match your search criteria" : 
                              "No special giving recorded yet"}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Pagination */}
                {specialGivingPages > 1 && (
                  <div className="flex justify-end mt-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentSpecialGivingPage(Math.max(1, currentSpecialGivingPage - 1));
                            }}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: specialGivingPages }).map((_, index) => {
                          const page = index + 1;
                          // Show nearby pages and first/last pages
                          if (
                            page === 1 || 
                            page === specialGivingPages || 
                            (page >= currentSpecialGivingPage - 1 && page <= currentSpecialGivingPage + 1)
                          ) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationLink 
                                  href="#"
                                  isActive={page === currentSpecialGivingPage}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setCurrentSpecialGivingPage(page);
                                  }}
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          }
                          
                          // Show ellipsis for gaps
                          if (
                            page === currentSpecialGivingPage - 2 || 
                            page === currentSpecialGivingPage + 2
                          ) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                          
                          return null;
                        })}
                        
                        <PaginationItem>
                          <PaginationNext 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentSpecialGivingPage(Math.min(specialGivingPages, currentSpecialGivingPage + 1));
                            }}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Record Special Giving Dialog */}
            <RecordSpecialGivingDialog 
              open={specialGivingDialogOpen} 
              onOpenChange={setSpecialGivingDialogOpen} 
            />
          </TabsContent>
          
          <TabsContent value="expenses">
            <Card className="h-[calc(100vh-8rem)]">
              <CardContent className="p-6 h-full flex flex-col">
                {/* Search and Action Bar */}
                <div className="space-y-4 flex-shrink-0 mb-4">
                  {/* Search and Filter Controls */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search description..."
                        value={expenseSearch}
                        onChange={(e) => setExpenseSearch(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    
                    <div className="flex gap-2 flex-wrap">
                      {/* Date Filter Popover */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="flex gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Date</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-4">
                          <div className="space-y-4">
                            <h4 className="font-medium">Filter by Date</h4>
                            <div className="flex flex-col gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="expense-start-date">Start Date</Label>
                                <input
                                  id="expense-start-date"
                                  type="date"
                                  onChange={(e) => setExpenseStartDate(e.target.value ? new Date(e.target.value) : null)}
                                  className="w-full p-2 border rounded"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="expense-end-date">End Date</Label>
                                <input
                                  id="expense-end-date"
                                  type="date"
                                  onChange={(e) => setExpenseEndDate(e.target.value ? new Date(e.target.value) : null)}
                                  className="w-full p-2 border rounded"
                                />
                              </div>
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setExpenseStartDate(null);
                                  setExpenseEndDate(null);
                                }}
                              >
                                Clear Filter
                              </Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                      
                      {/* Category Filter */}
                      <Select 
                        value={expenseCategoryFilter || ""} 
                        onValueChange={(value) => setExpenseCategoryFilter(value || null)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Categories</SelectItem>
                          {expenseCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {/* Add Expense Button */}
                      <Button onClick={() => setExpenseDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Record Expense
                      </Button>
                    </div>
                  </div>
                  
                  {/* Active Filters Display */}
                  {(expenseStartDate || expenseEndDate || expenseCategoryFilter) && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-muted-foreground">Filters:</span>
                      
                      {expenseStartDate && expenseEndDate && (
                        <Badge variant="outline" className="flex gap-1 items-center">
                          <CalendarDays className="h-3 w-3" />
                          <span>{format(expenseStartDate, "MMM d, yyyy")} - {format(expenseEndDate, "MMM d, yyyy")}</span>
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => {
                              setExpenseStartDate(null);
                              setExpenseEndDate(null);
                            }}
                          />
                        </Badge>
                      )}
                      
                      {expenseStartDate && !expenseEndDate && (
                        <Badge variant="outline" className="flex gap-1 items-center">
                          <CalendarDays className="h-3 w-3" />
                          <span>From {format(expenseStartDate, "MMM d, yyyy")}</span>
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => setExpenseStartDate(null)}
                          />
                        </Badge>
                      )}
                      
                      {!expenseStartDate && expenseEndDate && (
                        <Badge variant="outline" className="flex gap-1 items-center">
                          <CalendarDays className="h-3 w-3" />
                          <span>Until {format(expenseEndDate, "MMM d, yyyy")}</span>
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => setExpenseEndDate(null)}
                          />
                        </Badge>
                      )}
                      
                      {expenseCategoryFilter && (
                        <Badge variant="outline" className="flex gap-1 items-center">
                          <Filter className="h-3 w-3" />
                          <span>{expenseCategoryFilter}</span>
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => setExpenseCategoryFilter(null)}
                          />
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Table */}
                <div className="overflow-y-auto flex-grow">
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
                      {expensesForPage.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>{format(new Date(expense.date), "MMM d, yyyy")}</TableCell>
                          <TableCell>{expense.category}</TableCell>
                          <TableCell>{expense.description}</TableCell>
                          <TableCell>₦{expense.amount.toLocaleString()}</TableCell>
                          <TableCell>{expense.payee}</TableCell>
                        </TableRow>
                      ))}
                      
                      {expensesForPage.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            {expenseSearch || expenseStartDate || expenseEndDate || expenseCategoryFilter ? 
                              "No expenses match your search criteria" : 
                              "No expenses recorded yet"}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Pagination */}
                {expensePages > 1 && (
                  <div className="flex justify-end mt-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentExpensePage(Math.max(1, currentExpensePage - 1));
                            }}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: expensePages }).map((_, index) => {
                          const page = index + 1;
                          // Show nearby pages and first/last pages
                          if (
                            page === 1 || 
                            page === expensePages || 
                            (page >= currentExpensePage - 1 && page <= currentExpensePage + 1)
                          ) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationLink 
                                  href="#"
                                  isActive={page === currentExpensePage}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setCurrentExpensePage(page);
                                  }}
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          }
                          
                          // Show ellipsis for gaps
                          if (
                            page === currentExpensePage - 2 || 
                            page === currentExpensePage + 2
                          ) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                          
                          return null;
                        })}
                        
                        <PaginationItem>
                          <PaginationNext 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentExpensePage(Math.min(expensePages, currentExpensePage + 1));
                            }}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Record Expense Dialog */}
            <RecordExpenseDialog 
              open={expenseDialogOpen} 
              onOpenChange={setExpenseDialogOpen} 
            />
          </TabsContent>
          
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Financial Transaction History</CardTitle>
                <CardDescription>All financial transactions ordered by date</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[calc(100vh-16rem)] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {financialData.map((transaction, i) => (
                        <TableRow key={i}>
                          <TableCell>{format(new Date(transaction.date), "MMM d, yyyy")}</TableCell>
                          <TableCell>
                            <Badge variant={transaction.type === 'Expense' ? "destructive" : "default"}>
                              {transaction.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{transaction.category}</TableCell>
                          <TableCell>{transaction.details}</TableCell>
                          <TableCell className={transaction.amount < 0 ? "text-red-500" : "text-green-500"}>
                            ₦{Math.abs(transaction.amount).toLocaleString()}
                            {transaction.amount > 0 ? " +" : " -"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="flex justify-end mt-4">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    <span>Export Report</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RegionalAdminLayout>
  );
};

export default Finances;
