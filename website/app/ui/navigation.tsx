'use client';

import ArrowLeft from '../../public/arrow-left.svg';
import ArrowRight from '../../public/arrow-right.svg';
import { links } from './slidenav';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

type FlatLink = {
  title: string;
  href: string;
};

// Flatten all links + sublinks
const flatLinks: FlatLink[] = links.flatMap((link) => {
  const all: FlatLink[] = [{ title: link.name, href: link.href }];
  if (link.subLinks) {
    all.push(...link.subLinks.map((sub) => ({ title: sub.name, href: sub.href })));
  }
  return all;
});

export default function Navigation() {
  const pathname = usePathname();
  const [next, setNext] = useState<FlatLink | null>(null);
  const [prev, setPrev] = useState<FlatLink | null>(null);

  useEffect(() => {
    const currentIndex = flatLinks.findIndex((link) => link.href === pathname);
    if (currentIndex !== -1) {
      setPrev(flatLinks[currentIndex - 1] ?? null);
      setNext(flatLinks[currentIndex + 1] ?? null);
    } else {
      setPrev(null);
      setNext(null);
    }
  }, [pathname]);

  if (!next && !prev) return null;

  return (
    <div className="mt-16 w-full flex justify-between items-center">
      {prev && (
        <Link
          href={prev.href}
          aria-label={`Previous: ${prev.title}`}
          className="text-text-secondary hover:text-text-dark pl-7 pr-2 py-1"
        >
          <span className="text-[.8125rem] font-normal mb-0.5">Previous</span>
          <div className="flex items-center relative">
            <span className="absolute mt-0.5 left-[-26px] max-w-5">
              <ArrowLeft className="w-5 h-5" />
            </span>
            <span className="text-text-dark text-[1rem] font-medium">{prev.title}</span>
          </div>
        </Link>
      )}

      {next && (
        <Link
          href={next.href}
          aria-label={`Next: ${next.title}`}
          className="text-text-secondary hover:text-text-dark ml-auto pl-2 pr-7 py-1"
        >
          <span className="text-[.8125rem] font-normal mb-0.5">Next</span>
          <div className="flex items-center relative">
            <span className="text-text-dark text-[1rem] font-medium">{next.title}</span>
            <span className="absolute mt-0.5 right-[-26px] max-w-5">
              <ArrowRight className="w-5 h-5" />
            </span>
          </div>
        </Link>
      )}
    </div>
  );
}
