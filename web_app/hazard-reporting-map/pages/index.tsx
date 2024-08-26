import { Inter } from "next/font/google";
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { dummyMarkers, MarkerData } from "@/utlity/markers";
import 'mapbox-gl/dist/mapbox-gl.css';

const inter = Inter({ subsets: ["latin"] });

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

export default function Home({ center = {lat: 23.4667, lng: 90.4354546}, zoom = 6 }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [markers, setMarkers] = useState<MarkerData[]>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || map.current) return; // initialize map only on client
    
    setMarkers(dummyMarkers);

    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: center,
      zoom: zoom,
    });

    markers.forEach(marker => {
      const markerInstance = new mapboxgl.Marker({ element: createMarkerElement(marker.properties.icon) })
        .setLngLat(marker.coordinates)
        .addTo(map.current!);

      markerInstance.getElement().addEventListener('click', () => {
        new mapboxgl.Popup()
          .setLngLat(marker.coordinates)
          .setHTML(`<h3>${marker.properties.title}</h3><p>${marker.properties.description}</p>`)
          .addTo(map.current!);
      });
    });

    return () => map.current?.remove();
  }, [isClient]);

  if (!isClient) {
    return null; // render nothing on server
  }

  const createMarkerElement = (iconName: string) => {
    const el = document.createElement('div');
    el.className = 'marker-icon';
    el.style.width = '30px';
    el.style.height = '30px';
    el.style.backgroundImage = `url(https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png)`;
    el.style.backgroundSize = 'contain';

    return el;
  };

  return (
    <main
      className={`flex flex-direction-column ${inter.className}`}
    >
      <div className="w-1/6 bg-gray-100 p-4 overflow-y-auto">
        <ul className="space-y-4">
          {markers.map(marker => (
            <li key={marker.id} className="bg-blue-300 p-4 shadow rounded-lg">
              <h2 className="font-semibold">{marker.properties.title}</h2>
              <p>{marker.properties.description}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex-grow">
        <div ref={mapContainer} style={{ width: '100%', height: '100vh' }} />
      </div>
    </main>
  );
}
