import React from 'react';
import Container from '../Container';
import Link from 'next/link';
import { FaMapMarker } from 'react-icons/fa';
import { cn } from '@/lib/utils';
import { LuFlagTriangleRight, LuUser2 } from 'react-icons/lu';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const user = {
    name: 'John Doe',
  };
  const navItems = [
    {
      title: 'Volunteers',
      icon: <LuUser2 />,
      link: '/volunteers',
      isHidden: false,
    },
    {
      title: 'Incidents',
      icon: <LuFlagTriangleRight />,
      link: '/incidents',
      isHidden: false,
    },
  ];
  return (
    <header className="sticky top-0">
      <nav className="bg-card  text-card-foreground text-sm">
        <Container>
          <ul className="flex items-center justify-between">
            <li>
              <Link href="/">
                <div className="text-primary">
                  <FaMapMarker size={30} />
                </div>
              </Link>
            </li>
            {/* nav items */}
            <div className="flex gap-2">
              {navItems.map((item, index) => {
                if (item.isHidden) return null;
                return (
                  <Link key={index + 1} href={item.link}>
                    <div
                      className={cn('flex gap-2 items-center px-4  py-5 ', {
                        'border-b-4 border-primary text-primary font-semibold':
                          item.link === pathname,
                      })}
                    >
                      {item.icon} {item.title}
                    </div>
                  </Link>
                );
              })}
            </div>
            {/* user avatar */}
            <div className="flex gap-2 items-center">
              <span>{user.name},</span>
              <div className="size-10  bg-zinc-100 rounded-full"></div>
            </div>
          </ul>
        </Container>
      </nav>
    </header>
  );
}
