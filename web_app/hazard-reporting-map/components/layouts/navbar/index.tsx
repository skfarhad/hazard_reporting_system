import { cn } from '@/lib/utils';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LiaMapMarkerAltSolid } from 'react-icons/lia';
import { LuFlagTriangleRight, LuUsers2 } from 'react-icons/lu';
import { MdOutlineDashboard } from 'react-icons/md';
import Container from '../Container';

export default function Navbar() {
  const pathname = usePathname();
  const user = {
    name: 'John Doe',
  };
  const navItems = [
    {
      title: 'Dashboard',
      icon: <MdOutlineDashboard />,
      link: '/',
      isHidden: false,
    },
    {
      title: 'Volunteers',
      icon: <LuUsers2 />,
      link: '/volunteers',
      isHidden: false,
    },
    {
      title: 'Incidents',
      icon: <LuFlagTriangleRight />,
      link: '/incidents',
      isHidden: false,
    },
    {
      title: 'Location',
      icon: <LiaMapMarkerAltSolid />,
      link: '/location',
      isHidden: false,
    },
  ];
  return (
    <header className="sticky top-0 text-black shadow-sm shadow-gray">
      <nav className="bg-secondary-background  text-card-foreground text-sm pt-2">
        <Container>
          <ul className="flex items-end justify-between ">
            <li className=" flex gap-4 items-center ">
              <Link href="/" className=" text-base pb-2">
                <span>Hazard Reporting system</span>
              </Link>
              {/* divider */}
              <div className="w-[2px] h-5 bg-gray"></div>

              {/* nav items */}
              <div className="flex gap-2">
                {navItems.map((item, index) => {
                  if (item.isHidden) return null;
                  return (
                    <Link key={index + 1} href={item.link}>
                      <div
                        className={cn(
                          'flex gap-2 items-center py-2 rounded-t-md text-xs px-4',
                          {
                            'bg-gray text-zinc-800 border-b-[3px] border-secondary font-semibold':
                              item.link === pathname,
                          }
                        )}
                      >
                        <span className="text-secondary">{item.icon}</span>{' '}
                        {item.title}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </li>

            {/* user avatar */}
            <div className="flex gap-4 items-center pb-2">
              <div>
                <Bell size={16} />
              </div>
              {/* divider */}
              <div className="w-[2px] h-5 bg-gray"></div>
              <div className="size-8  bg-zinc-300 rounded-full"></div>
            </div>
          </ul>
        </Container>
      </nav>
    </header>
  );
}
