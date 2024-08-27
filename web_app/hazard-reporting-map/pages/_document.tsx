import Navbar from "@/components/layouts/navbar";
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        {/* <nav className="bg-blue-600 text-white p-4 h-[8vh] z-100 flex items-center">
          <h1 className="text-xl font-bold">Hazard Reporting 2024</h1>
        </nav> */}

        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
