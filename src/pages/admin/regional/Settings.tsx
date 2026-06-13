import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings as SettingsIcon, 
  Home, 
  Bell, 
  Mail, 
  DollarSign,
  Shield,
  Clock,
} from "lucide-react";
import RegionalBranchForm from "@/components/admin/regional/RegionalBranchForm";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useAuth } from "@/hooks/useAuth";
import { useRegionMutations } from "@/hooks/useRegionMutations";
import { useToast } from "@/hooks/use-toast";
import RegionalAccessTab from "@/components/admin/regional/access/AccessTab";
import { useSearchParams } from "react-router-dom";
import { GlassSection, GlassSectionHeader } from "@/components/ui/GlassSection";

const Settings = () => {
  const { userRegion } = useAuth();
  const { toast } = useToast();
  const { data: currencies, isLoading: currenciesLoading } = useCurrencies();
  const { updateRegion } = useRegionMutations();

  const [selectedCurrency, setSelectedCurrency] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userRegion?.currency_code) {
      setSelectedCurrency(userRegion.currency_code);
    }
  }, [userRegion]);

  const handleSaveSettings = async () => {
    if (!userRegion?.id) {
      toast({ title: "Error", description: "No region found for current user", variant: "destructive" });
      return;
    }
    if (!selectedCurrency) {
      toast({ title: "Error", description: "Please select a currency", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      await updateRegion.mutateAsync({
        id: userRegion.id,
        updates: { currency_code: selectedCurrency },
      });
      toast({ title: "Settings saved", description: "Currency settings have been updated successfully" });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({ title: "Error", description: "Failed to save settings. Please try again.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const [params, setParams] = useSearchParams();
  const activeTab = params.get("tab") || "regional";

  return (
    <>
      <div className="space-y-6">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setParams({ tab: v })}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 h-auto">
            <TabsTrigger value="regional">Regional Portal</TabsTrigger>
            <TabsTrigger value="branch">Branch Details</TabsTrigger>
            <TabsTrigger value="access">Access</TabsTrigger>
            <TabsTrigger value="dcg">DCG Management</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="regional" className="space-y-6">
            <GlassSection>
              <GlassSectionHeader
                icon={<DollarSign className="h-5 w-5" />}
                title="Financial Settings"
                description="Configure financial management and reporting preferences"
              />
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Default currency</Label>
                  <Select value={selectedCurrency} onValueChange={setSelectedCurrency} disabled={currenciesLoading}>
                    <SelectTrigger className="w-full sm:w-64 bg-background/60 border shadow-sm">
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
                    <p className="text-sm text-muted-foreground">All expense records must include receipt attachments</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="space-y-2">
                  <Label>Expense approval threshold</Label>
                  <Input type="number" placeholder="1000" className="w-32 bg-background/60" />
                  <p className="text-sm text-muted-foreground">Expenses above this amount require additional approval</p>
                </div>
              </div>
            </GlassSection>
          </TabsContent>

          <TabsContent value="branch" className="space-y-6">
            <RegionalBranchForm />
          </TabsContent>

          <TabsContent value="access" className="space-y-6">
            <RegionalAccessTab />
          </TabsContent>


          <TabsContent value="dcg" className="space-y-6">
            <GlassSection>
              <GlassSectionHeader
                icon={<Home className="h-5 w-5" />}
                title="DCG Configuration"
                description="Configure Discipleship Community Group settings and policies"
              />
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Maximum DCG size</Label>
                  <Input type="number" placeholder="15" className="w-24 bg-background/60" />
                  <p className="text-sm text-muted-foreground">Maximum number of members allowed per DCG</p>
                </div>
                <div className="space-y-2">
                  <Label>Minimum DCG size</Label>
                  <Input type="number" placeholder="5" className="w-24 bg-background/60" />
                  <p className="text-sm text-muted-foreground">Minimum number of members required to maintain a DCG</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-assign new members to DCGs</Label>
                    <p className="text-sm text-muted-foreground">Automatically assign new members to DCGs based on location</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow DCG leader self-appointment</Label>
                    <p className="text-sm text-muted-foreground">Members can volunteer to become DCG leaders</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </GlassSection>

            <GlassSection>
              <GlassSectionHeader
                icon={<Clock className="h-5 w-5" />}
                title="DCG Meeting Settings"
                description="Configure default meeting schedules and attendance tracking"
              />
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Default meeting duration (hours)</Label>
                  <Input type="number" placeholder="2" className="w-24 bg-background/60" />
                </div>
                <div className="space-y-2">
                  <Label>Attendance tracking method</Label>
                  <Select defaultValue="manual">
                    <SelectTrigger className="bg-background/60">
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
                    <p className="text-sm text-muted-foreground">Automatically send reminders before DCG meetings</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </GlassSection>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <GlassSection>
              <GlassSectionHeader
                icon={<Bell className="h-5 w-5" />}
                title="Notification Preferences"
                description="Configure how and when you receive notifications"
              />
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>New member registrations</Label>
                    <p className="text-sm text-muted-foreground">Get notified when new members register</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Event attendance updates</Label>
                    <p className="text-sm text-muted-foreground">Get notified about event attendance changes</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Financial transaction alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified about new financial transactions</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </GlassSection>

            <GlassSection>
              <GlassSectionHeader
                icon={<Mail className="h-5 w-5" />}
                title="Communication Settings"
                description="Configure communication templates and preferences"
              />
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Default email signature</Label>
                  <Textarea placeholder="Enter your default email signature..." className="h-24 bg-background/60" />
                </div>
                <div className="space-y-2">
                  <Label>Welcome message template</Label>
                  <Textarea placeholder="Enter welcome message for new members..." className="h-24 bg-background/60" />
                </div>
              </div>
            </GlassSection>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <GlassSection>
              <GlassSectionHeader
                icon={<Shield className="h-5 w-5" />}
                title="Security Settings"
                description="Configure security and access control settings"
              />
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-factor authentication</Label>
                    <p className="text-sm text-muted-foreground">Require 2FA for admin access</p>
                  </div>
                  <Switch />
                </div>
                <div className="space-y-2">
                  <Label>Session timeout (minutes)</Label>
                  <Input type="number" placeholder="60" className="w-24 bg-background/60" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Audit logging</Label>
                    <p className="text-sm text-muted-foreground">Log all administrative actions</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </GlassSection>

            <GlassSection>
              <GlassSectionHeader
                icon={<Clock className="h-5 w-5" />}
                title="System Maintenance"
                description="System status and maintenance options"
              />
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>System Status</Label>
                    <p className="text-sm text-muted-foreground">All systems operational</p>
                  </div>
                  <Badge variant="default" className="bg-green-500">Online</Badge>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Last backup</Label>
                  <p className="text-sm text-muted-foreground">January 22, 2025 at 2:00 AM</p>
                </div>
                <div className="space-y-2">
                  <Label>Database size</Label>
                  <p className="text-sm text-muted-foreground">2.4 GB</p>
                </div>
              </div>
            </GlassSection>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-4 pt-6">
          <Button variant="outline">Cancel</Button>
          <Button onClick={handleSaveSettings} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </>
  );
};

export default Settings;
