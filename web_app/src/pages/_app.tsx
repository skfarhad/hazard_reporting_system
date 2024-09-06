import Navbar from '@/components/layouts/navbar';
import '@/styles/globals.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <style jsx global>{`
        html {
          font-family: ${inter.style.fontFamily};
        }
      `}</style>
      <main className={`relative text-sm ${inter.className} font-poppins`}>
        <Toaster position="top-right" />
        <Navbar />
        <Component {...pageProps} />
      </main>
    </>
  );
}
