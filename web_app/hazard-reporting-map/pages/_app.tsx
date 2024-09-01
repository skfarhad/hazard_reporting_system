import Navbar from '@/components/layouts/navbar';
import '@/styles/globals.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { AppProps } from 'next/app';
import { Poppins } from 'next/font/google';
const poppins = Poppins({
  weight: ['400', '600', '800', '900'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-poppins',
});
export default function App({ Component, pageProps }: AppProps) {
  return (
    <main className={`relative text-sm ${poppins.variable} font-poppins`}>
      <Navbar />
      <Component {...pageProps} />
    </main>
  );
}
