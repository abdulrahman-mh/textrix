"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";

interface Anchor {
  title: string | null;
  id: string;
}

export default function Toc() {
  const pathname = usePathname();
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;

    const headings = Array.from(
      main.querySelectorAll("h2[id]")
    ) as HTMLElement[];

    const localAnchors: Anchor[] = headings.map((el) => ({
      title: el.textContent,
      id: el.id,
    }));

    setAnchors(localAnchors);

    const handleScroll = () => {
      const offset = 150;
      let current: string | null = null;

      for (const el of headings) {
        const top = el.getBoundingClientRect().top + window.scrollY;
        if (window.scrollY + offset >= top) {
          current = el.id;
        } else {
          break;
        }
      }

      setActiveId(current);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  if (!anchors.length) return null;

  return (
    <aside className="hidden xl:block flex-none sticky top-[126px] w-[224px] h-[calc(100vh-126px)] overflow-auto overscroll-contain">
      <nav>
        <h4 className="text-gray-1000 mb-1 mt-[7px] text-sm font-medium">
          On this page
        </h4>
        <ul className="overflow-hidden py-2" data-doc-toc>
          {anchors.map(({ id, title }) => (
            <li key={id}>
              <Link
                href={`#${id}`}
                className={clsx(
                  "hover:text-gray-900 block leading-[1.6] text-sm text-gray-500",
                  {
                    "text-geist-link font-medium text-gray-600": id === activeId,
                  }
                )}
                aria-current={id === activeId ? "location" : undefined}
              >
                {title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
