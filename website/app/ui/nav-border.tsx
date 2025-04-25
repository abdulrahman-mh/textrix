'use client';

import { usePathname } from 'next/navigation';
import clsx from 'clsx';

export default function NavBorder() {
  const pathname = usePathname();

  return (
    <div
      className={clsx(
        'fixed left-0 top-[60px] w-full h-[1px] z-50 transition-colors duration-300 bg-border-default',
        {
          'bg-transparent': pathname === '/',
        }
      )}
    ></div>
  );
}
