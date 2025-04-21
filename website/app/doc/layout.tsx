import Nav from "../ui/nav";
import SideNav from "../ui/slidenav";
import Toc from "../ui/toc";

export default function MdxLayout({ children }: { children: React.ReactNode }) {
  // Create any shared layout or styles here
  return (
    <div>
      <Nav />
      <div className="container relative min-h-[calc(100vh-64px)] flex items-start gap-[4.5rem] md:gap-0 lg:gap-8">
        <SideNav />

        <main className="mdx-content prose px-2 sm:px-6 lg:pr-12 lg:pl-0 flex-1 min-w-0 lg:max-w-[66rem]">
          {children}
        </main>

        <Toc />
      </div>
    </div>
  );
}
