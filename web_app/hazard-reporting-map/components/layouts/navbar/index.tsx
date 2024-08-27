import React from "react";
import Container from "../Container";
import Link from "next/link";
import { MdDashboard } from "react-icons/md";
import { IconType } from "react-icons";
import { FaMapMarker, FaUsers } from "react-icons/fa";
import { FaChartSimple, FaGear } from "react-icons/fa6";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const user = {
    name: "John Doe",
  };
  const navItems = [
    {
      title: "Dashboard",
      icon: <MdDashboard />,
      link: "/dashboard",
      isHidden: false,
    },
    {
      title: "Users",
      icon: <FaUsers />,
      link: "/",
      isHidden: false,
    },
    {
      title: "Settings",
      icon: <FaGear />,
      link: "/",
      isHidden: false,
    },
    {
      title: "Reports",
      icon: <FaChartSimple />,
      link: "/",
      isHidden: false,
    },
  ];
  return (
    <header>
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
                      className={cn("flex gap-2 items-center px-4  py-5 ", {
                        "border-b-4 border-primary text-primary font-semibold":
                          item.link === "/dashboard",
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
