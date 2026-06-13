import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bell, Mail, Shield, Clock } from "lucide-react";
import { GlassSection, GlassSectionHeader } from "@/components/ui/GlassSection";
import GeneralTab from "@/components/admin/super/settings/GeneralTab";
import CurrencyTab from "@/components/admin/super/settings/CurrencyTab";
import SuperAccessTab from "@/components/admin/super/access/AccessTab";

export default function SuperSettings() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "general";

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">Global preferences that control the super admin portal.</p>
      <Tabs value={tab} onValueChange={(v) => setParams({ tab: v })} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 h-auto">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="access">Access</TabsTrigger>
          <TabsTrigger value="currency">Currency</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <GeneralTab />
        </TabsContent>

        <TabsContent value="access" className="space-y-6">
          <SuperAccessTab />
        </TabsContent>

        <TabsContent value="currency" className="space-y-6">
          <CurrencyTab />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <GlassSection>
            <GlassSectionHeader icon={<Bell className="h-5 w-5" />} title="Notification preferences" description="Configure how and when you receive global notifications" />
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5"><Label>Email notifications</Label><p className="text-sm text-muted-foreground">Receive global alerts via email</p></div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5"><Label>New region created</Label><p className="text-sm text-muted-foreground">Notify when a new region is added</p></div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5"><Label>Financial transaction alerts</Label><p className="text-sm text-muted-foreground">Alert on large transactions across regions</p></div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5"><Label>Admin role requests</Label><p className="text-sm text-muted-foreground">Notify when regional admins request roles</p></div>
                <Switch defaultChecked />
              </div>
            </div>
          </GlassSection>
        </TabsContent>

        <TabsContent value="communication" className="space-y-6">
          <GlassSection>
            <GlassSectionHeader icon={<Mail className="h-5 w-5" />} title="Communication settings" description="Default templates used in cross-region communications" />
            <div className="space-y-5">
              <div className="space-y-2"><Label>Default email signature</Label><Textarea placeholder="Enter your default email signature..." className="h-24 bg-background/60" /></div>
              <div className="space-y-2"><Label>Welcome message template</Label><Textarea placeholder="Enter the welcome message for new members..." className="h-24 bg-background/60" /></div>
            </div>
          </GlassSection>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <GlassSection>
            <GlassSectionHeader icon={<Shield className="h-5 w-5" />} title="Security" description="Global security and access control" />
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5"><Label>Two-factor authentication</Label><p className="text-sm text-muted-foreground">Require 2FA for super admin access</p></div>
                <Switch />
              </div>
              <div className="space-y-2"><Label>Session timeout (minutes)</Label><Input type="number" placeholder="60" className="w-24 bg-background/60" /></div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5"><Label>Audit logging</Label><p className="text-sm text-muted-foreground">Log all super admin actions</p></div>
                <Switch defaultChecked />
              </div>
            </div>
          </GlassSection>

          <GlassSection>
            <GlassSectionHeader icon={<Clock className="h-5 w-5" />} title="System status" description="Platform health" />
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5"><Label>System Status</Label><p className="text-sm text-muted-foreground">All systems operational</p></div>
                <Badge className="bg-green-500">Online</Badge>
              </div>
              <Separator />
              <div className="space-y-2"><Label>Database</Label><p className="text-sm text-muted-foreground">Supabase managed Postgres</p></div>
            </div>
          </GlassSection>
        </TabsContent>
      </Tabs>
    </div>
  );
}
