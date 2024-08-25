import "@/styles/globals.css";
import 'mapbox-gl/dist/mapbox-gl.css';
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
