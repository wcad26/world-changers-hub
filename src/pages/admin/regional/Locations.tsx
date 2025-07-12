
import React, { useState } from "react";
import RegionalAdminLayout from "@/components/admin/RegionalAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Home, Building, Plus, Search, Loader2, MoreHorizontal, Edit, Trash } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocations, useCreateLocation, useUpdateLocation, useDeleteLocation, locationSchema, type NewLocationData } from "@/hooks/useLocations";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";
import GoogleMap from "@/components/ui/GoogleMap";

type Location = Database['public']['Tables']['locations']['Row'];

const RegionalLocations: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number, address: string} | null>(null);
  const { toast } = useToast();
  const { userRegion } = useAuth();
  
  // Fetch locations data
  const { data: locations = [], isLoading } = useLocations(userRegion?.id);
  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  const deleteLocation = useDeleteLocation();
  
  const form = useForm<NewLocationData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: "",
      type: "WCA Center",
      address: "",
      city: "",
      state: "",
      zip: "",
      latitude: undefined,
      longitude: undefined,
      contact_person: "",
      contact_phone: "",
    },
  });

  const editForm = useForm<NewLocationData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: "",
      type: "WCA Center",
      address: "",
      city: "",
      state: "",
      zip: "",
      latitude: undefined,
      longitude: undefined,
      contact_person: "",
      contact_phone: "",
    },
  });

  const filteredLocations = locations.filter(location => 
    (location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.address.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (typeFilter === "all" || location.type.toLowerCase() === typeFilter.toLowerCase())
  );

  function onSubmit(values: NewLocationData) {
    createLocation.mutate(values, {
      onSuccess: () => {
        toast({
          title: "Location Created",
          description: `${values.name} has been added successfully.`,
        });
        form.reset();
        setIsDialogOpen(false);
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.message || "Failed to create location. Please try again.",
          variant: "destructive",
        });
      },
    });
  }

  function onEditSubmit(values: NewLocationData) {
    if (!editingLocation) return;
    
    updateLocation.mutate({ id: editingLocation.id, ...values }, {
      onSuccess: () => {
        toast({
          title: "Location Updated",
          description: `${values.name} has been updated successfully.`,
        });
        editForm.reset();
        setIsEditDialogOpen(false);
        setEditingLocation(null);
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.message || "Failed to update location. Please try again.",
          variant: "destructive",
        });
      },
    });
  }

  function handleEdit(location: Location) {
    setEditingLocation(location);
    editForm.reset({
      name: location.name,
      type: location.type as "WCA Center" | "DCG Location",
      address: location.address,
      city: location.city,
      state: location.state,
      zip: location.zip || "",
      latitude: location.latitude || undefined,
      longitude: location.longitude || undefined,
      contact_person: location.contact_person || "",
      contact_phone: location.contact_phone || "",
    });
    setIsEditDialogOpen(true);
  }

  function handleDelete(location: Location) {
    deleteLocation.mutate(location.id, {
      onSuccess: () => {
        toast({
          title: "Location Deleted",
          description: `${location.name} has been deleted successfully.`,
        });
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.message || "Failed to delete location. Please try again.",
          variant: "destructive",
        });
      },
    });
  }

  return (
    <RegionalAdminLayout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Location Management</h2>
        <p className="text-muted-foreground">
          Manage WCA centers and Destiny Care Group (DCG) meeting locations.
        </p>
        
        <Tabs defaultValue="all">
          <TabsList className="grid grid-cols-1 md:grid-cols-3 w-full max-w-2xl">
            <TabsTrigger value="all">All Locations</TabsTrigger>
            <TabsTrigger value="centers">WCA Centers</TabsTrigger>
            <TabsTrigger value="dcg">DCG Locations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>All Locations</CardTitle>
                <CardDescription>
                  View and manage all locations in your region.
                </CardDescription>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search locations..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select 
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <option value="all">All Types</option>
                    <option value="wca center">WCA Centers</option>
                    <option value="dcg location">DCG Locations</option>
                  </select>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Location
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Add New Location</DialogTitle>
                        <DialogDescription>
                          Register a new WCA center or DCG meeting location.
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Location Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Main Center" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="type"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Location Type</FormLabel>
                                  <select 
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                    {...field}
                                  >
                                    <option value="">Select type</option>
                                    <option value="WCA Center">WCA Center</option>
                                    <option value="DCG Location">DCG Location</option>
                                  </select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="address"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Address</FormLabel>
                                  <FormControl>
                                    <Input placeholder="123 Main St" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="city"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>City</FormLabel>
                                  <FormControl>
                                    <Input placeholder="New York" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="state"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>State/Region/Province</FormLabel>
                                  <FormControl>
                                    <Input placeholder="NY" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="zip"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>ZIP Code</FormLabel>
                                  <FormControl>
                                    <Input placeholder="10001" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                             <FormField
                               control={form.control}
                               name="contact_person"
                               render={({ field }) => (
                                 <FormItem>
                                   <FormLabel>Contact Person</FormLabel>
                                   <FormControl>
                                     <Input placeholder="John Doe" {...field} />
                                   </FormControl>
                                   <FormMessage />
                                 </FormItem>
                               )}
                             />
                             <FormField
                               control={form.control}
                               name="contact_phone"
                               render={({ field }) => (
                                 <FormItem>
                                   <FormLabel>Contact Phone</FormLabel>
                                   <FormControl>
                                     <Input placeholder="+1234567890" {...field} />
                                   </FormControl>
                                   <FormMessage />
                                 </FormItem>
                               )}
                             />
                          </div>
                          
                          <div className="mt-6 border rounded-md p-4">
                            <h3 className="text-sm font-medium mb-2">Location Map</h3>
                            <GoogleMap
                              height="300px"
                              onLocationSelect={(lat, lng, address) => {
                                setSelectedLocation({ lat, lng, address });
                                form.setValue('latitude', lat);
                                form.setValue('longitude', lng);
                                // Optionally update address field
                                if (address && !form.getValues('address')) {
                                  form.setValue('address', address);
                                }
                              }}
                            />
                            {selectedLocation && (
                              <div className="mt-2 p-2 bg-muted rounded-sm">
                                <p className="text-xs text-muted-foreground">
                                  Selected: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                                </p>
                              </div>
                            )}
                          </div>
                          
                           <div className="flex justify-end gap-4">
                             <Button type="button" variant="outline" disabled={createLocation.isPending} onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                             <Button type="submit" disabled={createLocation.isPending}>
                               {createLocation.isPending ? (
                                 <>
                                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                   Adding Location...
                                 </>
                               ) : (
                                 <>
                                   <MapPin className="mr-2 h-4 w-4" />
                                   Add Location
                                 </>
                               )}
                             </Button>
                           </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>

                  {/* Edit Location Dialog */}
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Edit Location</DialogTitle>
                        <DialogDescription>
                          Update the location details.
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...editForm}>
                        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={editForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Location Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Main Center" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={editForm.control}
                              name="type"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Location Type</FormLabel>
                                  <select 
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                    {...field}
                                  >
                                    <option value="">Select type</option>
                                    <option value="WCA Center">WCA Center</option>
                                    <option value="DCG Location">DCG Location</option>
                                  </select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={editForm.control}
                              name="address"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Address</FormLabel>
                                  <FormControl>
                                    <Input placeholder="123 Main St" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={editForm.control}
                              name="city"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>City</FormLabel>
                                  <FormControl>
                                    <Input placeholder="New York" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={editForm.control}
                              name="state"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>State/Region/Province</FormLabel>
                                  <FormControl>
                                    <Input placeholder="NY" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={editForm.control}
                              name="zip"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>ZIP Code</FormLabel>
                                  <FormControl>
                                    <Input placeholder="10001" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                             <FormField
                               control={editForm.control}
                               name="contact_person"
                               render={({ field }) => (
                                 <FormItem>
                                   <FormLabel>Contact Person</FormLabel>
                                   <FormControl>
                                     <Input placeholder="John Doe" {...field} />
                                   </FormControl>
                                   <FormMessage />
                                 </FormItem>
                               )}
                             />
                             <FormField
                               control={editForm.control}
                               name="contact_phone"
                               render={({ field }) => (
                                 <FormItem>
                                   <FormLabel>Contact Phone</FormLabel>
                                   <FormControl>
                                     <Input placeholder="+1234567890" {...field} />
                                   </FormControl>
                                   <FormMessage />
                                 </FormItem>
                               )}
                             />
                          </div>
                          
                           <div className="flex justify-end gap-4">
                             <Button type="button" variant="outline" disabled={updateLocation.isPending} onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                             <Button type="submit" disabled={updateLocation.isPending}>
                               {updateLocation.isPending ? (
                                 <>
                                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                   Updating Location...
                                 </>
                               ) : (
                                 <>
                                   <Edit className="mr-2 h-4 w-4" />
                                   Update Location
                                 </>
                               )}
                             </Button>
                           </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
               <CardContent>
                 {isLoading ? (
                   <div className="flex items-center justify-center h-32">
                     <Loader2 className="h-6 w-6 animate-spin mr-2" />
                     Loading locations...
                   </div>
                 ) : (
                   <div className="rounded-md border overflow-hidden">
                     <div className="overflow-x-auto">
                       <Table>
                         <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Address</TableHead>
                              <TableHead>Contact</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                         </TableHeader>
                         <TableBody>
                           {filteredLocations.length > 0 ? (
                             filteredLocations.map((location) => (
                                <TableRow key={location.id}>
                                  <TableCell className="font-medium">{location.name}</TableCell>
                                  <TableCell>{location.type}</TableCell>
                                  <TableCell>{`${location.address}, ${location.city}, ${location.state} ${location.zip}`}</TableCell>
                                  <TableCell>{location.contact_person || location.contact_phone || "N/A"}</TableCell>
                                   <TableCell>
                                     <DropdownMenu>
                                       <DropdownMenuTrigger asChild>
                                         <Button variant="ghost" size="sm">
                                           <MoreHorizontal className="h-4 w-4" />
                                         </Button>
                                       </DropdownMenuTrigger>
                                       <DropdownMenuContent align="end">
                                         <DropdownMenuItem onClick={() => handleEdit(location)}>
                                           <Edit className="mr-2 h-4 w-4" />
                                           Edit
                                         </DropdownMenuItem>
                                         <AlertDialog>
                                           <AlertDialogTrigger asChild>
                                             <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                               <Trash className="mr-2 h-4 w-4" />
                                               Delete
                                             </DropdownMenuItem>
                                           </AlertDialogTrigger>
                                           <AlertDialogContent>
                                             <AlertDialogHeader>
                                               <AlertDialogTitle>Delete Location</AlertDialogTitle>
                                               <AlertDialogDescription>
                                                 Are you sure you want to delete {location.name}? This action cannot be undone.
                                               </AlertDialogDescription>
                                             </AlertDialogHeader>
                                             <AlertDialogFooter>
                                               <AlertDialogCancel>Cancel</AlertDialogCancel>
                                               <AlertDialogAction onClick={() => handleDelete(location)}>
                                                 Delete
                                               </AlertDialogAction>
                                             </AlertDialogFooter>
                                           </AlertDialogContent>
                                         </AlertDialog>
                                       </DropdownMenuContent>
                                     </DropdownMenu>
                                   </TableCell>
                                </TableRow>
                             ))
                           ) : (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">
                                  {isLoading ? "Loading..." : "No locations found"}
                                </TableCell>
                              </TableRow>
                           )}
                         </TableBody>
                       </Table>
                     </div>
                   </div>
                 )}
               </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="centers">
            <Card>
              <CardHeader>
                <CardTitle>WCA Centers</CardTitle>
                <CardDescription>
                  Manage WCA worship and meeting centers.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredLocations.filter(location => location.type === "WCA Center").map((location) => (
                    <Card key={location.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{location.name}</CardTitle>
                            <CardDescription>
                              {location.address}
                            </CardDescription>
                          </div>
                          <Building className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardHeader>
                       <CardContent>
                         <div className="space-y-2 text-sm">
                           <div className="flex justify-between">
                             <span className="text-muted-foreground">Contact:</span>
                             <span>{location.contact_person || location.contact_phone || "N/A"}</span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-muted-foreground">Status:</span>
                             <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                               {location.status}
                             </span>
                           </div>
                         </div>
                       </CardContent>
                       <CardFooter className="flex justify-between">
                         <Button variant="outline" size="sm">
                           <MapPin className="mr-1 h-4 w-4" />
                           View Map
                         </Button>
                         <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                             <Button variant="outline" size="sm">
                               <MoreHorizontal className="h-4 w-4" />
                             </Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end">
                             <DropdownMenuItem onClick={() => handleEdit(location)}>
                               <Edit className="mr-2 h-4 w-4" />
                               Edit
                             </DropdownMenuItem>
                             <AlertDialog>
                               <AlertDialogTrigger asChild>
                                 <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                   <Trash className="mr-2 h-4 w-4" />
                                   Delete
                                 </DropdownMenuItem>
                               </AlertDialogTrigger>
                               <AlertDialogContent>
                                 <AlertDialogHeader>
                                   <AlertDialogTitle>Delete Location</AlertDialogTitle>
                                   <AlertDialogDescription>
                                     Are you sure you want to delete {location.name}? This action cannot be undone.
                                   </AlertDialogDescription>
                                 </AlertDialogHeader>
                                 <AlertDialogFooter>
                                   <AlertDialogCancel>Cancel</AlertDialogCancel>
                                   <AlertDialogAction onClick={() => handleDelete(location)}>
                                     Delete
                                   </AlertDialogAction>
                                 </AlertDialogFooter>
                               </AlertDialogContent>
                             </AlertDialog>
                           </DropdownMenuContent>
                         </DropdownMenu>
                       </CardFooter>
                    </Card>
                  ))}
                  
                  {filteredLocations.filter(location => location.type === "WCA Center").length === 0 && (
                    <div className="col-span-2 text-center py-8">
                      No WCA centers found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="dcg">
            <Card>
              <CardHeader>
                <CardTitle>DCG Locations</CardTitle>
                <CardDescription>
                  Manage Destiny Care Group meeting locations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredLocations.filter(location => location.type === "DCG Location").map((location) => (
                    <Card key={location.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{location.name}</CardTitle>
                            <CardDescription>
                              {location.address}
                            </CardDescription>
                          </div>
                          <Home className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardHeader>
                       <CardContent>
                         <div className="space-y-2 text-sm">
                           <div className="flex justify-between">
                             <span className="text-muted-foreground">Contact:</span>
                             <span>{location.contact_person || location.contact_phone || "N/A"}</span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-muted-foreground">Status:</span>
                             <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                               {location.status}
                             </span>
                           </div>
                         </div>
                       </CardContent>
                       <CardFooter className="flex justify-between">
                         <Button variant="outline" size="sm">
                           <MapPin className="mr-1 h-4 w-4" />
                           View Map
                         </Button>
                         <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                             <Button variant="outline" size="sm">
                               <MoreHorizontal className="h-4 w-4" />
                             </Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end">
                             <DropdownMenuItem onClick={() => handleEdit(location)}>
                               <Edit className="mr-2 h-4 w-4" />
                               Edit
                             </DropdownMenuItem>
                             <AlertDialog>
                               <AlertDialogTrigger asChild>
                                 <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                   <Trash className="mr-2 h-4 w-4" />
                                   Delete
                                 </DropdownMenuItem>
                               </AlertDialogTrigger>
                               <AlertDialogContent>
                                 <AlertDialogHeader>
                                   <AlertDialogTitle>Delete Location</AlertDialogTitle>
                                   <AlertDialogDescription>
                                     Are you sure you want to delete {location.name}? This action cannot be undone.
                                   </AlertDialogDescription>
                                 </AlertDialogHeader>
                                 <AlertDialogFooter>
                                   <AlertDialogCancel>Cancel</AlertDialogCancel>
                                   <AlertDialogAction onClick={() => handleDelete(location)}>
                                     Delete
                                   </AlertDialogAction>
                                 </AlertDialogFooter>
                               </AlertDialogContent>
                             </AlertDialog>
                           </DropdownMenuContent>
                         </DropdownMenu>
                       </CardFooter>
                    </Card>
                  ))}
                  
                  {filteredLocations.filter(location => location.type === "DCG Location").length === 0 && (
                    <div className="col-span-2 text-center py-8">
                      No DCG locations found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
        </Tabs>
      </div>
    </RegionalAdminLayout>
  );
};

export default RegionalLocations;
