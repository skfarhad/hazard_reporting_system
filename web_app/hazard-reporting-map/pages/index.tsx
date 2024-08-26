import { Inter } from "next/font/google";
import { useEffect, useRef, useState } from 'react';
import mapboxgl, { LngLatLike } from 'mapbox-gl';
import { MarkerData } from "@/types/MarkerData";

import 'mapbox-gl/dist/mapbox-gl.css';

const inter = Inter({ subsets: ["latin"] });

const dummyMarkers : MarkerData[] = [
  {
      id: '1',
      coordinates: {lat: 23.555, lng: 90.76335},
      properties: {
      title: 'Marker 1',
      description: 'This is marker 1.',
      },
  },
  {
      id: '2',
      coordinates: {lat: 23.35454, lng: 90.54657},
      properties: {
      title: 'Marker 2',
      description: 'This is marker 2.',
      },
  },
  {
      id: '3',
      coordinates: {lat: 23.6543, lng: 90.4345456},
      properties: {
      title: 'Marker 3',
      description: 'This is marker 3.',
      },
  },
];


mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

export default function Home({ center = {lat: 23.4667, lng: 90.4354546}, zoom = 6 }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [markers, setMarkers] = useState<MarkerData[]>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || map) return; // initialize map only on client
    
    setMarkers(dummyMarkers);

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current!,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: center,
      zoom: zoom,
    });

    setMap(mapInstance);

    markers.forEach(marker => {
      const markerInstance = new mapboxgl.Marker({ element: createMarkerElement(marker.properties.icon) })
        .setLngLat(marker.coordinates)
        .addTo(mapInstance!);

      markerInstance.getElement().addEventListener('click', () => {
        new mapboxgl.Popup()
          .setLngLat(marker.coordinates)
          .setHTML(`<h3>${marker.properties.title}</h3><p>${marker.properties.description}</p>`)
          .addTo(mapInstance!);
      });
    });

    return () => mapInstance.remove();
  }, [isClient]);

  if (!isClient) {
    return null; // render nothing on server
  }

  const handleListItemClick = (coordinates: LngLatLike) => {
    if (map) {
      map.flyTo({
        center: coordinates,
        zoom: 10,
        essential: true, // ensures the animation occurs even if the user has reduced motion settings
      });
    }
  };

  const createMarkerElement = () => {
    const el = document.createElement('div');
    el.className = 'marker-icon';
    el.style.width = '25px';
    el.style.height = '25px';
    el.style.backgroundImage = `url(./alert.png)`;
    el.style.backgroundSize = 'contain';

    return el;
  };

  return (
    <main
      className={`flex flex-direction-column ${inter.className}`}
    >
      <div className="flex-grow">
        <div ref={mapContainer} style={{ width: '100%', height: '90vh' }} />
      </div>

      <div className="w-1/6 bg-gray-100 p-4 overflow-y-auto">
        <ul className="space-y-4">
          {markers.map(marker => (
            <li key={marker.id} className="bg-blue-300 p-4 shadow rounded-lg" 
            onClick={() => handleListItemClick(marker.coordinates)}>
              <h2 className="font-semibold">{marker.properties.title}</h2>
              <p>{marker.properties.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
