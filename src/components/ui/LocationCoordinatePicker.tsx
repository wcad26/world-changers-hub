import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MapPin, Copy, ExternalLink } from 'lucide-react';
import GoogleMap from '@/components/ui/GoogleMap';
import { useToast } from '@/hooks/use-toast';

interface LocationCoordinatePickerProps {
  latitude?: number;
  longitude?: number;
  onCoordinateSelect: (lat: number, lng: number, address?: string) => void;
  initialAddress?: string;
  className?: string;
}

const LocationCoordinatePicker: React.FC<LocationCoordinatePickerProps> = ({
  latitude,
  longitude,
  onCoordinateSelect,
  initialAddress = '',
  className = '',
}) => {
  const { toast } = useToast();
  const [manualLat, setManualLat] = useState(latitude?.toString() || '');
  const [manualLng, setManualLng] = useState(longitude?.toString() || '');
  const [urlInput, setUrlInput] = useState('');
  const [currentAddress, setCurrentAddress] = useState(initialAddress);

  // Extract coordinates from Google Maps URL
  const extractCoordinatesFromUrl = (url: string) => {
    try {
      // Handle various Google Maps URL formats
      const patterns = [
        /@(-?\d+\.?\d*),(-?\d+\.?\d*)/, // @lat,lng
        /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/, // !3dlat!4dlng
        /q=(-?\d+\.?\d*),(-?\d+\.?\d*)/, // q=lat,lng
        /ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/, // ll=lat,lng
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          const lat = parseFloat(match[1]);
          const lng = parseFloat(match[2]);
          if (!isNaN(lat) && !isNaN(lng)) {
            return { lat, lng };
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Error parsing URL:', error);
      return null;
    }
  };

  const handleUrlPaste = () => {
    const coords = extractCoordinatesFromUrl(urlInput);
    if (coords) {
      setManualLat(coords.lat.toString());
      setManualLng(coords.lng.toString());
      onCoordinateSelect(coords.lat, coords.lng);
      toast({
        title: "Coordinates Extracted",
        description: `Latitude: ${coords.lat}, Longitude: ${coords.lng}`,
      });
      setUrlInput('');
    } else {
      toast({
        title: "Invalid URL",
        description: "Could not extract coordinates from the provided URL.",
        variant: "destructive",
      });
    }
  };

  const handleManualInput = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    
    if (isNaN(lat) || isNaN(lng)) {
      toast({
        title: "Invalid Coordinates",
        description: "Please enter valid latitude and longitude values.",
        variant: "destructive",
      });
      return;
    }

    if (lat < -90 || lat > 90) {
      toast({
        title: "Invalid Latitude",
        description: "Latitude must be between -90 and 90.",
        variant: "destructive",
      });
      return;
    }

    if (lng < -180 || lng > 180) {
      toast({
        title: "Invalid Longitude",
        description: "Longitude must be between -180 and 180.",
        variant: "destructive",
      });
      return;
    }

    onCoordinateSelect(lat, lng);
    toast({
      title: "Coordinates Set",
      description: `Location updated to ${lat}, ${lng}`,
    });
  };

  const handleMapLocationSelect = (lat: number, lng: number, address: string) => {
    setManualLat(lat.toFixed(6));
    setManualLng(lng.toFixed(6));
    setCurrentAddress(address);
    onCoordinateSelect(lat, lng, address);
  };

  const copyCoordinates = () => {
    if (manualLat && manualLng) {
      navigator.clipboard.writeText(`${manualLat}, ${manualLng}`);
      toast({
        title: "Coordinates Copied",
        description: "Coordinates copied to clipboard",
      });
    }
  };

  const openInGoogleMaps = () => {
    if (manualLat && manualLng) {
      const url = `https://maps.google.com/?q=${manualLat},${manualLng}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="border rounded-lg p-4">
        <Label className="text-sm font-medium mb-3 block">Select Location on Map</Label>
        <GoogleMap
          height="350px"
          initialLat={latitude || 40.7128}
          initialLng={longitude || -74.0060}
          onLocationSelect={handleMapLocationSelect}
        />
        {currentAddress && (
          <div className="mt-2 p-2 bg-muted rounded-sm">
            <p className="text-sm text-muted-foreground">
              <strong>Address:</strong> {currentAddress}
            </p>
          </div>
        )}
      </div>

      <div className="border rounded-lg p-4 space-y-4">
        <Label className="text-sm font-medium">Paste Google Maps URL</Label>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Paste Google Maps URL here..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="flex-1"
          />
          <Button 
            type="button" 
            onClick={handleUrlPaste}
            disabled={!urlInput.trim()}
            variant="outline"
          >
            Extract
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Paste a Google Maps URL to automatically extract coordinates
        </p>
      </div>

      <div className="border rounded-lg p-4 space-y-4">
        <Label className="text-sm font-medium">Manual Coordinate Entry</Label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="latitude" className="text-xs">Latitude</Label>
            <Input
              id="latitude"
              type="number"
              step="any"
              placeholder="40.7128"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="longitude" className="text-xs">Longitude</Label>
            <Input
              id="longitude"
              type="number"
              step="any"
              placeholder="-74.0060"
              value={manualLng}
              onChange={(e) => setManualLng(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            type="button" 
            onClick={handleManualInput}
            disabled={!manualLat || !manualLng}
            variant="outline"
            size="sm"
          >
            <MapPin className="w-4 h-4 mr-1" />
            Set Location
          </Button>
          
          {manualLat && manualLng && (
            <>
              <Button 
                type="button" 
                onClick={copyCoordinates}
                variant="outline"
                size="sm"
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </Button>
              
              <Button 
                type="button" 
                onClick={openInGoogleMaps}
                variant="outline"
                size="sm"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                View
              </Button>
            </>
          )}
        </div>
        
        <p className="text-xs text-muted-foreground">
          Enter coordinates manually (Latitude: -90 to 90, Longitude: -180 to 180)
        </p>
      </div>
    </div>
  );
};

export default LocationCoordinatePicker;