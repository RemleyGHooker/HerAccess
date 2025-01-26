import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import type { Facility } from "@db/schema";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface ResourceMapProps {
  facilities: Facility[];
  radius: number;
  center: {
    lat: number;
    lng: number;
  };
}

interface OperatingHours {
  [key: string]: string;
}

export default function ResourceMap({ facilities, radius, center }: ResourceMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const circleRef = useRef<L.Circle | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current && mapContainerRef.current) {
      const map = L.map(mapContainerRef.current).setView([center.lat, center.lng], 8);
      mapRef.current = map;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);

      updateMarkersAndCircle();
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const formatHours = (hours: OperatingHours) => {
    return Object.entries(hours)
      .map(([day, time]) => `<div class="grid grid-cols-2 gap-2">
        <span class="capitalize">${day}:</span>
        <span>${time}</span>
      </div>`)
      .join('');
  };

  const formatServices = (services: string[]) => {
    return services && services.length > 0
      ? `<div class="mt-2">
          <strong class="block mb-1">Services:</strong>
          <ul class="list-disc list-inside">
            ${services.map(service => `<li>${service}</li>`).join('')}
          </ul>
        </div>`
      : '';
  };

  const updateMarkersAndCircle = () => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (circleRef.current) {
      circleRef.current.remove();
    }

    facilities.forEach((facility) => {
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            width: 25px;
            height: 25px;
            background-color: #C71585;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          "></div>
        `,
        iconSize: [25, 25],
        iconAnchor: [12.5, 12.5]
      });

      const marker = L.marker([Number(facility.latitude), Number(facility.longitude)], { icon })
        .bindPopup(`
          <div class="p-4 max-w-sm">
            <h3 class="font-bold text-lg mb-2">${facility.name}</h3>
            <p class="mb-2">${facility.address}<br>${facility.city}, ${facility.state} ${facility.zipCode}</p>

            <div class="mb-2">
              <strong>Phone:</strong> ${facility.phone}
              ${facility.website ? `<br><a href="${facility.website}" target="_blank" class="text-pink-600 hover:underline">Visit Website</a>` : ''}
            </div>

            ${facility.services ? formatServices(facility.services as string[]) : ''}

            <div class="mt-4">
              <strong class="block mb-1">Hours:</strong>
              ${facility.operatingHours ? formatHours(facility.operatingHours as OperatingHours) : 'Hours not available'}
            </div>

            ${facility.languages && Array.isArray(facility.languages) ? `
              <div class="mt-2">
                <strong>Languages:</strong> ${facility.languages.join(', ')}
              </div>
            ` : ''}

            ${facility.acceptsInsurance ? `
              <div class="mt-2">
                <strong>✓ Accepts Insurance</strong>
              </div>
            ` : ''}
          </div>
        `, {
          maxWidth: 400,
          className: 'facility-popup'
        })
        .addTo(map);

      markersRef.current.push(marker);
    });

    // Add radius circle
    circleRef.current = L.circle([center.lat, center.lng], {
      radius: radius * 1609.34, // Convert miles to meters
      color: '#C71585',
      fillColor: '#C71585',
      fillOpacity: 0.1,
      weight: 2
    }).addTo(map);

    map.setView([center.lat, center.lng]);
  };

  useEffect(() => {
    updateMarkersAndCircle();
  }, [facilities, radius, center]);

  return (
    <div className="w-full h-full">
      <div
        ref={mapContainerRef}
        className="w-full h-full"
      />
    </div>
  );
}