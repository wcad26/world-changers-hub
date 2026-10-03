import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Book, ShoppingCart, Search, Package, Clock } from 'lucide-react';

export default function MemberStore() {
  // Mock data - will be replaced with actual data when backend is implemented
  const storeItems = [
    {
      id: 1,
      title: "Purpose Driven Life",
      author: "Rick Warren",
      category: "Books",
      type: "Physical",
      price: 15.99,
      available: true,
      image: "/placeholder.svg",
      description: "A spiritual journey to discover God's purpose for your life."
    },
    {
      id: 2,
      title: "Worship Songs Collection",
      author: "Various Artists",
      category: "Audio",
      type: "Digital",
      price: 9.99,
      available: true,
      image: "/placeholder.svg",
      description: "Collection of contemporary worship songs for personal devotion."
    },
    {
      id: 3,
      title: "Bible Study Workbook",
      author: "Church Publications",
      category: "Study Materials",
      type: "Physical",
      price: 12.50,
      available: false,
      image: "/placeholder.svg",
      description: "Comprehensive workbook for group and individual Bible study."
    },
    {
      id: 4,
      title: "Faith & Science Documentary",
      author: "Christian Films",
      category: "Video",
      type: "Digital",
      price: 7.99,
      available: true,
      image: "/placeholder.svg",
      description: "Exploring the harmony between faith and scientific discovery."
    }
  ];

  const borrowedItems = [
    {
      id: 1,
      title: "The Case for Christ",
      author: "Lee Strobel",
      borrowed_date: "2024-12-01",
      due_date: "2024-12-29",
      status: "borrowed"
    },
    {
      id: 2,
      title: "Experiencing God Workbook",
      author: "Henry Blackaby",
      borrowed_date: "2024-11-15",
      due_date: "2024-12-13",
      status: "overdue"
    }
  ];

  const orderHistory = [
    {
      id: 1,
      title: "Jesus Calling",
      author: "Sarah Young",
      order_date: "2024-11-20",
      price: 13.99,
      status: "delivered"
    },
    {
      id: 2,
      title: "Praise Songs Album",
      author: "Worship Team",
      order_date: "2024-11-10",
      price: 8.99,
      status: "delivered"
    }
  ];

  const categories = ["All", "Books", "Audio", "Video", "Study Materials"];

  return (
    <div className="space-y-6">

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="browse">Browse Items</TabsTrigger>
          <TabsTrigger value="borrowed">Borrowed Items</TabsTrigger>
          <TabsTrigger value="cart">Cart</TabsTrigger>
          <TabsTrigger value="orders">Order History</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search books, audio, videos..." 
                className="pl-10"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category.toLowerCase()}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="physical">Physical</SelectItem>
                <SelectItem value="digital">Digital</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {storeItems.map((item) => (
              <Card key={item.id}>
                <CardHeader className="pb-3">
                  <div className="w-full h-32 bg-muted rounded flex items-center justify-center mb-3">
                    <Book className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription>By {item.author}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1 mb-3">
                    <Badge variant="outline">{item.category}</Badge>
                    <Badge variant={item.type === 'Digital' ? 'default' : 'secondary'}>
                      {item.type}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                  
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-lg font-bold text-foreground">${item.price}</span>
                    <Badge variant={item.available ? 'default' : 'destructive'}>
                      {item.available ? 'Available' : 'Out of Stock'}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    {item.type === 'Physical' && item.available && (
                      <Button size="sm" variant="outline">Borrow</Button>
                    )}
                    <Button size="sm" disabled={!item.available}>
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      {item.type === 'Digital' ? 'Download' : 'Purchase'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="borrowed" className="space-y-4">
          {borrowedItems.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Borrowed Items</h3>
                <p className="text-muted-foreground">
                  You haven't borrowed any items from the library yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {borrowedItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-foreground">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">By {item.author}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-muted-foreground">
                            Borrowed: {new Date(item.borrowed_date).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Due: {new Date(item.due_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={item.status === 'overdue' ? 'destructive' : 'default'}>
                          {item.status}
                        </Badge>
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" variant="outline">Renew</Button>
                          <Button size="sm">Return</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cart" className="space-y-4">
          <Card>
            <CardContent className="p-8 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Your Cart is Empty</h3>
              <p className="text-muted-foreground mb-4">
                Add items to your cart to proceed with purchase.
              </p>
              <Button variant="outline">Browse Items</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          {orderHistory.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Order History</h3>
                <p className="text-muted-foreground">
                  You haven't made any purchases yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {orderHistory.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-foreground">{order.title}</h3>
                        <p className="text-sm text-muted-foreground">By {order.author}</p>
                        <span className="text-xs text-muted-foreground">
                          Ordered: {new Date(order.order_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-foreground">${order.price}</p>
                        <Badge variant="default">{order.status}</Badge>
                        <Button size="sm" variant="outline" className="mt-2">
                          Reorder
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}