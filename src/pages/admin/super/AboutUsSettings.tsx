import React from "react";
import SuperAdminLayout from "@/components/admin/SuperAdminLayout";
import SuperAboutUsForm from "@/components/admin/super/about/SuperAboutUsForm";
import { Info } from "lucide-react";

const AboutUsSettings = () => {
  return (
    <SuperAdminLayout>
      <div className="container mx-auto py-6 space-y-6">
        <p className="text-muted-foreground mb-6">
          Manage the content that appears on the public About Us page of your website.
        </p>
        
        <SuperAboutUsForm />
      </div>
    </SuperAdminLayout>
  );
};

export default AboutUsSettings;