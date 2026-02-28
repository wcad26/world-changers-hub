import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PlusCircle, Search, Eye, Edit, Trash2, MoreHorizontal, AlertCircle } from "lucide-react";
import { useDcgs, useDeleteDcg, DcgWithLeader } from "@/hooks/useDCGs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AddDcgDialog } from "./AddDcgDialog";
import { useToast } from "@/hooks/use-toast";

const DcgListTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDcgDialogOpen, setAddDcgDialogOpen] = useState(false);
  const { data: dcgs, isLoading, isError, error } = useDcgs();
  const deleteDcg = useDeleteDcg();
  const { toast } = useToast();

  const filteredDcgs = (dcgs || []).filter(dcg =>
    dcg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dcg.leader?.profiles && `${dcg.leader.profiles.first_name} ${dcg.leader.profiles.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (dcg.location && dcg.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getLeaderName = (dcg: DcgWithLeader) => {
    if (dcg.leader?.profiles) {
      return `${dcg.leader.profiles.last_name || ''} ${dcg.leader.profiles.first_name || ''}`.trim() || 'N/A';
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
  };

  const handleDeleteDcg = async (dcgId: string, dcgName: string) => {
    if (window.confirm(`Are you sure you want to delete "${dcgName}"? This action cannot be undone.`)) {
      try {
        await deleteDcg.mutateAsync(dcgId);
        toast({
          title: "DCG deleted",
          description: `${dcgName} has been successfully deleted.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete DCG. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <>
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
            <Button onClick={() => setAddDcgDialogOpen(true)}>
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
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-background border shadow-md z-50">
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDeleteDcg(dcg.id, dcg.name)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
      <AddDcgDialog open={isAddDcgDialogOpen} setOpen={setAddDcgDialogOpen} />
    </>
  );
};

export default DcgListTab;
