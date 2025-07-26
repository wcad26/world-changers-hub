
import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { GlassPanel, GlassCard } from "@/components/ui/GlassPanels";
import { Newspaper, MessageCircle, Calendar, Clock, User, ChevronRight, Tag, Search, ChevronDown, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandList, CommandGroup, CommandItem } from "@/components/ui/command";

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  readTime: string;
  category: string;
  tags: string[];
  imageUrl: string;
  comments: number;
  featured: boolean;
  type: "news" | "testimony" | "article";
}

const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: "WCA Expands With Three New Centers",
    excerpt: "World Changers Association announces the opening of three new centers in major cities to further its mission.",
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit...",
    author: "Admin Team",
    date: "June 15, 2023",
    readTime: "5 min",
    category: "News",
    tags: ["Expansion", "Growth", "Centers"],
    imageUrl: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    comments: 12,
    featured: true,
    type: "news"
  },
  {
    id: 2,
    title: "How WCA Changed My Life: A Personal Journey",
    excerpt: "John Smith shares his powerful testimony of transformation after joining the World Changers Association.",
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit...",
    author: "John Smith",
    date: "July 2, 2023",
    readTime: "8 min",
    category: "Testimonials",
    tags: ["Testimony", "Transformation", "Personal"],
    imageUrl: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    comments: 24,
    featured: false,
    type: "testimony"
  },
  {
    id: 3,
    title: "5 Ways to Strengthen Your Spiritual Leadership",
    excerpt: "Discover practical steps to grow as a spiritual leader in your community and beyond.",
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit...",
    author: "Pastor James Wilson",
    date: "August 10, 2023",
    readTime: "10 min",
    category: "Leadership",
    tags: ["Leadership", "Growth", "Spiritual"],
    imageUrl: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    comments: 18,
    featured: true,
    type: "article"
  },
  {
    id: 4,
    title: "Annual Leadership Conference Sees Record Attendance",
    excerpt: "This year's WCA Leadership Conference brought together over 5,000 attendees from around the world.",
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit...",
    author: "Events Team",
    date: "September 5, 2023",
    readTime: "6 min",
    category: "Events",
    tags: ["Conference", "Leadership", "Events"],
    imageUrl: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    comments: 9,
    featured: false,
    type: "news"
  },
  {
    id: 5,
    title: "Finding Hope in Difficult Times: A Testimony",
    excerpt: "Sarah Johnson shares her emotional journey of finding hope through WCA during a challenging season of life.",
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit...",
    author: "Sarah Johnson",
    date: "October 12, 2023",
    readTime: "7 min",
    category: "Testimonials",
    tags: ["Hope", "Testimony", "Healing"],
    imageUrl: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    comments: 31,
    featured: true,
    type: "testimony"
  },
  {
    id: 6,
    title: "Building Communities of Impact: A Practical Guide",
    excerpt: "Learn how to create and nurture communities that bring positive change to society.",
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit...",
    author: "Dr. Michael Davis",
    date: "November 8, 2023",
    readTime: "12 min",
    category: "Community",
    tags: ["Community", "Impact", "Guide"],
    imageUrl: "https://images.unsplash.com/photo-1536865431523-5ff9a23008a1?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    comments: 15,
    featured: false,
    type: "article"
  },
  {
    id: 7,
    title: "WCA Launches New Youth Development Program",
    excerpt: "The new initiative aims to equip young people with leadership skills and spiritual foundations.",
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit...",
    author: "Youth Ministry Team",
    date: "December 3, 2023",
    readTime: "5 min",
    category: "Youth",
    tags: ["Youth", "Development", "Program"],
    imageUrl: "https://images.unsplash.com/photo-1511988617509-a57c8a288659?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    comments: 7,
    featured: false,
    type: "news"
  },
  {
    id: 8,
    title: "Applying Biblical Principles in Business Leadership",
    excerpt: "Discover how biblical wisdom can transform your approach to business and leadership.",
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit...",
    author: "Robert Lee",
    date: "January 20, 2024",
    readTime: "9 min",
    category: "Business",
    tags: ["Business", "Leadership", "Bible"],
    imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    comments: 22,
    featured: true,
    type: "article"
  }
];

const Blog = () => {
  const [activeTab, setActiveTab] = useState<"all" | "news" | "testimonies" | "articles">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const filteredPosts = blogPosts.filter(post => {
    // Filter by tab
    if (activeTab === "news" && post.type !== "news") return false;
    if (activeTab === "testimonies" && post.type !== "testimony") return false;
    if (activeTab === "articles" && post.type !== "article") return false;
    
    // Filter by search
    if (searchQuery && !post.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Filter by tag
    if (selectedTag && !post.tags.includes(selectedTag)) return false;
    
    return true;
  });

  const featuredPosts = filteredPosts.filter(post => post.featured);
  const regularPosts = filteredPosts.filter(post => !post.featured);

  // Get all unique tags
  const allTags = Array.from(new Set(blogPosts.flatMap(post => post.tags)));

  const getTabDisplayName = (tab: typeof activeTab) => {
    switch (tab) {
      case "all": return "All";
      case "news": return "News";
      case "testimonies": return "Testimonies";
      case "articles": return "Articles";
      default: return "All";
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <main className="flex-grow pt-0 pb-0">
        <section className="bg-gradient-to-b from-gray-100 to-white dark:from-gray-900 dark:to-gray-950 py-16">
          <div className="container-custom">
            <div className="flex flex-col items-center text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="text-gradient bg-gradient-to-r from-wca-purple to-wca-violet bg-clip-text text-transparent">
                  News & Blog
                </span>
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
                Stay updated with the latest news, testimonies, and articles from the World Changers Association.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container-custom">
            <div className="flex flex-col gap-6 mb-12">
              <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
                {/* Mobile Dropdown */}
                <div className="md:hidden w-full">
                  <Popover open={dropdownOpen} onOpenChange={setDropdownOpen}>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        role="combobox" 
                        aria-expanded={dropdownOpen} 
                        className="w-full justify-between h-12 px-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex items-center gap-2">
                          <Newspaper size={18} className="text-gray-400 dark:text-gray-500" />
                          <span className="text-gray-700 dark:text-gray-200">
                            {getTabDisplayName(activeTab)}
                          </span>
                        </div>
                        <ChevronDown 
                          size={16} 
                          className="text-gray-400 dark:text-gray-500 transition-transform duration-200" 
                          style={{
                            transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                          }} 
                        />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-xl rounded-xl z-50">
                      <Command>
                        <CommandList>
                          <CommandGroup>
                            <CommandItem 
                              value="all" 
                              onSelect={() => {
                                setActiveTab("all");
                                setDropdownOpen(false);
                              }} 
                              className="flex items-center justify-between px-3 py-3 hover:bg-wca-purple group transition-colors duration-200 rounded-lg mx-1"
                            >
                              <div className="flex items-center gap-2">
                                <Newspaper size={16} className="text-gray-400 group-hover:text-white" />
                                <span className="text-sm font-medium group-hover:text-white">All</span>
                              </div>
                              {activeTab === "all" && <Check size={14} className="text-wca-purple group-hover:text-white" />}
                            </CommandItem>
                            <CommandItem 
                              value="news" 
                              onSelect={() => {
                                setActiveTab("news");
                                setDropdownOpen(false);
                              }} 
                              className="flex items-center justify-between px-3 py-3 hover:bg-wca-purple group transition-colors duration-200 rounded-lg mx-1"
                            >
                              <div className="flex items-center gap-2">
                                <Newspaper size={16} className="text-gray-400 group-hover:text-white" />
                                <span className="text-sm font-medium group-hover:text-white">News</span>
                              </div>
                              {activeTab === "news" && <Check size={14} className="text-wca-purple group-hover:text-white" />}
                            </CommandItem>
                            <CommandItem 
                              value="testimonies" 
                              onSelect={() => {
                                setActiveTab("testimonies");
                                setDropdownOpen(false);
                              }} 
                              className="flex items-center justify-between px-3 py-3 hover:bg-wca-purple group transition-colors duration-200 rounded-lg mx-1"
                            >
                              <div className="flex items-center gap-2">
                                <MessageCircle size={16} className="text-gray-400 group-hover:text-white" />
                                <span className="text-sm font-medium group-hover:text-white">Testimonies</span>
                              </div>
                              {activeTab === "testimonies" && <Check size={14} className="text-wca-purple group-hover:text-white" />}
                            </CommandItem>
                            <CommandItem 
                              value="articles" 
                              onSelect={() => {
                                setActiveTab("articles");
                                setDropdownOpen(false);
                              }} 
                              className="flex items-center justify-between px-3 py-3 hover:bg-wca-purple group transition-colors duration-200 rounded-lg mx-1"
                            >
                              <div className="flex items-center gap-2">
                                <Newspaper size={16} className="text-gray-400 group-hover:text-white" />
                                <span className="text-sm font-medium group-hover:text-white">Articles</span>
                              </div>
                              {activeTab === "articles" && <Check size={14} className="text-wca-purple group-hover:text-white" />}
                            </CommandItem>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Desktop Buttons */}
                <div className="hidden md:flex items-center gap-3 w-auto">
                  <button 
                    className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${activeTab === "all" ? "bg-wca-purple text-white" : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                    onClick={() => setActiveTab("all")}
                  >
                    <Newspaper size={18} />
                    <span>All</span>
                  </button>
                  <button 
                    className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${activeTab === "news" ? "bg-wca-purple text-white" : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                    onClick={() => setActiveTab("news")}
                  >
                    <Newspaper size={18} />
                    <span>News</span>
                  </button>
                  <button 
                    className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${activeTab === "testimonies" ? "bg-wca-purple text-white" : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                    onClick={() => setActiveTab("testimonies")}
                  >
                    <MessageCircle size={18} />
                    <span>Testimonies</span>
                  </button>
                  <button 
                    className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${activeTab === "articles" ? "bg-wca-purple text-white" : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                    onClick={() => setActiveTab("articles")}
                  >
                    <Newspaper size={18} />
                    <span>Articles</span>
                  </button>
                </div>

                {/* Search Bar - Desktop only */}
                <div className="hidden lg:block w-auto relative">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Search posts..." 
                      className="pl-10 pr-4 py-2 w-64 bg-gray-100 dark:bg-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-wca-purple"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Search Bar - Mobile and Tablet */}
              <div className="lg:hidden w-full relative">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search posts..." 
                    className="pl-10 pr-4 py-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-wca-purple"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                </div>
              </div>
            </div>

            {featuredPosts.length > 0 && (
              <div className="mb-16">
                <h2 className="text-2xl font-bold mb-6">Featured Posts</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {featuredPosts.slice(0, 2).map(post => (
                    <GlassCard key={post.id} className="overflow-hidden">
                      <div className="relative h-64">
                        <img 
                          src={post.imageUrl} 
                          alt={post.title} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-6">
                          <span className="inline-block px-3 py-1 bg-wca-purple text-white text-xs rounded-full mb-3">
                            {post.type === "news" ? "News" : post.type === "testimony" ? "Testimony" : "Article"}
                          </span>
                          <h3 className="text-xl font-bold text-white mb-2">{post.title}</h3>
                          <div className="flex items-center text-gray-300 text-xs">
                            <span className="flex items-center gap-1 mr-4">
                              <User size={12} />
                              {post.author}
                            </span>
                            <span className="flex items-center gap-1 mr-4">
                              <Calendar size={12} />
                              {post.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {post.readTime}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="p-6">
                        <p className="text-gray-600 dark:text-gray-300 mb-4">{post.excerpt}</p>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                            <MessageCircle size={16} />
                            <span>{post.comments} Comments</span>
                          </div>
                          <Link to={`/blog/${post.id}`} className="flex items-center gap-1 text-wca-purple hover:underline">
                            <span>Read More</span>
                            <ChevronRight size={16} />
                          </Link>
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-8">
              <div className="md:w-2/3">
                <h2 className="text-2xl font-bold mb-6">Recent Posts</h2>
                <div className="space-y-8">
                  {regularPosts.map(post => (
                    <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-all duration-300">
                      <div className="md:flex">
                        <div className="md:w-1/3">
                          <img 
                            src={post.imageUrl} 
                            alt={post.title} 
                            className="w-full h-48 md:h-full object-cover"
                          />
                        </div>
                        <CardContent className="p-6 md:w-2/3">
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                              {post.type === "news" ? "News" : post.type === "testimony" ? "Testimony" : "Article"}
                            </span>
                            <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                              {post.category}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold mb-2">{post.title}</h3>
                          <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs mb-4">
                            <span className="flex items-center gap-1 mr-4">
                              <User size={12} />
                              {post.author}
                            </span>
                            <span className="flex items-center gap-1 mr-4">
                              <Calendar size={12} />
                              {post.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {post.readTime}
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 mb-4">{post.excerpt}</p>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                              <MessageCircle size={16} />
                              <span>{post.comments} Comments</span>
                            </div>
                            <Link to={`/blog/${post.id}`} className="flex items-center gap-1 text-wca-purple hover:underline">
                              <span>Read More</span>
                              <ChevronRight size={16} />
                            </Link>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  ))}
                </div>

                {regularPosts.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-lg text-gray-500 dark:text-gray-400">No posts found matching your criteria.</p>
                  </div>
                )}
              </div>
              
              <div className="md:w-1/3">
                <GlassPanel className="p-6 sticky top-24">
                  <div className="mb-8">
                    <h3 className="text-xl font-bold mb-4">Popular Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      <button 
                        className={`px-3 py-1 text-sm rounded-full transition-all ${selectedTag === null ? "bg-wca-purple text-white" : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                        onClick={() => setSelectedTag(null)}
                      >
                        All Tags
                      </button>
                      {allTags.map(tag => (
                        <button 
                          key={tag}
                          className={`flex items-center gap-1 px-3 py-1 text-sm rounded-full transition-all ${selectedTag === tag ? "bg-wca-purple text-white" : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                          onClick={() => setSelectedTag(tag)}
                        >
                          <Tag size={14} />
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold mb-4">Categories</h3>
                    <div className="space-y-2">
                      {Array.from(new Set(blogPosts.map(post => post.category))).map(category => (
                        <div key={category} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800">
                          <span>{category}</span>
                          <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
                            {blogPosts.filter(post => post.category === category).length}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </GlassPanel>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Blog;
