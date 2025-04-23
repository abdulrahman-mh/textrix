import Image from 'next/image';
import Link from 'next/link';

export default function Nav() {
  return (
    <header
      className="sticky top-0 translate-z-0 backdrop-saturate-180 z-40 backdrop-blur-sm bg-[rgba(255,255,255,0.8)]"
      style={{ boxShadow: 'inset 0 -1px 0 0 #eaeaea' }}
    >
      <div className="container flex justify-between items-center h-[64px]">
        <div className="flex items-center gap-3">
          <div>
            <Link href="/">
              <Image src="/textrix.svg" width={150} height={32} alt="Textrix Logo" className="min-w-[120px]" />
            </Link>
          </div>
        </div>
        <div className="flex items-center mr-[100px] md:mr-0">
          {/* <div className="px-[10px]">💙 Support</div> */}
          {/* <div className="w-[1px] mx-[10px] bg-[var(--color-border)] h-5"></div> */}
          <a href="https://textrix-demo.vercel.app" className='px-[10px]'>Demo</a>
          <a className="flex px-[10px] items-center gap-1" href="https://github.com/abdulrahman-mh/textrix">
            <Image className="w-4 h-4" src="/github.svg" width={16} height={16} alt="Github" />
            Github
          </a>
        </div>
      </div>
    </header>
  );
}
