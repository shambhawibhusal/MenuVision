import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { MapPin } from 'lucide-react';

interface LocationMapProps {
  latitude: number;
  longitude: number;
  placeName?: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '12px',
};

const defaultCenter = {
  lat: 27.7172,
  lng: 85.3240,
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
};

export function LocationMap({ latitude, longitude, placeName }: LocationMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  const center = {
    lat: latitude,
    lng: longitude,
  };

  if (loadError) {
    return (
      <div className="w-full h-[300px] rounded-xl bg-gray-100 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <MapPin className="w-8 h-8 mx-auto mb-2" />
          <p>Error loading map</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-[300px] rounded-xl bg-gray-100 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin mx-auto mb-2" />
          <p>Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={15}
      options={mapOptions}
    >
      <Marker
        position={center}
        title={placeName || 'Restaurant Location'}
      />
    </GoogleMap>
  );
}