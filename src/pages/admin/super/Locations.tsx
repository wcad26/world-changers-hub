import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RegionsLocationsTab from '@/components/admin/super/locations/RegionsLocationsTab';
import DcgsLocationsTab from '@/components/admin/super/locations/DcgsLocationsTab';

const SuperLocations: React.FC = () => {
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Overview of all WCA regional centers and DCG locations across the organization.
      </p>

      <Tabs defaultValue="regions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="regions">WCA Regions</TabsTrigger>
          <TabsTrigger value="dcgs">DCGs</TabsTrigger>
        </TabsList>

        <TabsContent value="regions" className="mt-0">
          <RegionsLocationsTab />
        </TabsContent>

        <TabsContent value="dcgs" className="mt-0">
          <DcgsLocationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SuperLocations;
