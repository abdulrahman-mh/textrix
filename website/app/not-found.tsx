import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="flex justify-center items-center flex-col min-h-screen">
      <h1 className="mb-4 text-2xl font-semibold tracking-tighter">404 - Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <div className="mt-8 flex items-center gap-6 text-lg">
        <Link href="/" className="underline hover:text-blue-500">
          Home
        </Link>
        <p>|</p>
        <Link href="/doc" className="underline hover:text-blue-500">
          Documentation
        </Link>
      </div>
    </section>
  );
}
