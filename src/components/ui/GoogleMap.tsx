import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

declare global {
  interface Window {
    google: any;
  }
}

interface GoogleMapProps {
  onLocationSelect?: (lat: number, lng: number, address: string) => void;
  initialLat?: number;
  initialLng?: number;
  height?: string;
}

const GoogleMap: React.FC<GoogleMapProps> = ({ 
  onLocationSelect, 
  initialLat = 40.7128, 
  initialLng = -74.0060,
  height = "300px"
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    const initMap = async () => {
      try {
        // Fetch Google Maps API key from edge function
        const { data, error: functionError } = await supabase.functions.invoke('get-maps-config');
        
        if (functionError || !data?.apiKey) {
          setError('Google Maps API key not configured. Please add GOOGLE_MAPS_API_KEY to your Supabase secrets.');
          setIsLoading(false);
          return;
        }
        
        const googleMapsApiKey = data.apiKey;

        const loader = new Loader({
          apiKey: googleMapsApiKey,
          version: 'weekly',
          libraries: ['places']
        });

        const google = await loader.load();
        
        if (!mapRef.current) return;

        const mapInstance = new (window as any).google.maps.Map(mapRef.current, {
          center: { lat: initialLat, lng: initialLng },
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        setMap(mapInstance);

        // Add initial marker
        const markerInstance = new (window as any).google.maps.Marker({
          position: { lat: initialLat, lng: initialLng },
          map: mapInstance,
          draggable: true,
        });

        setMarker(markerInstance);

        // Initialize Places Autocomplete for search
        if (searchInputRef.current) {
          const autocomplete = new (window as any).google.maps.places.Autocomplete(searchInputRef.current, {
            componentRestrictions: { country: [] }, // Allow all countries
            fields: ['place_id', 'geometry', 'name', 'formatted_address'],
            types: ['establishment', 'geocode']
          });

          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (!place.geometry || !place.geometry.location) {
              console.log("No geometry found for place:", place.name);
              return;
            }

            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            
            // Update map center and marker position
            mapInstance.setCenter({ lat, lng });
            mapInstance.setZoom(15);
            markerInstance.setPosition({ lat, lng });
            
            // Call the callback
            onLocationSelect?.(lat, lng, place.formatted_address || place.name || `${lat}, ${lng}`);
          });
        }

        // Handle marker drag
        markerInstance.addListener('dragend', () => {
          const position = markerInstance.getPosition();
          if (position) {
            const lat = position.lat();
            const lng = position.lng();
            
            // Reverse geocode to get address
            const geocoder = new (window as any).google.maps.Geocoder();
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
              if (status === 'OK' && results && results[0]) {
                onLocationSelect?.(lat, lng, results[0].formatted_address);
              } else {
                onLocationSelect?.(lat, lng, `${lat}, ${lng}`);
              }
            });
          }
        });

        // Handle map click
        mapInstance.addListener('click', (event: any) => {
          if (event.latLng) {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            
            markerInstance.setPosition({ lat, lng });
            
            // Reverse geocode to get address
            const geocoder = new (window as any).google.maps.Geocoder();
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
              if (status === 'OK' && results && results[0]) {
                onLocationSelect?.(lat, lng, results[0].formatted_address);
              } else {
                onLocationSelect?.(lat, lng, `${lat}, ${lng}`);
              }
            });
          }
        });

        setIsLoading(false);
      } catch (err) {
        console.error('Error loading Google Maps:', err);
        setError('Failed to load Google Maps. Please check your API key and try again.');
        setIsLoading(false);
      }
    };

    initMap();
  }, [initialLat, initialLng, onLocationSelect]);

  if (error) {
    return (
      <div 
        className="bg-muted rounded-md flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center p-4">
          <p className="text-sm text-muted-foreground">{error}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Please configure GOOGLE_MAPS_API_KEY in your environment
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div 
        className="bg-muted rounded-md flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 z-10" />
        <Input
          ref={searchInputRef}
          type="text"
          placeholder="Search for a location..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-10"
        />
      </div>
      <div 
        ref={mapRef} 
        className="w-full rounded-md border"
        style={{ height }}
      />
      <p className="text-xs text-muted-foreground">
        Search for a location above, click on the map, or drag the marker to set the exact location
      </p>
    </div>
  );
};

export default GoogleMap;