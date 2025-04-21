"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { ReactNode, useEffect, useRef, useState } from "react";
import Image from "next/image";

import GettingStartedIcon from "../../public/getting-started.svg";
import TutorialIcon from "../../public/tutorial.svg";
import FeaturesIcon from "../../public/modules-color.svg";
import MediaIcon from "../../public/image-plus.svg";
import UnsplashIcon from "../../public/unsplash.filled.svg";
import CodeBlockIcon from "../../public/code-arrow.svg";
import BubbleMenuIcon from "../../public/bubble.svg";
import FloatingMenuIcon from "../../public/plus-circle.svg";

const links = [
  {
    name: "Getting Started",
    href: "/doc/getting-started",
    icon: GettingStartedIcon,
  },
  { name: "Tutorial", href: "/doc/tutorial", icon: TutorialIcon },
  {
    name: "Textrix/features",
    href: "/doc/features",
    icon: FeaturesIcon,
    subLinks: [
      { name: "Media", href: "/doc/media", icon: MediaIcon },
      { name: "Bubble Menu", href: "/doc/bubble-menu", icon: BubbleMenuIcon },
      {
        name: "Floating Menu",
        href: "/doc/floating-menu",
        icon: FloatingMenuIcon,
      },
      { name: "Code Block", href: "/doc/code-block", icon: CodeBlockIcon },
      { name: "Unsplash", href: "/doc/unsplash", icon: UnsplashIcon },
    ],
  },
];

function LinkItem({
  pathname,
  href,
  className,
  Icon,
  name,
  width = 28,
}: {
  children?: ReactNode[];
  pathname: string;
  href: string;
  className?: string;
  Icon: any;
  width?: number;
  name: string;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "flex w-full items-center gap-2 text-sm font-normal hover:text-blue-400",
        className,
        {
          "text-blue-600": href === pathname,
          "text-gray-900": href !== pathname,
        }
      )}
    >
      <Icon width={width} height={width} />
      <p>{name}</p>
    </Link>
  );
}

export default function SideNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const toggleMenu = () => setIsOpen(!isOpen);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      setTimeout(() => {
        if (
          menuRef.current &&
          !menuRef.current.contains(event.target as Node) &&
          buttonRef.current &&
          !buttonRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      }, 0);
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* Desktop */}
      <div className="hidden space-y-2 md:block flex-none sticky top-[126px] w-[190px] lg:w-[224px] h-[calc(100vh-126px)] overflow-auto overscroll-contain">
        {links.map((link) => {
          const hasSubLinks = link.subLinks && link.subLinks.length > 0;
          return (
            <div
              key={link.href}
              className={clsx({ "mt-3": !!link.subLinks })}
            >
              <LinkItem
                href={link.href}
                Icon={link.icon}
                name={link.name}
                pathname={pathname}
              />
              {link.subLinks && (
                <div className="mt-2 ml-8 space-y-3">
                  {link.subLinks.map((link) => (
                    <LinkItem
                      key={link.href}
                      href={link.href}
                      Icon={link.icon}
                      name={link.name}
                      pathname={pathname}
                      width={24}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button
        ref={buttonRef}
        onClick={toggleMenu}
        className="md:hidden cursor-pointer absolute -top-8 -translate-y-1/2 right-4 z-50 p-2 bg-transparent transition-colors duration-100 text-black hover:bg-gray-200 rounded"
      >
        <Image src="/nav-menu.svg" width={24} height={24} alt="Open nav menu" />
      </button>

      {/* Mobile */}
      <div
        ref={menuRef}
        className={clsx(
          "absolute top-0 right-4 mt-2 max-w-[320px] w-full transition-all duration-300 ease-out z-40 md:hidden",
          isOpen
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-8 pointer-events-none"
        )}
      >
        <div className="px-4 py-8 rounded bg-[rgb(245,244,244)] shadow-md h-full pointer-events-auto">
          <ul className="space-y-2">
            {links.map((link) => (
              <li key={link.href}>
                <Link className="hover:text-blue-400" href={link.href}>
                  {link.name}
                </Link>
                {link.subLinks && (
                  <ul className="ml-4 space-y-1">
                    {link.subLinks.map((link) => (
                      <li key={link.href}>
                        <Link className="hover:text-blue-400" href={link.href}>
                          {link.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
