import { Html, Head, Main, NextScript } from "next/document";
import Link from "next/link";

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <nav className="bg-blue-600 text-white p-4 h-[8vh] z-100 flex items-center">
          <Link href="/" className="text-xl font-bold">
            Hazard Reporting 2024
          </Link>
          <ul className="flex space-x-6 ml-6">
            <li>
              <Link href="/incidents" className="hover:text-gray-300">
                Incidents
              </Link>
            </li>
            <li>
              <Link href="/volunteers" className="hover:text-gray-300">
                Volunteers
              </Link>
            </li>
          </ul>
        </nav>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
