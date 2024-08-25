import { Inter } from "next/font/google";
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

const inter = Inter({ subsets: ["latin"] });

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

export default function Home({ center = {lat: 23.4667, lng: 90.4354546}, zoom = 9 }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || map.current) return; // initialize map only on client

    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: center,
      zoom: zoom,
    });

    return () => map.current?.remove();
  }, [isClient]);

  if (!isClient) {
    return null; // render nothing on server
  }

  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between ${inter.className}`}
    >
      <div ref={mapContainer} style={{ width: '100%', height: '100vh' }} />
    </main>
  );
}
