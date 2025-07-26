import React from "react";
import SuperAdminLayout from "@/components/admin/SuperAdminLayout";
import SuperAboutUsForm from "@/components/admin/super/about/SuperAboutUsForm";
import { Info } from "lucide-react";

const AboutUsSettings = () => {
  return (
    <SuperAdminLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Info className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">About Us Settings</h1>
        </div>
        
        <div className="text-muted-foreground mb-6">
          <p>Manage the content that appears on the public About Us page of your website.</p>
        </div>
        
        <SuperAboutUsForm />
      </div>
    </SuperAdminLayout>
  );
};

export default AboutUsSettings;