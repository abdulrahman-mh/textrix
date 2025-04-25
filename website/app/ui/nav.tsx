import Image from 'next/image';
import Link from 'next/link';

const Github = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

export default function Nav() {
  return (
    <header className="sticky top-0 translate-z-0 backdrop-saturate-180 z-40 backdrop-blur-sm bg-[rgba(255,255,255,0.8)]">
      <div className="container flex justify-between items-center h-[64px]">
        <div className="flex items-center gap-3">
          <div>
            <Link href="/">
              <Image src="/textrix-logo.png" width={150} height={32} alt="Textrix Logo" className="min-w-[120px]" />
            </Link>
          </div>
        </div>
        <div className="flex items-center h-full text-sm">
          {/* <div className="px-[10px]">💙 Support</div> */}
          {/* <div className="w-[1px] mx-[10px] bg-border h-5"></div> */}
          <Link href="/doc" className="hidden sm:flex px-[12px] h-full items-center hover:text-blue-500">
            Guide
          </Link>
          <a
            href="https://textrix-demo.vercel.app"
            target="_blank"
            rel="noreferrer noopener"
            className="external-link px-[12px] h-full text-sm flex items-center hover:text-blue-500"
          >
            Demo
          </a>
          <a
            className="external-link flex px-[12px] items-center gap-1 h-full hover:text-blue-500"
            target="_blank"
            rel="noreferrer noopener"
            href="https://github.com/abdulrahman-mh/textrix"
          >
            <Github width={16} height={16} />
            Github
          </a>
        </div>
      </div>
    </header>
  );
}
