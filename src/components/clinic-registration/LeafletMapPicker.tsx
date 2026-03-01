import { useCallback, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon issue with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface LeafletMapPickerProps {
  onLocationSelect: (data: { lat: number; lng: number; address: string; city: string }) => void;
  initialLat?: number;
  initialLng?: number;
}

function LocationMarker({ onLocationSelect }: { onLocationSelect: LeafletMapPickerProps['onLocationSelect'] }) {
  const [position, setPosition] = useState<L.LatLng | null>(null);

  const map = useMapEvents({
    click: async (e) => {
      setPosition(e.latlng);

      // Reverse geocode using Nominatim
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}&zoom=18&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await response.json();

        const addr = data.address || {};
        const city = addr.city || addr.town || addr.village || addr.county || '';
        const address = data.display_name || '';

        onLocationSelect({
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          address,
          city,
        });
      } catch {
        onLocationSelect({
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          address: '',
          city: '',
        });
      }
    },
  });

  return position ? <Marker position={position} /> : null;
}

export function LeafletMapPicker({ onLocationSelect, initialLat = 20.5937, initialLng = 78.9629 }: LeafletMapPickerProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Click on the map to select your clinic location. Address and city will be auto-filled.</p>
      <div className="rounded-xl overflow-hidden border border-border" style={{ height: '300px' }}>
        <MapContainer
          center={[initialLat, initialLng]}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker onLocationSelect={onLocationSelect} />
        </MapContainer>
      </div>
    </div>
  );
}
