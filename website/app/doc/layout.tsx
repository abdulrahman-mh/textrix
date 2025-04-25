import type { Metadata } from 'next';
import SideNav from '../ui/slidenav';
import Toc from '../ui/toc';
import Navigation from '../ui/navigation';

export const metadata: Metadata = {
  title: 'Textrix / Documentation',
  description: 'Textrix editor documentation',
};

export default function MdxLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container relative min-h-[calc(100vh-64px)] flex items-start gap-[4.5rem] md:gap-0 lg:gap-8">
      <SideNav />

      <main className="max-w-full mt-10 mb-[250px] px-2 sm:px-6 lg:pr-12 lg:pl-0 flex-1 min-w-0 lg:max-w-[66rem]">
        <article className="mdx-content prose prose-a:no-underline md:prose-md lg:prose-lg max-w-full">{children}</article>
        <Navigation />
      </main>

      <Toc />
    </div>
  );
}
