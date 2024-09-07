import Navbar from '@/components/layouts/navbar';
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body className={`font-poppins`}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
