import { icons } from '@/assets/icons';
import { cn } from '@/libs/utils';
import { Bell, Menu } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LiaMapMarkerAltSolid } from 'react-icons/lia';
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
      icon: <MdOutlineDashboard size={20} />,
      link: '/',
      isHidden: false,
    },

    {
      title: 'Incidents',
      icon: (
        <Image
          height={20}
          width={20}
          src={icons.IncidentIcon}
          alt="incident icon"
        />
      ),
      link: '/incidents',
      isHidden: false,
    },
    {
      title: 'Volunteers',
      icon: <Image height={20} width={20} src={icons.Users} alt="users icon" />,
      link: '/volunteers',
      isHidden: false,
    },
    {
      title: 'Analytics',
      icon: (
        <Image
          height={20}
          width={20}
          src={icons.Location}
          alt="Analytics icon"
        />
      ),
      link: '/location',
      isHidden: false,
    },
  ];
  return (
    <header className="sticky top-0 text-black shadow-sm shadow-gray z-[10]">
      <nav className="bg-secondary-background  text-card-foreground text-sm pt-3.5 md:pb-0 pb-2">
        <Container>
          <ul className="flex md:items-end  items-center justify-between ">
            <li className=" flex gap-4 items-center ">
              <Link href="/" className="text-xs md:text-base pb-0 md:pb-2">
                <span>Hazard Reporting system</span>
              </Link>
              {/* divider */}
              <div className="w-[2px] h-5 bg-gray hidden md:block"></div>

              {/* nav items */}
              <div className="md:flex gap-2 hidden ">
                {navItems.map((item, index) => {
                  if (item.isHidden) return null;
                  return (
                    <Link key={index + 1} href={item.link}>
                      <div
                        className={cn(
                          'flex gap-2 items-center py-2.5 rounded-t-md text-xs px-4',
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

            <div className="md:flex hidden gap-4 items-center pb-2">
              {/* notification */}
              <div className="relative ">
                <div className="absolute bg-destructive text-primary-background -top-3 -right-2.5 px-[5px] py-0 rounded-md text-[9px]">
                  <span>3</span>
                </div>
                <Bell size={16} />
              </div>
              {/* divider */}
              <div className="w-[2px] h-5 bg-gray"></div>
              {/* user avatar */}
              <div className="size-8  bg-zinc-300 rounded-full"></div>
            </div>
            {/* mobile view */}
            <div className="flex gap-2 items-center border border-gray shadow-sm px-2 py-1 rounded-full cursor-pointer md:hidden">
              {/* user avatar */}
              <div className="size-6  bg-zinc-300 rounded-full"></div>
              <div className="text-secondary">
                <Menu />
              </div>
            </div>
          </ul>
        </Container>
      </nav>
    </header>
  );
}
