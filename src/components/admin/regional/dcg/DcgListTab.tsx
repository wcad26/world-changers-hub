
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Search, Eye, Edit, Phone, AlertCircle } from "lucide-react";
import { useDcgs, DcgWithLeader } from "@/hooks/useDCGs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const DcgListTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: dcgs, isLoading, isError, error } = useDcgs();

  const filteredDcgs = (dcgs || []).filter(dcg =>
    dcg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dcg.leader?.profiles && `${dcg.leader.profiles.first_name} ${dcg.leader.profiles.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (dcg.location && dcg.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getLeaderName = (dcg: DcgWithLeader) => {
    if (dcg.leader?.profiles) {
      return `${dcg.leader.profiles.first_name || ''} ${dcg.leader.profiles.last_name || ''}`.trim() || 'N/A';
    }
    return "N/A";
  };
  
  const formatMeetingTime = (time: string | null) => {
    if (!time) return 'N/A';
    // Handles `HH:MM:SS` format from Supabase
    const [hour, minute] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hour, 10));
    date.setMinutes(parseInt(minute, 10));
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>DCG Directory</CardTitle>
        <CardDescription>
          Complete listing of all DCGs in your region.
        </CardDescription>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search DCGs..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New DCG
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Leader</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Meeting Schedule</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                    </TableRow>
                  ))
                )}
                {isError && (
                   <TableRow>
                    <TableCell colSpan={7}>
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                          {error instanceof Error ? error.message : "Failed to fetch DCGs."}
                        </AlertDescription>
                      </Alert>
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && !isError && filteredDcgs.length > 0 ? (
                  filteredDcgs.map((dcg) => (
                    <TableRow key={dcg.id}>
                      <TableCell className="font-medium">{dcg.name}</TableCell>
                      <TableCell>{getLeaderName(dcg)}</TableCell>
                      <TableCell>{dcg.location || 'N/A'}</TableCell>
                      <TableCell>{/* Members count not available yet */ 'N/A'}</TableCell>
                      <TableCell>{dcg.meeting_day || 'N/A'}, {formatMeetingTime(dcg.meeting_time)}</TableCell>
                      <TableCell>{/* Attendance not available yet */ 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm" aria-label="View DCG">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" aria-label="Edit DCG">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" aria-label="Call DCG Leader">
                            <Phone className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : null}
                 {!isLoading && !isError && filteredDcgs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center h-24">
                        No DCGs found.
                      </TableCell>
                    </TableRow>
                  )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DcgListTab;
