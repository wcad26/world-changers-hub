import React from 'react';
import RegionsLocationsTab from '@/components/admin/super/locations/RegionsLocationsTab';

const SuperLocations: React.FC = () => {
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Overview of all WCA regional centers and DCG locations across the organization.
      </p>
      <RegionsLocationsTab />
    </div>
  );
};

export default SuperLocations;
