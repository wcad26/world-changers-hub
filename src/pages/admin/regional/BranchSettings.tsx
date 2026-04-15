import React from "react";
import RegionalAdminLayout from "@/components/admin/RegionalAdminLayout";
import RegionalBranchForm from "@/components/admin/regional/RegionalBranchForm";
import { MapPin } from "lucide-react";

const BranchSettings = () => {
  return (
    <RegionalAdminLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <MapPin className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Regional Website Information</h1>
        </div>
        
        <RegionalBranchForm />
      </div>
    </RegionalAdminLayout>
  );
};

export default BranchSettings;