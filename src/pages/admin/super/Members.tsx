
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SuperAdminLayout from "@/components/admin/SuperAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Loader2 } from "lucide-react";
import { useAllMembers } from "@/hooks/useAllMembers";
import { useAllRegions } from "@/hooks/useAllRegions";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const SuperMembers: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  // Fetch real data from database
  const { data: regions, isLoading: regionsLoading } = useAllRegions();
  const { data: members, isLoading: membersLoading } = useAllMembers({
    searchTerm,
    regionId: selectedRegion || undefined,
    status: statusFilter || undefined,
  });

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <p className="text-muted-foreground">
          Manage membership across all WCA regions.
        </p>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search members globally..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              disabled={regionsLoading}
            >
              <option value="">All Regions</option>
              {regions?.map(region => (
                <option key={region.id} value={region.id}>{region.name}</option>
              ))}
            </select>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="new">New</option>
              <option value="transferred">Transferred</option>
            </select>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <div className="text-sm text-muted-foreground">
              Showing {members?.length || 0} members
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {membersLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center h-24">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : members && members.length > 0 ? (
                      members.map((member) => (
                        <TableRow 
                          key={member.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => navigate(`/admin/super/members/${member.id}`)}
                        >
                          <TableCell className="font-medium">
                            {member.profiles?.first_name} {member.profiles?.last_name}
                          </TableCell>
                          <TableCell>{member.profiles?.email || 'N/A'}</TableCell>
                          <TableCell>{member.profiles?.phone || 'N/A'}</TableCell>
                          <TableCell>{member.regions?.name || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={member.member_type === 'member' ? 'default' : 'secondary'}>
                              {member.member_type === 'member' ? 'Member' : 'Visitor'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {member.join_date ? format(new Date(member.join_date), 'MMM d, yyyy') : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center h-24">
                          No members found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperMembers;
