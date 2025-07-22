
import React from "react";
import RegionalAdminLayout from "@/components/admin/RegionalAdminLayout";
import DcgOverviewTab from "@/components/admin/regional/dcg/DcgOverviewTab";

const RegionalDCG: React.FC = () => {
  return (
    <RegionalAdminLayout>
      <div className="space-y-6">
        <DcgOverviewTab />
      </div>
    </RegionalAdminLayout>
  );
};

export default RegionalDCG;
