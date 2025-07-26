import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { GlassPanel } from "@/components/ui/GlassPanels";
import { Video, Mic, PlayCircle, Calendar, Clock, Search, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
interface MediaItem {
  id: number;
  title: string;
  speaker: string;
  thumbnailUrl: string;
  date: string;
  duration: string;
  type: "sermon" | "event";
  category: string;
}
const dummyMediaItems: MediaItem[] = [{
  id: 1,
  title: "Building Spiritual Foundations",
  speaker: "Pastor James Wilson",
  thumbnailUrl: "https://images.unsplash.com/photo-1493804714600-6edb1cd93080?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  date: "May 15, 2023",
  duration: "45 min",
  type: "sermon",
  category: "Spiritual Growth"
}, {
  id: 2,
  title: "Leadership Conference 2023",
  speaker: "Various Speakers",
  thumbnailUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  date: "June 10, 2023",
  duration: "2 hr 30 min",
  type: "event",
  category: "Conference"
}, {
  id: 3,
  title: "Transforming Your Community",
  speaker: "Dr. Sarah Johnson",
  thumbnailUrl: "https://images.unsplash.com/photo-1470115636492-6d2b56f9146d?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  date: "July 22, 2023",
  duration: "55 min",
  type: "sermon",
  category: "Community Impact"
}, {
  id: 4,
  title: "Youth Revival Night",
  speaker: "Pastor Michael Davis",
  thumbnailUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  date: "August 5, 2023",
  duration: "1 hr 15 min",
  type: "event",
  category: "Youth"
}, {
  id: 5,
  title: "Faith in Action",
  speaker: "Pastor James Wilson",
  thumbnailUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  date: "September 12, 2023",
  duration: "50 min",
  type: "sermon",
  category: "Faith"
}, {
  id: 6,
  title: "Women's Conference",
  speaker: "Various Speakers",
  thumbnailUrl: "https://images.unsplash.com/photo-1573164713712-03790a178651?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  date: "October 20, 2023",
  duration: "3 hr",
  type: "event",
  category: "Women"
}];
const Media = () => {
  const [activeTab, setActiveTab] = useState<"all" | "sermons" | "events">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const isMobile = useIsMobile();
  const filteredItems = dummyMediaItems.filter(item => {
    // Filter by tab
    if (activeTab === "sermons" && item.type !== "sermon") return false;
    if (activeTab === "events" && item.type !== "event") return false;

    // Filter by search
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase()) && !item.speaker.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Filter by category
    if (selectedCategory && item.category !== selectedCategory) return false;
    return true;
  });
  const categories = Array.from(new Set(dummyMediaItems.map(item => item.category)));
  const FilterContent = () => <div className="space-y-4">
      
      <div className="flex flex-wrap gap-2">
        <button className={`px-3 py-1 text-sm rounded-full transition-all ${selectedCategory === null ? "bg-wca-purple text-white" : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"}`} onClick={() => {
        setSelectedCategory(null);
        if (isMobile) setFilterDialogOpen(false);
      }}>
          All Categories
        </button>
        {categories.map(category => <button key={category} className={`px-3 py-1 text-sm rounded-full transition-all ${selectedCategory === category ? "bg-wca-purple text-white" : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"}`} onClick={() => {
        setSelectedCategory(category);
        if (isMobile) setFilterDialogOpen(false);
      }}>
            {category}
          </button>)}
      </div>
    </div>;
  return <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <main className="flex-grow pt-0 pb-16">
        <section className="bg-gradient-to-b from-gray-100 to-white dark:from-gray-900 dark:to-gray-950 py-10 md:py-16">
          <div className="container px-4 mx-auto">
            <div className="flex flex-col items-center text-center mb-8 md:mb-12">
              <h1 className="text-3xl md:text-5xl font-bold mb-4">
                <span className="text-gradient bg-gradient-to-r from-wca-purple to-wca-violet bg-clip-text text-transparent">
                  Media & Sermons
                </span>
              </h1>
              <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
                Access our library of sermons, event recordings, and teachings to grow in your spiritual journey.
              </p>
            </div>
          </div>
        </section>

        <section className="py-8 md:py-12">
          <div className="container px-4 mx-auto">
            <GlassPanel className="p-4 md:p-8 mb-8 md:mb-12">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 mb-6">
                <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full md:w-auto">
                  <button className={`flex items-center gap-1 px-3 py-1.5 md:px-4 md:py-2 text-sm rounded-full transition-all ${activeTab === "all" ? "bg-wca-purple text-white" : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"}`} onClick={() => setActiveTab("all")}>
                    <PlayCircle size={16} />
                    <span>All</span>
                  </button>
                  <button className={`flex items-center gap-1 px-3 py-1.5 md:px-4 md:py-2 text-sm rounded-full transition-all ${activeTab === "sermons" ? "bg-wca-purple text-white" : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"}`} onClick={() => setActiveTab("sermons")}>
                    <Mic size={16} />
                    <span>Sermons</span>
                  </button>
                  <button className={`flex items-center gap-1 px-3 py-1.5 md:px-4 md:py-2 text-sm rounded-full transition-all ${activeTab === "events" ? "bg-wca-purple text-white" : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"}`} onClick={() => setActiveTab("events")}>
                    <Video size={16} />
                    <span>Events</span>
                  </button>
                </div>
                
                <div className="flex flex-col gap-4 w-full md:w-auto">
                  <div className="relative flex-1">
                    <input type="text" placeholder="Search..." className="pl-9 pr-4 py-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-wca-purple" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                  </div>
                  
                  {isMobile ? <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="flex-shrink-0 flex items-center gap-2">
                          <Filter size={18} />
                          <span>Category</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-72 p-4">
                        <FilterContent />
                      </DropdownMenuContent>
                    </DropdownMenu> : <div className="ml-4 hidden md:block">
                       <FilterContent />
                     </div>}
                </div>
              </div>

              {!isMobile && <div className="mb-8 flex flex-wrap gap-2 md:hidden">
                  <FilterContent />
                </div>}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filteredItems.map(item => <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-all duration-300">
                    <div className="relative">
                      <img src={item.thumbnailUrl} alt={item.title} className="w-full h-40 md:h-48 object-cover" />
                      <div className="absolute top-2 right-2 bg-black/70 text-white px-1.5 py-0.5 rounded text-xs">
                        {item.duration}
                      </div>
                      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-3">
                        <span className="inline-block px-2 py-0.5 bg-wca-purple text-white text-xs rounded mb-1">
                          {item.type === "sermon" ? "Sermon" : "Event"}
                        </span>
                      </div>
                    </div>
                    <CardContent className="p-3 md:p-4">
                      <h3 className="font-bold text-base md:text-lg mb-1 line-clamp-2">{item.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{item.speaker}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {item.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {item.duration}
                        </span>
                      </div>
                    </CardContent>
                  </Card>)}
              </div>

              {filteredItems.length === 0 && <div className="text-center py-8 md:py-12">
                  <p className="text-lg text-gray-500 dark:text-gray-400">No media items found matching your criteria.</p>
                </div>}
            </GlassPanel>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>;
};
export default Media;