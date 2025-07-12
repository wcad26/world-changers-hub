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
    const waitForMapContainer = () => {
      return new Promise<HTMLDivElement>((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 15; // Increased for dialog rendering
        const checkInterval = 300; // Slightly longer interval

        const checkForContainer = () => {
          attempts++;
          console.log(`Checking for map container, attempt ${attempts}/${maxAttempts}`);
          
          if (mapRef.current && mapRef.current.offsetParent !== null) {
            // Ensure the element is actually visible and in the DOM
            const rect = mapRef.current.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              console.log('Map container found and visible!');
              resolve(mapRef.current);
              return;
            }
          }

          if (attempts >= maxAttempts) {
            reject(new Error('Map container not found after maximum attempts'));
            return;
          }

          setTimeout(checkForContainer, checkInterval);
        };

        // For dialogs, wait a bit longer initially
        const isInDialog = document.querySelector('[role="dialog"]') !== null;
        const initialDelay = isInDialog ? 500 : 100;
        
        setTimeout(() => {
          checkForContainer();
        }, initialDelay);

        // Also use MutationObserver to detect when DOM changes
        if (typeof MutationObserver !== 'undefined') {
          const observer = new MutationObserver(() => {
            if (mapRef.current && mapRef.current.offsetParent !== null) {
              const rect = mapRef.current.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                observer.disconnect();
                resolve(mapRef.current);
              }
            }
          });

          observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
          });

          // Clean up observer after max attempts
          setTimeout(() => {
            observer.disconnect();
          }, maxAttempts * checkInterval + initialDelay);
        }
      });
    };

    const initMap = async () => {
      try {
        console.log('Waiting for map container...');
        await waitForMapContainer();
        
        console.log('Initializing Google Maps...');
        
        // Fetch Google Maps API key from edge function
        const { data, error: functionError } = await supabase.functions.invoke('get-maps-config');
        
        console.log('Edge function response:', { data, functionError });
        
        if (functionError) {
          console.error('Edge function error:', functionError);
          setError(`Edge function error: ${functionError.message}`);
          setIsLoading(false);
          return;
        }
        
        if (!data?.apiKey) {
          console.error('No API key received from edge function');
          setError('Google Maps API key not configured. Please add GOOGLE_MAPS_API_KEY to your Supabase secrets.');
          setIsLoading(false);
          return;
        }
        
        console.log('API key received, loading Google Maps...');
        const googleMapsApiKey = data.apiKey;

        const loader = new Loader({
          apiKey: googleMapsApiKey,
          version: 'weekly',
          libraries: ['places']
        });

        console.log('Loading Google Maps API...');
        const google = await loader.load();
        console.log('Google Maps API loaded successfully');
        
        // Double-check that the map container is still available
        if (!mapRef.current) {
          console.error('Map container became unavailable during initialization');
          setError('Map container not found. Please try refreshing the page.');
          setIsLoading(false);
          return;
        }

        console.log('Creating map instance...');
        const mapInstance = new (window as any).google.maps.Map(mapRef.current, {
          center: { lat: initialLat, lng: initialLng },
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        console.log('Map instance created successfully');
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
          {error.includes('API key') && (
            <p className="text-xs text-muted-foreground mt-2">
              Please configure GOOGLE_MAPS_API_KEY in your Supabase secrets
            </p>
          )}
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