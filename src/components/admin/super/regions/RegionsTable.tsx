
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAllRegions, type Region } from '@/hooks/useAllRegions';
import { useRegionMutations } from '@/hooks/useRegionMutations';
import { Search, Plus, Edit, Trash2, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import CreateRegionDialog from './CreateRegionDialog';
import EditRegionDialog from './EditRegionDialog';

const RegionsTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);

  const { data: regions, isLoading } = useAllRegions({
    includeInactive,
    searchTerm,
    sortBy: 'name',
    sortOrder: 'asc'
  });

  const { deleteRegion, reactivateRegion } = useRegionMutations();

  const handleEdit = (region: Region) => {
    setSelectedRegion(region);
    setEditDialogOpen(true);
  };

  const handleDelete = (region: Region) => {
    if (window.confirm(`Are you sure you want to deactivate ${region.name}?`)) {
      deleteRegion.mutate(region.id);
    }
  };

  const handleReactivate = (region: Region) => {
    if (window.confirm(`Are you sure you want to reactivate ${region.name}?`)) {
      reactivateRegion.mutate(region.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-10 bg-gray-200 rounded w-64 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="border rounded-lg p-8">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex space-x-4">
                <div className="h-4 bg-gray-200 rounded flex-1 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Search and Create */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search regions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIncludeInactive(!includeInactive)}
            className={includeInactive ? 'bg-orange-50 border-orange-200' : ''}
          >
            {includeInactive ? 'Hide Inactive' : 'Show Inactive'}
          </Button>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Region
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Regional Pastor</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Established</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {regions?.map((region) => (
              <TableRow key={region.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{region.name}</div>
                    {region.description && (
                      <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {region.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{region.code}</Badge>
                </TableCell>
                <TableCell>{region.regional_pastor || 'Not assigned'}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    {region.contact_email && (
                      <div className="truncate max-w-[150px]">{region.contact_email}</div>
                    )}
                    {region.contact_phone && (
                      <div className="text-muted-foreground">{region.contact_phone}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={region.is_active ? 'default' : 'secondary'}>
                    {region.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {region.established_date 
                    ? format(new Date(region.established_date), 'MMM d, yyyy')
                    : 'Not set'
                  }
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(region)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {region.is_active ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(region)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReactivate(region)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {regions?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? 'No regions found matching your search.' : 'No regions found.'}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateRegionDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
      <EditRegionDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        region={selectedRegion}
      />
    </div>
  );
};

export default RegionsTable;
