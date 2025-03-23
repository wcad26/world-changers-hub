
import React, { useState } from "react";
import RegionalAdminLayout from "@/components/admin/RegionalAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Home, Building, Users, Plus, Search, Map } from "lucide-react";

// Mock data for demonstration
const mockLocations = [
  { id: 1, name: "Main Center", type: "WCA Center", address: "123 Main St, New York, NY 10001", capacity: 500, facilities: "Sanctuary, Classrooms, Offices", status: "Active" },
  { id: 2, name: "Youth Center", type: "WCA Center", address: "456 Park Ave, New York, NY 10002", capacity: 150, facilities: "Meeting Hall, Recreation Area", status: "Active" },
  { id: 3, name: "North DCG", type: "DCG Location", address: "789 North Rd, New York, NY 10003", capacity: 30, facilities: "Living Room", status: "Active" },
  { id: 4, name: "South DCG", type: "DCG Location", address: "321 South Blvd, New York, NY 10004", capacity: 25, facilities: "Basement Meeting Room", status: "Active" },
];

// Form schema for location creation
const locationSchema = z.object({
  name: z.string().min(3, { message: "Location name must be at least 3 characters." }),
  type: z.string().min(1, { message: "Please select a location type." }),
  address: z.string().min(5, { message: "Please provide a valid address." }),
  city: z.string().min(2, { message: "Please enter a city." }),
  state: z.string().min(2, { message: "Please enter a state." }),
  zip: z.string().min(5, { message: "Please enter a valid ZIP code." }),
  capacity: z.string().min(1, { message: "Please enter the capacity." }),
  facilities: z.string().optional(),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
});

const RegionalLocations: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  
  const form = useForm<z.infer<typeof locationSchema>>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: "",
      type: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      capacity: "",
      facilities: "",
      contactPerson: "",
      contactPhone: "",
    },
  });

  const filteredLocations = mockLocations.filter(location => 
    (location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.address.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (typeFilter === "all" || location.type.toLowerCase() === typeFilter.toLowerCase())
  );

  function onSubmit(values: z.infer<typeof locationSchema>) {
    console.log(values);
    // In a real app, this would save the location to a database
    alert("Location added successfully!");
    form.reset();
  }

  return (
    <RegionalAdminLayout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Location Management</h2>
        <p className="text-muted-foreground">
          Manage WCA centers and Destiny Care Group (DCG) meeting locations.
        </p>
        
        <Tabs defaultValue="all">
          <TabsList className="grid grid-cols-1 md:grid-cols-4 w-full max-w-3xl">
            <TabsTrigger value="all">All Locations</TabsTrigger>
            <TabsTrigger value="centers">WCA Centers</TabsTrigger>
            <TabsTrigger value="dcg">DCG Locations</TabsTrigger>
            <TabsTrigger value="add">Add Location</TabsTrigger>
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
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Location
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
                          <TableHead>Type</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>Capacity</TableHead>
                          <TableHead>Facilities</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLocations.length > 0 ? (
                          filteredLocations.map((location) => (
                            <TableRow key={location.id}>
                              <TableCell className="font-medium">{location.name}</TableCell>
                              <TableCell>{location.type}</TableCell>
                              <TableCell>{location.address}</TableCell>
                              <TableCell>{location.capacity}</TableCell>
                              <TableCell>{location.facilities}</TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button variant="outline" size="sm">Edit</Button>
                                  <Button variant="outline" size="sm">View</Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center h-24">
                              No locations found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
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
                            <span className="text-muted-foreground">Capacity:</span>
                            <span>{location.capacity} people</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Facilities:</span>
                            <span>{location.facilities}</span>
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
                        <Button variant="outline" size="sm">
                          Edit Details
                        </Button>
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
                            <span className="text-muted-foreground">Capacity:</span>
                            <span>{location.capacity} people</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Facilities:</span>
                            <span>{location.facilities}</span>
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
                        <Button variant="outline" size="sm">
                          Edit Details
                        </Button>
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
          
          <TabsContent value="add">
            <Card>
              <CardHeader>
                <CardTitle>Add New Location</CardTitle>
                <CardDescription>
                  Register a new WCA center or DCG meeting location.
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                            <FormLabel>State</FormLabel>
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
                        name="capacity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Capacity</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="100" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="facilities"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Facilities</FormLabel>
                            <FormControl>
                              <Input placeholder="Sanctuary, Classrooms" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="contactPerson"
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
                        name="contactPhone"
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
                      <div className="h-[200px] bg-gray-100 rounded flex items-center justify-center">
                        <div className="text-center space-y-2">
                          <Map className="h-8 w-8 mx-auto text-gray-400" />
                          <p className="text-sm text-muted-foreground">Map will be displayed here</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Pin the exact location on the map or enter the coordinates
                      </p>
                    </div>
                    
                    <div className="flex justify-end gap-4">
                      <Button type="button" variant="outline">Cancel</Button>
                      <Button type="submit">
                        <MapPin className="mr-2 h-4 w-4" />
                        Add Location
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RegionalAdminLayout>
  );
};

export default RegionalLocations;
