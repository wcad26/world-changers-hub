import React, { useState, useEffect } from "react";
import RegionalAdminLayout from "@/components/admin/RegionalAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Settings as SettingsIcon, 
  Users, 
  Home, 
  Bell, 
  Mail, 
  Calendar,
  DollarSign,
  Shield,
  Clock,
  MapPin
} from "lucide-react";
import RegionalBranchForm from "@/components/admin/regional/RegionalBranchForm";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useAuth } from "@/hooks/useAuth";
import { useRegions } from "@/hooks/useRegions";
import { useRegionMutations } from "@/hooks/useRegionMutations";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: currencies, isLoading: currenciesLoading } = useCurrencies();
  const { data: userRegion, isLoading: regionLoading } = useRegions().data?.find(
    (region) => region.id === user?.user_metadata?.region_id
  ) as any;
  const { updateRegion } = useRegionMutations();
  
  const [selectedCurrency, setSelectedCurrency] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Initialize currency from user's region
  useEffect(() => {
    if (userRegion?.currency_code) {
      setSelectedCurrency(userRegion.currency_code);
    }
  }, [userRegion]);

  const handleSaveSettings = async () => {
    if (!user?.user_metadata?.region_id) {
      toast({
        title: "Error",
        description: "No region found for current user",
        variant: "destructive",
      });
      return;
    }

    if (!selectedCurrency) {
      toast({
        title: "Error", 
        description: "Please select a currency",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateRegion.mutateAsync({
        id: user.user_metadata.region_id,
        updates: {
          currency_code: selectedCurrency,
        },
      });

      toast({
        title: "Settings saved",
        description: "Currency settings have been updated successfully",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <RegionalAdminLayout>
      <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="regional" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="regional">Regional Portal</TabsTrigger>
          <TabsTrigger value="branch">Branch Details</TabsTrigger>
          <TabsTrigger value="dcg">DCG Management</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="regional" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Member Management Settings
              </CardTitle>
              <CardDescription>
                Configure how member data is handled in your regional portal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-approve new member registrations</Label>
                  <p className="text-sm text-muted-foreground">
                    New members will be automatically approved without admin review
                  </p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require photo upload for members</Label>
                  <p className="text-sm text-muted-foreground">
                    Members must upload a profile photo during registration
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Default member status</Label>
                <Select defaultValue="active">
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Event Management Settings
              </CardTitle>
              <CardDescription>
                Configure event creation and management preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Maximum event capacity</Label>
                <Input type="number" placeholder="500" className="w-32" />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow external event registration</Label>
                  <p className="text-sm text-muted-foreground">
                    Non-members can register for events
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="space-y-2">
                <Label>Event registration deadline (days before event)</Label>
                <Input type="number" placeholder="3" className="w-24" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Settings
              </CardTitle>
              <CardDescription>
                Configure financial management and reporting preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Default currency</Label>
                <Select 
                  value={selectedCurrency} 
                  onValueChange={setSelectedCurrency}
                  disabled={currenciesLoading}
                >
                  <SelectTrigger className="w-full sm:w-64 bg-background border shadow-sm">
                    <SelectValue placeholder={currenciesLoading ? "Loading..." : "Select currency"} />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-md z-50 max-h-[300px]">
                    {currencies?.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name} ({currency.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCurrency && currencies && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {currencies.find(c => c.code === selectedCurrency)?.symbol} - {currencies.find(c => c.code === selectedCurrency)?.name}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require receipt uploads for expenses</Label>
                  <p className="text-sm text-muted-foreground">
                    All expense records must include receipt attachments
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="space-y-2">
                <Label>Expense approval threshold</Label>
                <Input type="number" placeholder="1000" className="w-32" />
                <p className="text-sm text-muted-foreground">
                  Expenses above this amount require additional approval
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branch" className="space-y-6">
          <RegionalBranchForm />
        </TabsContent>

        <TabsContent value="dcg" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                DCG Configuration
              </CardTitle>
              <CardDescription>
                Configure Discipleship Community Group settings and policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Maximum DCG size</Label>
                <Input type="number" placeholder="15" className="w-24" />
                <p className="text-sm text-muted-foreground">
                  Maximum number of members allowed per DCG
                </p>
              </div>
              <div className="space-y-2">
                <Label>Minimum DCG size</Label>
                <Input type="number" placeholder="5" className="w-24" />
                <p className="text-sm text-muted-foreground">
                  Minimum number of members required to maintain a DCG
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-assign new members to DCGs</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically assign new members to DCGs based on location
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow DCG leader self-appointment</Label>
                  <p className="text-sm text-muted-foreground">
                    Members can volunteer to become DCG leaders
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>DCG Meeting Settings</CardTitle>
              <CardDescription>
                Configure default meeting schedules and attendance tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Default meeting duration (hours)</Label>
                <Input type="number" placeholder="2" className="w-24" />
              </div>
              <div className="space-y-2">
                <Label>Attendance tracking method</Label>
                <Select defaultValue="manual">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual check-in</SelectItem>
                    <SelectItem value="qr">QR code scanning</SelectItem>
                    <SelectItem value="location">Location-based</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Send meeting reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically send reminders before DCG meetings
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New member registrations</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when new members register
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Event attendance updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about event attendance changes
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Financial transaction alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about new financial transactions
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Communication Settings
              </CardTitle>
              <CardDescription>
                Configure communication templates and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Default email signature</Label>
                <Textarea 
                  placeholder="Enter your default email signature..."
                  className="h-24"
                />
              </div>
              <div className="space-y-2">
                <Label>Welcome message template</Label>
                <Textarea 
                  placeholder="Enter welcome message for new members..."
                  className="h-24"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure security and access control settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-factor authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Require 2FA for admin access
                  </p>
                </div>
                <Switch />
              </div>
              <div className="space-y-2">
                <Label>Session timeout (minutes)</Label>
                <Input type="number" placeholder="60" className="w-24" />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Audit logging</Label>
                  <p className="text-sm text-muted-foreground">
                    Log all administrative actions
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                System Maintenance
              </CardTitle>
              <CardDescription>
                System status and maintenance options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>System Status</Label>
                  <p className="text-sm text-muted-foreground">
                    All systems operational
                  </p>
                </div>
                <Badge variant="default" className="bg-green-500">
                  Online
                </Badge>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Last backup</Label>
                <p className="text-sm text-muted-foreground">
                  January 22, 2025 at 2:00 AM
                </p>
              </div>
              <div className="space-y-2">
                <Label>Database size</Label>
                <p className="text-sm text-muted-foreground">
                  2.4 GB
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-4 pt-6">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleSaveSettings} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
      </div>
    </RegionalAdminLayout>
  );
};

export default Settings;