import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex w-full min-h-screen items-center justify-center">
      <h1 className="text-3xl font-medium">Textrix</h1>
      <p className="mx-8">|</p>
      <Link href="/doc" className="hover:text-amber-400">
        <p>Documentation</p>
      </Link>
    </div>
  );
}
