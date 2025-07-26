import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { GlassPanel, GlassCard } from "@/components/ui/GlassPanels";
import { PiggyBank, Calendar, Users, Target, DollarSign, Search, Filter, Heart, CheckCircle, ArrowRight, AlertCircle, Clock, CreditCard, HandCoins, Info, ChevronDown, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
interface Project {
  id: number;
  title: string;
  description: string;
  shortDescription: string;
  imageUrl: string;
  goalAmount: number;
  raisedAmount: number;
  startDate: string;
  endDate: string;
  category: string;
  location: string;
  status: "active" | "completed" | "upcoming";
  supporters: number;
  updates: {
    date: string;
    title: string;
    content: string;
  }[];
  featured: boolean;
}
const projects: Project[] = [{
  id: 1,
  title: "New Youth Center Construction",
  description: "We're building a state-of-the-art youth center to provide a safe space for young people in our community to learn, grow, and develop their leadership potential. The center will include classrooms, a recreation area, a multimedia lab, and counseling rooms.",
  shortDescription: "Building a state-of-the-art youth center to empower the next generation of leaders.",
  imageUrl: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  goalAmount: 250000,
  raisedAmount: 175000,
  startDate: "January 15, 2023",
  endDate: "December 31, 2023",
  category: "Building Project",
  location: "Main Campus",
  status: "active",
  supporters: 342,
  updates: [{
    date: "October 10, 2023",
    title: "Foundation Completed",
    content: "We're excited to announce that the foundation for the new youth center has been completed ahead of schedule!"
  }, {
    date: "August 5, 2023",
    title: "Building Permits Approved",
    content: "After months of planning, all building permits have been approved and construction will begin next week."
  }],
  featured: true
}, {
  id: 2,
  title: "Community Outreach Program",
  description: "Our community outreach program aims to provide essential services to underserved neighborhoods, including food distribution, health screenings, educational resources, and mentoring programs. This initiative will help us extend our impact beyond our walls.",
  shortDescription: "Providing essential services to underserved neighborhoods through comprehensive outreach programs.",
  imageUrl: "https://images.unsplash.com/photo-1593113598332-cd59a93f9dd4?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  goalAmount: 75000,
  raisedAmount: 45000,
  startDate: "March 1, 2023",
  endDate: "February 28, 2024",
  category: "Community Service",
  location: "Multiple Locations",
  status: "active",
  supporters: 189,
  updates: [{
    date: "September 15, 2023",
    title: "New Outreach Location Added",
    content: "We've expanded our outreach program to include the Riverside district, bringing our total service areas to 5."
  }],
  featured: false
}, {
  id: 3,
  title: "Leadership Training Scholarships",
  description: "We're raising funds to provide scholarships for promising leaders who cannot afford to attend our advanced leadership training programs. These scholarships will cover tuition, materials, and in some cases, travel expenses for participants.",
  shortDescription: "Providing scholarships for promising leaders to attend our advanced leadership training programs.",
  imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  goalAmount: 50000,
  raisedAmount: 32500,
  startDate: "April 1, 2023",
  endDate: "March 31, 2024",
  category: "Education",
  location: "Online & Main Campus",
  status: "active",
  supporters: 215,
  updates: [{
    date: "July 20, 2023",
    title: "First Scholarship Recipients Selected",
    content: "We're pleased to announce the first 10 scholarship recipients who will begin their leadership training next month."
  }],
  featured: true
}, {
  id: 4,
  title: "New Worship Equipment",
  description: "We're upgrading our sound, lighting, and multimedia equipment to enhance the worship experience for our congregation and enable us to produce high-quality recordings of services and events for those unable to attend in person.",
  shortDescription: "Upgrading our worship technology to enhance the worship experience and expand our digital reach.",
  imageUrl: "https://images.unsplash.com/photo-1470019693664-1d202d2c0907?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  goalAmount: 85000,
  raisedAmount: 85000,
  startDate: "February 15, 2023",
  endDate: "June 30, 2023",
  category: "Equipment",
  location: "Main Campus",
  status: "completed",
  supporters: 278,
  updates: [{
    date: "June 25, 2023",
    title: "Goal Reached!",
    content: "Thanks to your generous support, we've reached our fundraising goal and have ordered all the new equipment!"
  }, {
    date: "May 10, 2023",
    title: "80% Milestone Reached",
    content: "We're 80% of the way to our goal and have begun ordering some of the critical components."
  }],
  featured: false
}, {
  id: 5,
  title: "Global Missions Support",
  description: "This fund supports our missionary partners around the world who are working in education, healthcare, church planting, and community development. Your contributions will help provide them with living expenses, project funding, and emergency assistance.",
  shortDescription: "Supporting our missionary partners around the world in their vital work in education, healthcare, and community development.",
  imageUrl: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  goalAmount: 120000,
  raisedAmount: 68000,
  startDate: "January 1, 2023",
  endDate: "December 31, 2023",
  category: "Missions",
  location: "Global",
  status: "active",
  supporters: 304,
  updates: [{
    date: "August 30, 2023",
    title: "New Medical Clinic Opens",
    content: "Our partners in Kenya have opened a new medical clinic that will serve thousands of patients annually, thanks to your support."
  }],
  featured: true
}, {
  id: 6,
  title: "Children's Ministry Expansion",
  description: "We're expanding our children's ministry spaces and programs to accommodate our growing number of families and enhance the learning experience for children of all ages. This includes new classrooms, interactive learning tools, and play areas.",
  shortDescription: "Expanding our children's ministry spaces and programs to better serve our growing number of families.",
  imageUrl: "https://images.unsplash.com/photo-1560541919-eb5c2da6a5a3?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  goalAmount: 95000,
  raisedAmount: 25000,
  startDate: "November 1, 2023",
  endDate: "October 31, 2024",
  category: "Building Project",
  location: "Main Campus",
  status: "active",
  supporters: 127,
  updates: [{
    date: "November 15, 2023",
    title: "Project Kickoff",
    content: "We've officially launched our children's ministry expansion project with a special ceremony during Sunday service."
  }],
  featured: false
}, {
  id: 7,
  title: "Digital Media Initiative",
  description: "This project will fund the creation of a digital media team and studio to produce high-quality videos, podcasts, and other digital content that shares our message with a broader audience and engages people where they are—online.",
  shortDescription: "Creating a digital media team and studio to expand our reach through high-quality online content.",
  imageUrl: "https://images.unsplash.com/photo-1533228876829-65c94e7b5025?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  goalAmount: 65000,
  raisedAmount: 0,
  startDate: "January 15, 2024",
  endDate: "December 31, 2024",
  category: "Technology",
  location: "Main Campus",
  status: "upcoming",
  supporters: 0,
  updates: [],
  featured: false
}, {
  id: 8,
  title: "Disaster Relief Fund",
  description: "This ongoing fund allows us to respond quickly to natural disasters and other emergencies both locally and globally. Your contributions ensure we can provide immediate assistance when crises occur, including food, shelter, medical aid, and long-term recovery support.",
  shortDescription: "Providing immediate and long-term assistance to those affected by natural disasters and other emergencies.",
  imageUrl: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  goalAmount: 100000,
  raisedAmount: 78500,
  startDate: "January 1, 2023",
  endDate: "Ongoing",
  category: "Emergency Relief",
  location: "Global",
  status: "active",
  supporters: 412,
  updates: [{
    date: "September 5, 2023",
    title: "Hurricane Relief Efforts",
    content: "We've deployed a team to assist with hurricane recovery efforts in coastal communities, providing meals, supplies, and cleanup assistance."
  }, {
    date: "June 12, 2023",
    title: "Flood Response",
    content: "Thanks to this fund, we were able to provide immediate assistance to 45 families affected by recent flooding."
  }],
  featured: true
}];
const Fundraising = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<"all" | "active" | "completed" | "upcoming">("all");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [donationAmount, setDonationAmount] = useState<number>(50);
  const [donationStep, setDonationStep] = useState<1 | 2 | 3>(1);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [donorInfo, setDonorInfo] = useState({
    name: "",
    email: "",
    anonymous: false
  });

  // Get all categories
  const categories = Array.from(new Set(projects.map(project => project.category)));

  // Filter projects
  const filteredProjects = projects.filter(project => {
    // Filter by search
    if (searchQuery && !project.title.toLowerCase().includes(searchQuery.toLowerCase()) && !project.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Filter by category
    if (selectedCategory && project.category !== selectedCategory) return false;

    // Filter by status
    if (selectedStatus !== "all" && project.status !== selectedStatus) return false;
    return true;
  });
  const featuredProjects = filteredProjects.filter(project => project.featured);
  const otherProjects = filteredProjects.filter(project => !project.featured);
  const handleDonationAmountClick = (amount: number) => {
    setDonationAmount(amount);
    setCustomAmount("");
  };
  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimals
    if (/^\d*\.?\d{0,2}$/.test(value) || value === "") {
      setCustomAmount(value);
      if (value) {
        setDonationAmount(parseFloat(value));
      } else {
        setDonationAmount(0);
      }
    }
  };
  const handleDonorInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {
      name,
      value,
      type,
      checked
    } = e.target;
    setDonorInfo({
      ...donorInfo,
      [name]: type === "checkbox" ? checked : value
    });
  };
  const handleSubmitDonation = () => {
    // In a real application, this would submit payment details to a payment processor
    console.log({
      project: selectedProject?.title,
      amount: donationAmount,
      donorInfo
    });

    // Reset form
    setDonationStep(1);
    setDonationAmount(50);
    setCustomAmount("");
    setDonorInfo({
      name: "",
      email: "",
      anonymous: false
    });
    setSelectedProject(null);

    // This would be replaced with proper form submission and payment processing
    alert(`Thank you for your donation of $${donationAmount.toFixed(2)} to ${selectedProject?.title}!`);
  };
  return <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <main className="flex-grow pt-0 pb-16">
        <section className="bg-gradient-to-b from-gray-100 to-white dark:from-gray-900 dark:to-gray-950 py-[30px]">
          <div className="container-custom">
            <div className="flex flex-col items-center text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="text-gradient bg-gradient-to-r from-wca-purple to-wca-violet bg-clip-text text-transparent">
                  Fundraising Projects
                </span>
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
                Join us in making a difference through these important initiatives that are transforming lives and communities.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container-custom">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
              <div className="w-full md:w-auto relative">
                <div className="relative">
                  <input type="text" placeholder="Search projects..." className="pl-10 pr-4 py-2 w-full md:w-64 bg-gray-100 dark:bg-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-wca-purple" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                </div>
              </div>
              
              <div className="flex flex-nowrap items-center gap-3 w-full md:w-auto">
                <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={categoryOpen}
                      className="justify-between min-w-[180px] h-12 px-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 text-sm font-medium"
                    >
                      <div className="flex items-center gap-2">
                        <Filter size={16} className="text-gray-400 dark:text-gray-500" />
                        <span className="text-gray-700 dark:text-gray-200">
                          {selectedCategory || "All Categories"}
                        </span>
                      </div>
                      <ChevronDown size={16} className="text-gray-400 dark:text-gray-500 transition-transform duration-200" style={{ transform: categoryOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-xl rounded-xl">
                    <Command>
                      <CommandList>
                        <CommandGroup>
                          <CommandItem
                            value=""
                            onSelect={() => {
                              setSelectedCategory(null);
                              setCategoryOpen(false);
                            }}
                            className="flex items-center justify-between px-3 py-2.5 hover:bg-wca-purple group transition-colors duration-200 rounded-lg mx-1"
                          >
                            <span className="text-sm font-medium group-hover:text-white">All Categories</span>
                            {!selectedCategory && <Check size={14} className="text-wca-purple group-hover:text-white" />}
                          </CommandItem>
                          {categories.map((category) => (
                            <CommandItem
                              key={category}
                              value={category}
                              onSelect={() => {
                                setSelectedCategory(category);
                                setCategoryOpen(false);
                              }}
                              className="flex items-center justify-between px-3 py-2.5 hover:bg-wca-purple hover:text-white transition-colors duration-200 rounded-lg mx-1"
                            >
                              <span className="text-sm font-medium">{category}</span>
                              {selectedCategory === category && <Check size={14} className="text-wca-purple hover:text-white" />}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                
                <Popover open={statusOpen} onOpenChange={setStatusOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={statusOpen}
                      className="justify-between min-w-[150px] h-12 px-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 text-sm font-medium"
                    >
                      <div className="flex items-center gap-2">
                        <Target size={16} className="text-gray-400 dark:text-gray-500" />
                        <span className="text-gray-700 dark:text-gray-200">
                          {selectedStatus === "all" ? "All Projects" : selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}
                        </span>
                      </div>
                      <ChevronDown size={16} className="text-gray-400 dark:text-gray-500 transition-transform duration-200" style={{ transform: statusOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[180px] p-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-xl rounded-xl">
                    <Command>
                      <CommandList>
                        <CommandGroup>
                          {[
                            { value: "all", label: "All Projects" },
                            { value: "active", label: "Active" },
                            { value: "completed", label: "Completed" },
                            { value: "upcoming", label: "Upcoming" }
                          ].map((status) => (
                            <CommandItem
                              key={status.value}
                              value={status.value}
                              onSelect={() => {
                                setSelectedStatus(status.value as "all" | "active" | "completed" | "upcoming");
                                setStatusOpen(false);
                              }}
                              className="flex items-center justify-between px-3 py-2.5 hover:bg-wca-purple group transition-colors duration-200 rounded-lg mx-1"
                            >
                              <span className="text-sm font-medium group-hover:text-white">{status.label}</span>
                              {selectedStatus === status.value && <Check size={14} className="text-wca-purple group-hover:text-white" />}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {featuredProjects.length > 0 && <div className="mb-16">
                <h2 className="text-2xl font-bold mb-6">Featured Projects</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {featuredProjects.slice(0, 2).map(project => <GlassCard key={project.id} className="overflow-hidden hover:shadow-lg transition-all duration-300">
                      <div className="relative h-64">
                        <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover" />
                        <div className="absolute top-4 left-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-white text-xs font-medium ${project.status === "active" ? "bg-green-500" : project.status === "completed" ? "bg-blue-500" : "bg-amber-500"}`}>
                            {project.status === "active" ? "Active" : project.status === "completed" ? "Completed" : "Upcoming"}
                          </span>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-6">
                          <span className="inline-block px-3 py-1 bg-wca-purple text-white text-xs rounded-full mb-3">
                            {project.category}
                          </span>
                          <h3 className="text-xl font-bold text-white mb-2">{project.title}</h3>
                          <div className="flex items-center text-gray-300 text-xs">
                            <span className="flex items-center gap-1 mr-4">
                              <Calendar size={12} />
                              {project.startDate}
                            </span>
                            <span className="flex items-center gap-1 mr-4">
                              <Target size={12} />
                              ${project.goalAmount.toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users size={12} />
                              {project.supporters} Supporters
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span className="font-medium">{Math.round(project.raisedAmount / project.goalAmount * 100)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                            <div className="bg-gradient-to-r from-wca-purple to-wca-violet h-2.5 rounded-full" style={{
                        width: `${Math.min(100, Math.round(project.raisedAmount / project.goalAmount * 100))}%`
                      }}></div>
                          </div>
                          <div className="flex justify-between text-sm mt-1">
                            <span>${project.raisedAmount.toLocaleString()} raised</span>
                            <span>Goal: ${project.goalAmount.toLocaleString()}</span>
                          </div>
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-300 mb-6">{project.shortDescription}</p>
                        
                        <div className="flex gap-3">
                          <Button className="flex-1 bg-wca-purple hover:bg-wca-purple/90" onClick={() => setSelectedProject(project)}>
                            <Heart size={16} className="mr-1" />
                            Donate Now
                          </Button>
                          <Button variant="outline" className="flex-1" onClick={() => setSelectedProject(project)}>
                            View Details
                          </Button>
                        </div>
                      </div>
                    </GlassCard>)}
                </div>
              </div>}

            <h2 className="text-2xl font-bold mb-6">All Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {otherProjects.map(project => <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="relative h-48">
                    <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3">
                      <span className={`inline-block px-2 py-1 rounded-full text-white text-xs ${project.status === "active" ? "bg-green-500" : project.status === "completed" ? "bg-blue-500" : "bg-amber-500"}`}>
                        {project.status === "active" ? "Active" : project.status === "completed" ? "Completed" : "Upcoming"}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded-full mb-2">
                      {project.category}
                    </span>
                    <h3 className="font-bold text-lg mb-2 line-clamp-1">{project.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">{project.shortDescription}</p>
                    
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Progress</span>
                        <span className="font-medium">{Math.round(project.raisedAmount / project.goalAmount * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div className="bg-gradient-to-r from-wca-purple to-wca-violet h-2 rounded-full" style={{
                      width: `${Math.min(100, Math.round(project.raisedAmount / project.goalAmount * 100))}%`
                    }}></div>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span>${project.raisedAmount.toLocaleString()}</span>
                        <span>${project.goalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {project.endDate === "Ongoing" ? "Ongoing" : project.endDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        {project.supporters} Supporters
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 bg-wca-purple hover:bg-wca-purple/90" onClick={() => setSelectedProject(project)} disabled={project.status === "completed" || project.status === "upcoming"}>
                        <Heart size={14} className="mr-1" />
                        Donate
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => setSelectedProject(project)}>
                        Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>)}
            </div>

            {filteredProjects.length === 0 && <div className="text-center py-12">
                <p className="text-lg text-gray-500 dark:text-gray-400">No projects found matching your criteria.</p>
              </div>}
            
            {selectedProject && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
                  {donationStep === 1 && <div className="p-6 md:p-8">
                      <div className="flex justify-between items-start mb-6">
                        <h2 className="text-2xl font-bold">{selectedProject.title}</h2>
                        <Button variant="outline" size="sm" onClick={() => setSelectedProject(null)}>
                          Close
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <img src={selectedProject.imageUrl} alt={selectedProject.title} className="w-full rounded-lg mb-6" />
                          
                          <div className="mb-6">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span className="font-medium">{Math.round(selectedProject.raisedAmount / selectedProject.goalAmount * 100)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                              <div className="bg-gradient-to-r from-wca-purple to-wca-violet h-2.5 rounded-full" style={{
                          width: `${Math.min(100, Math.round(selectedProject.raisedAmount / selectedProject.goalAmount * 100))}%`
                        }}></div>
                            </div>
                            <div className="flex justify-between text-sm mt-1">
                              <span>${selectedProject.raisedAmount.toLocaleString()} raised</span>
                              <span>Goal: ${selectedProject.goalAmount.toLocaleString()}</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar size={16} className="text-wca-purple" />
                              <span>
                                <span className="font-medium">Timeline:</span> {selectedProject.startDate} - {selectedProject.endDate}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users size={16} className="text-wca-purple" />
                              <span>
                                <span className="font-medium">Supporters:</span> {selectedProject.supporters}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Filter size={16} className="text-wca-purple" />
                              <span>
                                <span className="font-medium">Category:</span> {selectedProject.category}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="mb-6">
                            <h3 className="font-bold text-lg mb-3">About This Project</h3>
                            <p className="text-gray-600 dark:text-gray-300">{selectedProject.description}</p>
                          </div>
                          
                          {selectedProject.updates.length > 0 && <div className="mb-6">
                              <h3 className="font-bold text-lg mb-3">Project Updates</h3>
                              <div className="space-y-4">
                                {selectedProject.updates.map((update, index) => <div key={index} className="border-l-2 border-wca-purple pl-4">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Calendar size={14} className="text-wca-purple" />
                                      <span className="text-sm text-gray-500 dark:text-gray-400">{update.date}</span>
                                    </div>
                                    <h4 className="font-medium mb-1">{update.title}</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">{update.content}</p>
                                  </div>)}
                              </div>
                            </div>}
                          
                          {selectedProject.status === "active" && <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
                              <h3 className="font-bold text-lg mb-4 text-center">Make a Donation</h3>
                              
                              <div className="grid grid-cols-3 gap-3 mb-4">
                                {[25, 50, 100].map(amount => <Button key={amount} variant={donationAmount === amount && !customAmount ? "default" : "outline"} className={donationAmount === amount && !customAmount ? "bg-wca-purple" : ""} onClick={() => handleDonationAmountClick(amount)}>
                                    ${amount}
                                  </Button>)}
                              </div>
                              
                              <div className="mb-6">
                                <label htmlFor="custom-amount" className="block text-sm font-medium mb-1">Custom Amount</label>
                                <div className="relative">
                                  <DollarSign size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                                  <input type="text" id="custom-amount" className="pl-10 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-wca-purple" placeholder="Enter amount" value={customAmount} onChange={handleCustomAmountChange} />
                                </div>
                              </div>
                              
                              <Button className="w-full bg-wca-teal hover:bg-wca-teal/90" onClick={() => setDonationStep(2)} disabled={donationAmount <= 0}>
                                <HandCoins size={16} className="mr-1" />
                                Donate ${donationAmount.toFixed(2)}
                              </Button>
                            </div>}
                          
                          {selectedProject.status === "completed" && <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                              <div className="flex items-start gap-3">
                                <Info size={20} className="text-blue-500 mt-0.5" />
                                <div>
                                  <h4 className="font-medium mb-1">Project Complete</h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-300">
                                    This project has been successfully funded! Thank you to everyone who contributed.
                                  </p>
                                </div>
                              </div>
                            </div>}
                          
                          {selectedProject.status === "upcoming" && <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg">
                              <div className="flex items-start gap-3">
                                <Clock size={20} className="text-amber-500 mt-0.5" />
                                <div>
                                  <h4 className="font-medium mb-1">Coming Soon</h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-300">
                                    This project will be accepting donations starting on {selectedProject.startDate}. Check back then!
                                  </p>
                                </div>
                              </div>
                            </div>}
                        </div>
                      </div>
                    </div>}
                  
                  {donationStep === 2 && <div className="p-6 md:p-8">
                      <div className="mb-6">
                        <div className="flex justify-between items-center">
                          <h2 className="text-2xl font-bold">Donor Information</h2>
                          <Button variant="outline" size="sm" onClick={() => setDonationStep(1)}>
                            Back
                          </Button>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300">
                          Please provide your information to complete your donation of ${donationAmount.toFixed(2)} to {selectedProject.title}.
                        </p>
                      </div>
                      
                      <div className="space-y-6">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium mb-1">Full Name</label>
                          <input type="text" id="name" name="name" className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-wca-purple" placeholder="Your name" value={donorInfo.name} onChange={handleDonorInfoChange} required />
                        </div>
                        
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium mb-1">Email Address</label>
                          <input type="email" id="email" name="email" className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-wca-purple" placeholder="Your email" value={donorInfo.email} onChange={handleDonorInfoChange} required />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            We'll send your donation receipt to this email address.
                          </p>
                        </div>
                        
                        <div className="flex items-center">
                          <input type="checkbox" id="anonymous" name="anonymous" checked={donorInfo.anonymous} onChange={handleDonorInfoChange} className="mr-2" />
                          <label htmlFor="anonymous" className="text-sm">
                            Make my donation anonymous
                          </label>
                        </div>
                        
                        <div className="pt-4">
                          <Button className="w-full bg-wca-teal hover:bg-wca-teal/90" onClick={() => setDonationStep(3)} disabled={!donorInfo.name || !donorInfo.email}>
                            <ArrowRight size={16} className="mr-1" />
                            Continue to Payment
                          </Button>
                        </div>
                      </div>
                    </div>}
                  
                  {donationStep === 3 && <div className="p-6 md:p-8">
                      <div className="mb-6">
                        <div className="flex justify-between items-center">
                          <h2 className="text-2xl font-bold">Payment Details</h2>
                          <Button variant="outline" size="sm" onClick={() => setDonationStep(2)}>
                            Back
                          </Button>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300">
                          Complete your donation of ${donationAmount.toFixed(2)} to {selectedProject.title}.
                        </p>
                      </div>
                      
                      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-6">
                        <h3 className="font-medium mb-2">Donation Summary</h3>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-600 dark:text-gray-300">Amount:</span>
                          <span className="font-medium">${donationAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-600 dark:text-gray-300">Project:</span>
                          <span className="font-medium">{selectedProject.title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-300">Donor:</span>
                          <span className="font-medium">
                            {donorInfo.anonymous ? "Anonymous" : donorInfo.name}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        <div>
                          <label htmlFor="card-number" className="block text-sm font-medium mb-1">Card Number</label>
                          <div className="relative">
                            <input type="text" id="card-number" className="pl-10 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-wca-purple" placeholder="**** **** **** ****" />
                            <CreditCard size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="expiry" className="block text-sm font-medium mb-1">Expiry Date</label>
                            <input type="text" id="expiry" className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-wca-purple" placeholder="MM/YY" />
                          </div>
                          
                          <div>
                            <label htmlFor="cvc" className="block text-sm font-medium mb-1">CVC</label>
                            <input type="text" id="cvc" className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-wca-purple" placeholder="123" />
                          </div>
                        </div>
                        
                        <div>
                          <label htmlFor="name-on-card" className="block text-sm font-medium mb-1">Name on Card</label>
                          <input type="text" id="name-on-card" className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-wca-purple" placeholder="Name as it appears on card" />
                        </div>
                        
                        <div className="pt-4">
                          <Button className="w-full bg-wca-teal hover:bg-wca-teal/90" onClick={handleSubmitDonation}>
                            <CheckCircle size={16} className="mr-1" />
                            Complete Donation
                          </Button>
                        </div>
                        
                        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                          Your payment information is encrypted and secure. We never store your full card details.
                        </p>
                      </div>
                    </div>}
                </div>
              </div>}
            
            <GlassPanel className="p-8">
              <div className="text-center mb-10">
                <h2 className="text-2xl font-bold mb-3">Ways to Support Our Mission</h2>
                <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  There are many ways you can contribute to the work we're doing at World Changers Association.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="overflow-hidden">
                  <div className="bg-wca-purple p-4 flex justify-center">
                    <HandCoins size={32} className="text-white" />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-2">One-Time Donations</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Make a one-time gift to support a specific project or our general fund. Every contribution makes a difference.
                    </p>
                    <Button className="w-full bg-wca-purple hover:bg-wca-purple/90">
                      Donate Now
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="overflow-hidden">
                  <div className="bg-wca-violet p-4 flex justify-center">
                    <Calendar size={32} className="text-white" />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-2">Recurring Giving</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Set up a monthly or quarterly donation to provide sustainable support for our ongoing initiatives.
                    </p>
                    <Button className="w-full bg-wca-violet hover:bg-wca-violet/90">
                      Become a Supporter
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="overflow-hidden">
                  <div className="bg-wca-teal p-4 flex justify-center">
                    <Users size={32} className="text-white" />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-2">Volunteer Your Time</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Contribute your skills and time to our projects. We have many volunteer opportunities available.
                    </p>
                    <Button className="w-full bg-wca-teal hover:bg-wca-teal/90">
                      Volunteer With Us
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </GlassPanel>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>;
};
export default Fundraising;