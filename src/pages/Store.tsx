import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { GlassPanel } from "@/components/ui/GlassPanels";
import { ShoppingCart, Book, Search, Filter, Star, Plus, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
interface Item {
  id: number;
  title: string;
  author: string;
  imageUrl: string;
  price: number;
  type: "book" | "merchandise" | "audio" | "course";
  category: string;
  rating: number;
  bestseller: boolean;
}
const storeItems: Item[] = [{
  id: 1,
  title: "Transformational Leadership",
  author: "Dr. James Wilson",
  imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  price: 19.99,
  type: "book",
  category: "Leadership",
  rating: 4.8,
  bestseller: true
}, {
  id: 2,
  title: "WCA Conference T-Shirt",
  author: "WCA Merchandise",
  imageUrl: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  price: 24.99,
  type: "merchandise",
  category: "Apparel",
  rating: 4.5,
  bestseller: false
}, {
  id: 3,
  title: "Spiritual Disciplines",
  author: "Pastor Sarah Johnson",
  imageUrl: "https://images.unsplash.com/photo-1621351183012-e2110f0dd754?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  price: 17.99,
  type: "book",
  category: "Spiritual Growth",
  rating: 4.9,
  bestseller: true
}, {
  id: 4,
  title: "Leadership Summit Recordings",
  author: "WCA Media",
  imageUrl: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  price: 29.99,
  type: "audio",
  category: "Leadership",
  rating: 4.7,
  bestseller: false
}, {
  id: 5,
  title: "Building Healthy Communities",
  author: "Dr. Michael Davis",
  imageUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  price: 21.99,
  type: "book",
  category: "Community",
  rating: 4.6,
  bestseller: false
}, {
  id: 6,
  title: "WCA Digital Bible Study",
  author: "WCA Education Team",
  imageUrl: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  price: 39.99,
  type: "course",
  category: "Bible Study",
  rating: 4.9,
  bestseller: true
}, {
  id: 7,
  title: "Faith & Finance",
  author: "Pastor Robert Lee",
  imageUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  price: 18.99,
  type: "book",
  category: "Finance",
  rating: 4.7,
  bestseller: false
}, {
  id: 8,
  title: "WCA Worship Music Album",
  author: "WCA Worship Team",
  imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  price: 14.99,
  type: "audio",
  category: "Worship",
  rating: 4.8,
  bestseller: true
}];
const Store = () => {
  const [activeTab, setActiveTab] = useState<"store" | "library">("store");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<{
    id: number;
    quantity: number;
  }[]>([]);
  const filteredItems = storeItems.filter(item => {
    // Filter by search
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase()) && !item.author.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Filter by category
    if (selectedCategory && item.category !== selectedCategory) return false;

    // Filter by type
    if (selectedType && item.type !== selectedType) return false;
    return true;
  });
  const categories = Array.from(new Set(storeItems.map(item => item.category)));
  const types = Array.from(new Set(storeItems.map(item => item.type)));
  const addToCart = (id: number) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === id);
      if (existing) {
        return prev.map(item => item.id === id ? {
          ...item,
          quantity: item.quantity + 1
        } : item);
      } else {
        return [...prev, {
          id,
          quantity: 1
        }];
      }
    });
  };
  const removeFromCart = (id: number) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === id);
      if (existing && existing.quantity > 1) {
        return prev.map(item => item.id === id ? {
          ...item,
          quantity: item.quantity - 1
        } : item);
      } else {
        return prev.filter(item => item.id !== id);
      }
    });
  };
  const getItemQuantity = (id: number) => {
    return cartItems.find(item => item.id === id)?.quantity || 0;
  };
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => {
    const storeItem = storeItems.find(storeItem => storeItem.id === item.id);
    return sum + (storeItem?.price || 0) * item.quantity;
  }, 0);
  return <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      {/* Fixed header bar */}
      <div className="fixed top-16 left-0 right-0 z-20 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 py-4">
        <div className="container-custom">
          <div className="flex justify-between items-center w-full">
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-full p-1">
              <button className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${activeTab === "store" ? "bg-wca-purple text-white" : ""}`} onClick={() => setActiveTab("store")}>
                <ShoppingCart size={18} />
                <span>Store</span>
              </button>
              <button className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${activeTab === "library" ? "bg-wca-purple text-white" : ""}`} onClick={() => setActiveTab("library")}>
                <Book size={18} />
                <span>Library</span>
              </button>
            </div>
            
            <div className="relative flex-1 max-w-md">
              <div className="relative">
                <input type="text" placeholder="Search items..." className="pl-10 pr-4 py-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-wca-purple border-2 border-wca-purple/30 focus:border-wca-purple" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <main className="flex-grow pt-32 pb-16 py-[75px]">
        <section className="bg-gradient-to-b from-gray-100 to-white dark:from-gray-900 dark:to-gray-950 py-16">
          <div className="container-custom">
            <Carousel 
              className="w-full max-w-6xl mx-auto" 
              plugins={[Autoplay({ delay: 4000 })]}
            >
              <CarouselContent>
                {activeTab === "store" ? (
                  <>
                    <CarouselItem>
                      <div className="relative flex flex-col items-center text-center p-8 h-96 bg-cover bg-center bg-no-repeat rounded-lg overflow-hidden" 
                           style={{backgroundImage: "url('https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&auto=format&fit=crop&q=80')"}}>
                        <div className="absolute inset-0 bg-black/40"></div>
                        <div className="relative z-10 flex flex-col items-center justify-center h-full">
                          <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            <span className="text-white">
                              WCA Store
                            </span>
                          </h1>
                          <p className="text-lg text-white/90 max-w-2xl">
                            Browse our collection of books, courses, and merchandise to support your spiritual journey.
                          </p>
                        </div>
                      </div>
                    </CarouselItem>
                    <CarouselItem>
                      <div className="relative flex flex-col items-center text-center p-8 h-96 bg-cover bg-center bg-no-repeat rounded-lg overflow-hidden" 
                           style={{backgroundImage: "url('https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=1200&auto=format&fit=crop&q=80')"}}>
                        <div className="absolute inset-0 bg-black/40"></div>
                        <div className="relative z-10 flex flex-col items-center justify-center h-full">
                          <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            <span className="text-white">
                              Featured Collection
                            </span>
                          </h1>
                          <p className="text-lg text-white/90 max-w-2xl">
                            Discover our bestselling books and courses handpicked by spiritual leaders.
                          </p>
                        </div>
                      </div>
                    </CarouselItem>
                    <CarouselItem>
                      <div className="relative flex flex-col items-center text-center p-8 h-96 bg-cover bg-center bg-no-repeat rounded-lg overflow-hidden" 
                           style={{backgroundImage: "url('https://images.unsplash.com/photo-1621351183012-e2110f0dd754?w=1200&auto=format&fit=crop&q=80')"}}>
                        <div className="absolute inset-0 bg-black/40"></div>
                        <div className="relative z-10 flex flex-col items-center justify-center h-full">
                          <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            <span className="text-white">
                              New Arrivals
                            </span>
                          </h1>
                          <p className="text-lg text-white/90 max-w-2xl">
                            Check out the latest additions to our spiritual growth resources.
                          </p>
                        </div>
                      </div>
                    </CarouselItem>
                  </>
                ) : (
                  <>
                    <CarouselItem>
                      <div className="relative flex flex-col items-center text-center p-8 h-96 bg-cover bg-center bg-no-repeat rounded-lg overflow-hidden" 
                           style={{backgroundImage: "url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&auto=format&fit=crop&q=80')"}}>
                        <div className="absolute inset-0 bg-black/40"></div>
                        <div className="relative z-10 flex flex-col items-center justify-center h-full">
                          <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            <span className="text-white">
                              WCA Library
                            </span>
                          </h1>
                          <p className="text-lg text-white/90 max-w-2xl">
                            Borrow resources from our extensive library to enrich your knowledge and growth.
                          </p>
                        </div>
                      </div>
                    </CarouselItem>
                    <CarouselItem>
                      <div className="relative flex flex-col items-center text-center p-8 h-96 bg-cover bg-center bg-no-repeat rounded-lg overflow-hidden" 
                           style={{backgroundImage: "url('https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&auto=format&fit=crop&q=80')"}}>
                        <div className="absolute inset-0 bg-black/40"></div>
                        <div className="relative z-10 flex flex-col items-center justify-center h-full">
                          <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            <span className="text-white">
                              Digital Resources
                            </span>
                          </h1>
                          <p className="text-lg text-white/90 max-w-2xl">
                            Access our digital collection of books, courses, and audio content.
                          </p>
                        </div>
                      </div>
                    </CarouselItem>
                    <CarouselItem>
                      <div className="relative flex flex-col items-center text-center p-8 h-96 bg-cover bg-center bg-no-repeat rounded-lg overflow-hidden" 
                           style={{backgroundImage: "url('https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&auto=format&fit=crop&q=80')"}}>
                        <div className="absolute inset-0 bg-black/40"></div>
                        <div className="relative z-10 flex flex-col items-center justify-center h-full">
                          <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            <span className="text-white">
                              Research Hub
                            </span>
                          </h1>
                          <p className="text-lg text-white/90 max-w-2xl">
                            Dive deep into our academic and research materials for advanced study.
                          </p>
                        </div>
                      </div>
                    </CarouselItem>
                  </>
                )}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </section>

        <section className="py-12">
          <div className="container-custom">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="lg:w-1/4">
                <GlassPanel className="p-6 sticky top-40">
                  <div className="mb-6">
                    <h3 className="font-medium text-lg flex items-center gap-2 mb-4">
                      <Filter size={18} />
                      <span>Filters</span>
                    </h3>
                    
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Categories</h4>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <input type="radio" id="all-categories" name="category" checked={selectedCategory === null} onChange={() => setSelectedCategory(null)} className="mr-2" />
                          <label htmlFor="all-categories">All Categories</label>
                        </div>
                        {categories.map(category => <div key={category} className="flex items-center">
                            <input type="radio" id={`category-${category}`} name="category" checked={selectedCategory === category} onChange={() => setSelectedCategory(category)} className="mr-2" />
                            <label htmlFor={`category-${category}`}>{category}</label>
                          </div>)}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Type</h4>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <input type="radio" id="all-types" name="type" checked={selectedType === null} onChange={() => setSelectedType(null)} className="mr-2" />
                          <label htmlFor="all-types">All Types</label>
                        </div>
                        {types.map(type => <div key={type} className="flex items-center">
                            <input type="radio" id={`type-${type}`} name="type" checked={selectedType === type} onChange={() => setSelectedType(type)} className="mr-2" />
                            <label htmlFor={`type-${type}`}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </label>
                          </div>)}
                      </div>
                    </div>
                  </div>

                  {activeTab === "store" && <div>
                      <h3 className="font-medium text-lg flex items-center gap-2 mb-4">
                        <ShoppingCart size={18} />
                        <span>Cart ({totalItems} items)</span>
                      </h3>
                      
                      {cartItems.length === 0 ? <p className="text-gray-500 dark:text-gray-400 text-sm">Your cart is empty</p> : <div>
                          <div className="space-y-3 mb-4">
                            {cartItems.map(item => {
                        const storeItem = storeItems.find(i => i.id === item.id);
                        return storeItem ? <div key={item.id} className="flex justify-between items-center">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium truncate">{storeItem.title}</p>
                                    <p className="text-xs text-gray-500">${storeItem.price.toFixed(2)} × {item.quantity}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => removeFromCart(item.id)}>
                                      <Minus size={12} />
                                    </Button>
                                    <span className="text-sm w-4 text-center">{item.quantity}</span>
                                    <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => addToCart(item.id)}>
                                      <Plus size={12} />
                                    </Button>
                                  </div>
                                </div> : null;
                      })}
                          </div>
                          
                          <div className="border-t pt-3 mb-4">
                            <div className="flex justify-between items-center font-medium">
                              <span>Total:</span>
                              <span>${totalPrice.toFixed(2)}</span>
                            </div>
                          </div>
                          
                          <Button className="w-full bg-wca-teal hover:bg-wca-teal/90">
                            Checkout
                          </Button>
                        </div>}
                    </div>}
                </GlassPanel>
              </div>
              
              <div className="lg:w-3/4">
                <GlassPanel className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map(item => <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-all duration-300">
                        <div className="relative">
                          <img src={item.imageUrl} alt={item.title} className="w-full h-48 object-cover" />
                          {item.bestseller && <div className="absolute top-3 left-3 bg-wca-teal text-white px-2 py-1 rounded text-xs">
                              Bestseller
                            </div>}
                          <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                            <Star size={12} className="fill-yellow-400 text-yellow-400" />
                            {item.rating}
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <div className="mb-3">
                            <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded">
                              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                            </span>
                            <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded ml-1">
                              {item.category}
                            </span>
                          </div>
                          <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{item.author}</p>
                          
                          <div className="flex items-center justify-between mt-4">
                            <span className="font-bold text-lg">${item.price.toFixed(2)}</span>
                            
                            {activeTab === "store" ? getItemQuantity(item.id) > 0 ? <div className="flex items-center gap-2">
                                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => removeFromCart(item.id)}>
                                    <Minus size={14} />
                                  </Button>
                                  <span className="text-sm min-w-8 text-center">{getItemQuantity(item.id)}</span>
                                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => addToCart(item.id)}>
                                    <Plus size={14} />
                                  </Button>
                                </div> : <Button size="sm" onClick={() => addToCart(item.id)} className="bg-wca-purple hover:bg-wca-purple/90">
                                  <ShoppingCart size={14} className="mr-1" />
                                  Add to Cart
                                </Button> : <Button size="sm" className="bg-wca-teal hover:bg-wca-teal/90">
                                <Book size={14} className="mr-1" />
                                Borrow
                              </Button>}
                          </div>
                        </CardContent>
                      </Card>)}
                  </div>

                  {filteredItems.length === 0 && <div className="text-center py-12">
                      <p className="text-lg text-gray-500 dark:text-gray-400">No items found matching your criteria.</p>
                    </div>}
                </GlassPanel>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>;
};
export default Store;