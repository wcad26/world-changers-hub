import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, ExternalLink, Phone, Users, User } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassPanels';
import type { PublicLocation } from '@/hooks/usePublicLocations';

interface LocationCardProps {
  location: PublicLocation;
  onDonate?: () => void;
}

export const WCACenterCard: React.FC<LocationCardProps> = ({ location, onDonate }) => {
  const formatRegionForUrl = (region: string) => {
    return region.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  };

  return (
    <GlassCard className="overflow-hidden h-full flex flex-col">
      <div className="h-48 relative overflow-hidden">
        <img 
          src={location.image_url || '/placeholder.svg'} 
          alt={location.name} 
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
          loading="lazy"
        />
        <div className="absolute top-4 right-4">
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-wca-purple text-white">
            WCA Center
          </span>
        </div>
        {location.region && (
          <div className="absolute top-4 left-4">
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-white/90 text-gray-800">
              {location.region.name} Region
            </span>
          </div>
        )}
        {location.is_featured && (
          <div className="absolute bottom-4 left-4">
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-yellow-500 text-white">
              Featured
            </span>
          </div>
        )}
      </div>
      
      <div className="p-6 flex-grow flex flex-col">
        <h3 className="font-semibold text-xl mb-3 line-clamp-2">{location.name}</h3>
        
        <div className="flex items-start text-gray-600 dark:text-gray-300 mb-3">
          <MapPin size={16} className="mr-2 mt-1 flex-shrink-0 text-wca-purple" />
          <span className="text-sm line-clamp-2">{location.address}, {location.city}, {location.state}</span>
        </div>
        
        {location.contact_phone && (
          <div className="flex items-center text-gray-600 dark:text-gray-300 mb-3">
            <Phone size={16} className="mr-2 flex-shrink-0 text-wca-purple" />
            <span className="text-sm">{location.contact_phone}</span>
          </div>
        )}
        
        {location.capacity && (
          <div className="flex items-center text-gray-600 dark:text-gray-300 mb-4">
            <Users size={16} className="mr-2 flex-shrink-0 text-wca-purple" />
            <span className="text-sm">Capacity: {location.capacity} people</span>
          </div>
        )}
        
        {location.fellowship_times && Array.isArray(location.fellowship_times) && location.fellowship_times.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center text-gray-700 dark:text-gray-200 font-medium mb-2">
              <Clock size={16} className="mr-2 text-wca-purple" />
              <span>Service Times</span>
            </div>
            <ul className="space-y-1 pl-6">
              {location.fellowship_times.map((time: any, index: number) => (
                <li key={index} className="text-sm text-gray-600 dark:text-gray-300">
                  {typeof time === 'string' ? time : `${time.day}: ${time.time} - ${time.type}`}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="flex flex-col gap-2 mt-auto">
          {location.region && (
            <Link 
              to={`/locations/${formatRegionForUrl(location.region.name)}`}
              className="flex items-center justify-center bg-wca-purple hover:bg-wca-violet text-white rounded-lg px-4 py-3 text-sm font-medium transition-colors touch-target"
            >
              Visit Regional Page
            </Link>
          )}
          
          <div className="grid grid-cols-2 gap-2">
            <a 
              href={(() => {
                if (location.latitude && location.longitude) {
                  return `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
                } else {
                  const searchQuery = encodeURIComponent(`${location.name} ${location.address}`);
                  return `https://maps.google.com/maps?q=${searchQuery}`;
                }
              })()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center text-wca-purple hover:text-wca-violet transition-colors border border-wca-purple hover:border-wca-violet rounded-lg px-3 py-2 text-sm font-medium touch-target"
            >
              <MapPin size={14} className="mr-1" />
              Directions
            </a>
            
            {(location.whatsapp_link || location.contact_phone) && (
              <a 
                href={location.whatsapp_link || `https://wa.me/${location.contact_phone?.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center bg-green-500 hover:bg-green-600 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors touch-target"
              >
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Chat
              </a>
            )}
          </div>
          
          {onDonate && (
            <button 
              onClick={onDonate}
              className="flex items-center justify-center bg-wca-teal hover:bg-wca-teal/90 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors touch-target"
            >
              Donate to Center
            </button>
          )}
        </div>
      </div>
    </GlassCard>
  );
};

export const DCGLocationCard: React.FC<LocationCardProps> = ({ location, onDonate }) => {
  const { dcg } = location;
  
  const formatMeetingTime = () => {
    if (!dcg?.meeting_day || !dcg?.meeting_time) return null;
    return `${dcg.meeting_day}s at ${dcg.meeting_time}`;
  };

  const getContactInfo = () => {
    // Prioritize DCG leader contact, then DCG contact, then location contact
    const phone = dcg?.leader?.phone || dcg?.contact_phone || location.contact_phone;
    const name = dcg?.leader ? `${dcg.leader.first_name} ${dcg.leader.last_name}` : location.contact_person;
    return { phone, name };
  };

  const { phone: contactPhone, name: contactName } = getContactInfo();

  return (
    <GlassCard className="overflow-hidden h-full flex flex-col">
      <div className="h-48 relative overflow-hidden">
        <img 
          src={location.image_url || '/placeholder.svg'} 
          alt={location.name} 
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
          loading="lazy"
        />
        <div className="absolute top-4 right-4">
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-wca-teal text-white">
            DCG Home
          </span>
        </div>
        {location.region && (
          <div className="absolute top-4 left-4">
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-white/90 text-gray-800">
              {location.region.name} Region
            </span>
          </div>
        )}
        {dcg?.member_count !== undefined && (
          <div className="absolute bottom-4 right-4">
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-black/70 text-white">
              {dcg.member_count} members
            </span>
          </div>
        )}
      </div>
      
      <div className="p-6 flex-grow flex flex-col">
        <h3 className="font-semibold text-xl mb-3 line-clamp-2">{dcg?.name || location.name}</h3>
        
        <div className="flex items-start text-gray-600 dark:text-gray-300 mb-3">
          <MapPin size={16} className="mr-2 mt-1 flex-shrink-0 text-wca-teal" />
          <span className="text-sm line-clamp-2">{location.address}, {location.city}</span>
        </div>
        
        {dcg?.leader && (
          <div className="flex items-center text-gray-600 dark:text-gray-300 mb-3">
            <User size={16} className="mr-2 flex-shrink-0 text-wca-teal" />
            <span className="text-sm">Leader: {dcg.leader.first_name} {dcg.leader.last_name}</span>
          </div>
        )}
        
        {contactPhone && (
          <div className="flex items-center text-gray-600 dark:text-gray-300 mb-3">
            <Phone size={16} className="mr-2 flex-shrink-0 text-wca-teal" />
            <span className="text-sm">{contactPhone}</span>
          </div>
        )}
        
        {dcg?.member_count !== undefined && (
          <div className="flex items-center text-gray-600 dark:text-gray-300 mb-3">
            <Users size={16} className="mr-2 flex-shrink-0 text-wca-teal" />
            <span className="text-sm">{dcg.member_count} active members</span>
          </div>
        )}
        
        {formatMeetingTime() && (
          <div className="mb-4">
            <div className="flex items-center text-gray-700 dark:text-gray-200 font-medium mb-1">
              <Clock size={16} className="mr-2 text-wca-teal" />
              <span>Meeting Time</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 pl-6">
              {formatMeetingTime()}
            </p>
          </div>
        )}
        
        {dcg?.description && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
              {dcg.description}
            </p>
          </div>
        )}
        
        <div className="flex flex-col gap-2 mt-auto">
          <div className="grid grid-cols-2 gap-2">
            <a 
              href={(() => {
                if (location.latitude && location.longitude) {
                  return `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
                } else {
                  const searchQuery = encodeURIComponent(`${location.name} ${location.address}`);
                  return `https://maps.google.com/maps?q=${searchQuery}`;
                }
              })()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center text-wca-teal hover:text-wca-teal/80 transition-colors border border-wca-teal hover:border-wca-teal/80 rounded-lg px-3 py-2 text-sm font-medium touch-target"
            >
              <MapPin size={14} className="mr-1" />
              Directions
            </a>
            
            {contactPhone && (
              <a 
                href={`https://wa.me/${contactPhone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center bg-green-500 hover:bg-green-600 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors touch-target"
              >
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Chat
              </a>
            )}
          </div>
          
          {onDonate && (
            <button 
              onClick={onDonate}
              className="flex items-center justify-center bg-wca-purple hover:bg-wca-violet text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors touch-target"
            >
              Support DCG
            </button>
          )}
        </div>
      </div>
    </GlassCard>
  );
};

export const LocationCardSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      <div className="space-y-2 p-6">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        <div className="space-y-2 mt-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="grid grid-cols-2 gap-2">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
};