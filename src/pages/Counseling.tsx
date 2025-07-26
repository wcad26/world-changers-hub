import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { GlassPanel, GlassCard } from "@/components/ui/GlassPanels";
import { Calendar, Clock, User, Heart, CheckCircle, Search, Filter, Phone, Mail, MessageSquare, ChevronDown, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandList, CommandGroup, CommandItem } from "@/components/ui/command";
interface Counselor {
  id: number;
  name: string;
  title: string;
  specialties: string[];
  imageUrl: string;
  availability: {
    day: string;
    slots: string[];
  }[];
  bio: string;
  languages: string[];
  experience: string;
}
interface TimeSlot {
  time: string;
  available: boolean;
}
const counselors: Counselor[] = [{
  id: 1,
  name: "Dr. Sarah Johnson",
  title: "Licensed Professional Counselor",
  specialties: ["Marriage & Family", "Grief", "Anxiety"],
  imageUrl: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  availability: [{
    day: "Monday",
    slots: ["9:00 AM", "11:00 AM", "2:00 PM"]
  }, {
    day: "Wednesday",
    slots: ["10:00 AM", "1:00 PM", "4:00 PM"]
  }, {
    day: "Friday",
    slots: ["9:00 AM", "12:00 PM", "3:00 PM"]
  }],
  bio: "Dr. Sarah Johnson has over 15 years of experience in counseling individuals and families through difficult seasons. She specializes in helping couples restore their relationships and individuals navigate grief and anxiety.",
  languages: ["English", "Spanish"],
  experience: "15 years"
}, {
  id: 2,
  name: "Pastor James Wilson",
  title: "Pastoral Counselor",
  specialties: ["Spiritual Growth", "Life Direction", "Men's Issues"],
  imageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  availability: [{
    day: "Tuesday",
    slots: ["10:00 AM", "1:00 PM", "3:00 PM"]
  }, {
    day: "Thursday",
    slots: ["9:00 AM", "12:00 PM", "2:00 PM"]
  }, {
    day: "Saturday",
    slots: ["10:00 AM", "1:00 PM"]
  }],
  bio: "Pastor James Wilson combines biblical wisdom with practical counseling techniques to help individuals grow spiritually and find direction in life. He has a special passion for mentoring men through life's challenges.",
  languages: ["English"],
  experience: "12 years"
}, {
  id: 3,
  name: "Lisa Thompson",
  title: "Family Therapist",
  specialties: ["Parenting", "Child Behavior", "Family Dynamics"],
  imageUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  availability: [{
    day: "Monday",
    slots: ["10:00 AM", "1:00 PM", "4:00 PM"]
  }, {
    day: "Wednesday",
    slots: ["9:00 AM", "12:00 PM", "3:00 PM"]
  }, {
    day: "Thursday",
    slots: ["10:00 AM", "2:00 PM", "5:00 PM"]
  }],
  bio: "Lisa Thompson has devoted her career to helping families build healthy relationships and navigate challenges with children. She provides practical tools for parenting and improving family communication.",
  languages: ["English", "French"],
  experience: "8 years"
}, {
  id: 4,
  name: "Dr. Michael Davis",
  title: "Clinical Psychologist",
  specialties: ["Depression", "Trauma", "Addiction Recovery"],
  imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  availability: [{
    day: "Tuesday",
    slots: ["9:00 AM", "12:00 PM", "3:00 PM"]
  }, {
    day: "Friday",
    slots: ["10:00 AM", "1:00 PM", "4:00 PM"]
  }, {
    day: "Saturday",
    slots: ["9:00 AM", "11:00 AM", "2:00 PM"]
  }],
  bio: "Dr. Michael Davis brings clinical expertise in treating depression, trauma, and addiction. He helps clients develop coping mechanisms and find healing through evidence-based therapeutic approaches.",
  languages: ["English"],
  experience: "20 years"
}];
const Counseling = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedCounselor, setSelectedCounselor] = useState<Counselor | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [appointmentFormOpen, setAppointmentFormOpen] = useState<boolean>(false);
  const [specialtyOpen, setSpecialtyOpen] = useState<boolean>(false);
  const [dayOpen, setDayOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });

  // Get all specialties
  const allSpecialties = Array.from(new Set(counselors.flatMap(counselor => counselor.specialties)));

  // Get all days
  const allDays = Array.from(new Set(counselors.flatMap(counselor => counselor.availability.map(a => a.day))));

  // Filter counselors
  const filteredCounselors = counselors.filter(counselor => {
    // Filter by search
    if (searchQuery && !counselor.name.toLowerCase().includes(searchQuery.toLowerCase()) && !counselor.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))) {
      return false;
    }

    // Filter by specialty
    if (selectedSpecialty && !counselor.specialties.includes(selectedSpecialty)) return false;

    // Filter by day
    if (selectedDay && !counselor.availability.some(a => a.day === selectedDay)) return false;
    return true;
  });
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const {
      name,
      value
    } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real application, you would submit the form data to your backend
    console.log({
      counselor: selectedCounselor?.name,
      timeSlot: selectedTimeSlot,
      ...formData
    });

    // Reset form
    setFormData({
      name: "",
      email: "",
      phone: "",
      message: ""
    });
    setAppointmentFormOpen(false);
    setSelectedTimeSlot(null);

    // This would be replaced with proper form submission
    alert("Appointment request submitted successfully!");
  };
  const handleSelectTimeSlot = (time: string) => {
    setSelectedTimeSlot(time);
    setAppointmentFormOpen(true);
  };
  return <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <main className="flex-grow pt-0 pb-0">
        <section className="bg-gradient-to-b from-gray-100 to-white dark:from-gray-900 dark:to-gray-950 py-0">
          <div className="container-custom py-[20px]">
            <div className="flex flex-col items-center text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="text-gradient bg-gradient-to-r from-wca-purple to-wca-violet bg-clip-text text-transparent">
                  Counseling Services
                </span>
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
                Our team of licensed counselors and pastoral staff are here to provide guidance, support, and biblical wisdom for life's challenges.
              </p>
            </div>
          </div>
        </section>

        <section className="py-[2px]">
          <div className="container-custom">
            <div className="flex flex-row justify-between items-center gap-6 mb-12 py-[10px]">
              <div className="w-full md:w-auto relative">
                <div className="relative">
                  <input type="text" placeholder="Search counselors..." className="pl-10 pr-4 py-2 w-full md:w-64 bg-gray-100 dark:bg-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-wca-purple" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                </div>
              </div>
              
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Popover open={specialtyOpen} onOpenChange={setSpecialtyOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={specialtyOpen} className="justify-between min-w-[120px] h-12 px-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Heart size={16} className="text-gray-400 dark:text-gray-500" />
                        <span className="text-gray-700 dark:text-gray-200 hover:text-white">
                          {selectedSpecialty || "All Specialties"}
                        </span>
                      </div>
                      <ChevronDown size={16} className="text-gray-400 dark:text-gray-500 transition-transform duration-200" style={{
                      transform: specialtyOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                    }} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-xl rounded-xl">
                    <Command>
                      <CommandList>
                        <CommandGroup>
                          <CommandItem value="" onSelect={() => {
                          setSelectedSpecialty(null);
                          setSpecialtyOpen(false);
                        }} className="flex items-center justify-between px-3 py-2.5 hover:bg-wca-purple group transition-colors duration-200 rounded-lg mx-1">
                            <span className="text-sm font-medium group-hover:text-white">All Specialties</span>
                            {!selectedSpecialty && <Check size={14} className="text-wca-purple group-hover:text-white" />}
                          </CommandItem>
                          {allSpecialties.map(specialty => <CommandItem key={specialty} value={specialty} onSelect={() => {
                          setSelectedSpecialty(specialty);
                          setSpecialtyOpen(false);
                        }} className="flex items-center justify-between px-3 py-2.5 hover:bg-wca-purple hover:text-white transition-colors duration-200 rounded-lg mx-1">
                              <span className="text-sm font-medium">{specialty}</span>
                              {selectedSpecialty === specialty && <Check size={14} className="text-wca-purple hover:text-white" />}
                            </CommandItem>)}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                
                <Popover open={dayOpen} onOpenChange={setDayOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={dayOpen} className="justify-between min-w-[100px] h-12 px-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400 dark:text-gray-500" />
                        <span className="text-gray-700 dark:text-gray-200 hover:text-white">
                          {selectedDay || "All Days"}
                        </span>
                      </div>
                      <ChevronDown size={16} className="text-gray-400 dark:text-gray-500 transition-transform duration-200" style={{
                      transform: dayOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                    }} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[180px] p-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-xl rounded-xl">
                    <Command>
                      <CommandList>
                        <CommandGroup>
                          <CommandItem value="" onSelect={() => {
                          setSelectedDay(null);
                          setDayOpen(false);
                        }} className="flex items-center justify-between px-3 py-2.5 hover:bg-wca-purple group transition-colors duration-200 rounded-lg mx-1">
                            <span className="text-sm font-medium group-hover:text-white">All Days</span>
                            {!selectedDay && <Check size={14} className="text-wca-purple group-hover:text-white" />}
                          </CommandItem>
                          {allDays.map(day => <CommandItem key={day} value={day} onSelect={() => {
                          setSelectedDay(day);
                          setDayOpen(false);
                        }} className="flex items-center justify-between px-3 py-2.5 hover:bg-wca-purple hover:text-white transition-colors duration-200 rounded-lg mx-1">
                              <span className="text-sm font-medium">{day}</span>
                              {selectedDay === day && <Check size={14} className="text-wca-purple hover:text-white" />}
                            </CommandItem>)}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {filteredCounselors.map(counselor => <GlassCard key={counselor.id} className={`transition-all duration-300 ${selectedCounselor?.id === counselor.id ? 'ring-2 ring-wca-purple' : ''}`}>
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <img src={counselor.imageUrl} alt={counselor.name} className="w-16 h-16 rounded-full object-cover" />
                      <div>
                        <h3 className="font-bold text-lg">{counselor.name}</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">{counselor.title}</p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm mb-2 text-gray-700 dark:text-gray-300">Specialties:</p>
                      <div className="flex flex-wrap gap-2">
                        {counselor.specialties.map(specialty => <span key={specialty} className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs px-3 py-1 rounded-full">
                            {specialty}
                          </span>)}
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm mb-2 text-gray-700 dark:text-gray-300">Availability:</p>
                      <div className="space-y-1 text-sm">
                        {counselor.availability.map(({
                      day,
                      slots
                    }) => <div key={day} className="flex items-start">
                            <span className="font-medium w-24">{day}:</span>
                            <span className="text-gray-600 dark:text-gray-400">
                              {slots.join(", ")}
                            </span>
                          </div>)}
                      </div>
                    </div>
                    
                    <Button className="w-full bg-wca-purple hover:bg-wca-purple/90" onClick={() => setSelectedCounselor(counselor)}>
                      View Profile & Schedule
                    </Button>
                  </div>
                </GlassCard>)}
            </div>

            {filteredCounselors.length === 0 && <div className="text-center py-12">
                <p className="text-lg text-gray-500 dark:text-gray-400">No counselors found matching your criteria.</p>
              </div>}
            
            {selectedCounselor && <GlassPanel className="p-8 mb-10">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold">Counselor Profile</h2>
                  <Button variant="outline" onClick={() => {
                setSelectedCounselor(null);
                setSelectedTimeSlot(null);
                setAppointmentFormOpen(false);
              }}>
                    Close
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-1">
                    <img src={selectedCounselor.imageUrl} alt={selectedCounselor.name} className="w-full rounded-lg mb-4 aspect-square object-cover" />
                    <h3 className="font-bold text-xl mb-1">{selectedCounselor.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{selectedCounselor.title}</p>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="font-medium mb-1">Specialties:</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedCounselor.specialties.map(specialty => <span key={specialty} className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs px-3 py-1 rounded-full">
                              {specialty}
                            </span>)}
                        </div>
                      </div>
                      
                      <div>
                        <p className="font-medium mb-1">Languages:</p>
                        <p className="text-gray-600 dark:text-gray-400">
                          {selectedCounselor.languages.join(", ")}
                        </p>
                      </div>
                      
                      <div>
                        <p className="font-medium mb-1">Experience:</p>
                        <p className="text-gray-600 dark:text-gray-400">{selectedCounselor.experience}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="md:col-span-2">
                    <div className="mb-6">
                      <h3 className="font-bold text-lg mb-3">About</h3>
                      <p className="text-gray-600 dark:text-gray-300">{selectedCounselor.bio}</p>
                    </div>
                    
                    <div className="mb-6">
                      <h3 className="font-bold text-lg mb-3">Schedule an Appointment</h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        Select a day and time slot to schedule your counseling session with {selectedCounselor.name}.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {selectedCounselor.availability.map(({
                      day,
                      slots
                    }) => <Card key={day} className="overflow-hidden">
                            <div className="bg-gray-100 dark:bg-gray-800 p-3">
                              <h4 className="font-medium">{day}</h4>
                            </div>
                            <CardContent className="p-4">
                              <div className="grid grid-cols-1 gap-2">
                                {slots.map(time => <Button key={time} variant={selectedTimeSlot === time ? "default" : "outline"} className={selectedTimeSlot === time ? "bg-wca-purple" : ""} onClick={() => handleSelectTimeSlot(time)}>
                                    <Clock size={14} className="mr-1" />
                                    {time}
                                  </Button>)}
                              </div>
                            </CardContent>
                          </Card>)}
                      </div>
                    </div>
                    
                    {appointmentFormOpen && <Card>
                        <CardContent className="p-6">
                          <h3 className="font-bold text-lg mb-4">Complete Your Appointment Request</h3>
                          <p className="text-gray-600 dark:text-gray-300 mb-4">
                            You're scheduling an appointment with {selectedCounselor.name} on {selectedTimeSlot}.
                          </p>
                          
                          <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                              <label htmlFor="name" className="block text-sm font-medium mb-1">Full Name</label>
                              <div className="relative">
                                <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} className="pl-10 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-wca-purple" required />
                                <User size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                              </div>
                            </div>
                            
                            <div>
                              <label htmlFor="email" className="block text-sm font-medium mb-1">Email Address</label>
                              <div className="relative">
                                <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} className="pl-10 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-wca-purple" required />
                                <Mail size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                              </div>
                            </div>
                            
                            <div>
                              <label htmlFor="phone" className="block text-sm font-medium mb-1">Phone Number</label>
                              <div className="relative">
                                <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} className="pl-10 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-wca-purple" />
                                <Phone size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                              </div>
                            </div>
                            
                            <div>
                              <label htmlFor="message" className="block text-sm font-medium mb-1">Brief Description (Optional)</label>
                              <div className="relative">
                                <textarea id="message" name="message" value={formData.message} onChange={handleInputChange} rows={4} className="pl-10 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-wca-purple"></textarea>
                                <MessageSquare size={16} className="absolute left-3 top-3 text-gray-500" />
                              </div>
                            </div>
                            
                            <div className="flex gap-4">
                              <Button type="submit" className="bg-wca-purple hover:bg-wca-purple/90">
                                <CheckCircle size={16} className="mr-1" />
                                Confirm Appointment
                              </Button>
                              <Button type="button" variant="outline" onClick={() => setAppointmentFormOpen(false)}>
                                Cancel
                              </Button>
                            </div>
                          </form>
                        </CardContent>
                      </Card>}
                  </div>
                </div>
              </GlassPanel>}
            
            <GlassPanel className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-3">Counseling FAQ</h2>
                <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  Answers to common questions about our counseling services.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold text-lg mb-2">What does counseling cost?</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    We offer counseling on a sliding scale basis to ensure everyone has access to support. Typical sessions range from $30-$90 depending on income level. We also offer limited free sessions for those in financial hardship.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-bold text-lg mb-2">How long is each session?</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Standard counseling sessions are 50 minutes long. Initial consultations may be scheduled for 60-90 minutes to allow for a thorough assessment.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-bold text-lg mb-2">Is counseling confidential?</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Yes, all counseling sessions are confidential. The only exceptions are when there is a risk of harm to self or others, or in cases of abuse, which we are legally required to report.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-bold text-lg mb-2">Can I do virtual counseling?</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Yes, we offer both in-person and secure video counseling sessions. Please indicate your preference when scheduling your appointment.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-bold text-lg mb-2">What counseling approaches do you use?</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Our counselors use various evidence-based approaches including Cognitive Behavioral Therapy (CBT), Solution-Focused Therapy, and Faith-Integrated Counseling, tailoring the approach to each client's needs.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-bold text-lg mb-2">How do I prepare for my first session?</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Come as you are! Consider what you hope to gain from counseling. You'll be asked to complete intake forms about your background and current concerns, which you can request in advance.
                  </p>
                </div>
              </div>
            </GlassPanel>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>;
};
export default Counseling;