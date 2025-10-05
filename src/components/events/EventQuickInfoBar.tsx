import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { format } from "date-fns";
import { Event } from "@/hooks/useEvents";
import { useEffect, useState } from "react";

interface EventQuickInfoBarProps {
  event: Event;
}

export function EventQuickInfoBar({ event }: EventQuickInfoBarProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 600);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
    >
      <div className="glass-panel-dark backdrop-blur-xl border-b border-primary/20 shadow-lg">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between overflow-x-auto gap-4 scrollbar-hide">
            <h2 className="text-lg font-semibold truncate min-w-[200px] bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {event.name}
            </h2>
            
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <Calendar className="h-4 w-4 text-primary" />
                <span>{format(new Date(event.start_datetime), "MMM dd, yyyy")}</span>
              </div>
              
              <div className="flex items-center gap-2 whitespace-nowrap">
                <Clock className="h-4 w-4 text-primary" />
                <span>{format(new Date(event.start_datetime), "h:mm a")}</span>
              </div>
              
              <div className="hidden md:flex items-center gap-2 whitespace-nowrap">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="truncate max-w-[200px]">{event.location_name || "TBA"}</span>
              </div>
              
              <div className="hidden lg:flex items-center gap-2 whitespace-nowrap">
                <Users className="h-4 w-4 text-primary" />
                <span>{event.capacity ? `${event.capacity} spots` : "Unlimited"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
