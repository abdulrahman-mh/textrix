import Link from 'next/link';

const whyTextrixCards = [
  {
    icon: '🧩',
    title: 'Built-in Features',
    text: 'Choose from a wide range of features like text formatting, media embeds, emoji picker, code blocks, and more. Use only what you need.',
  },
  {
    icon: '📤',
    title: 'Easy Publishing',
    text: 'Turn your content into clean, SEO-friendly HTML with one click. Generate it right from the editor or from your backend.',
    className: 'lg:mt-8',
  },
  {
    icon: '🎨',
    title: 'Simple Theming',
    text: 'Textrix uses CSS themes. Start with the built-in theme, or switch to others as they become available. Easy to use and easy to style.',
  },
  {
    icon: '🔗',
    title: 'Use It Anywhere',
    text: 'Textrix works with any framework including React, Vue, Svelte, or even plain JavaScript. Add it to any project with no extra setup.',
    className: 'lg:mt-8',
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-[1360px] px-4">
      <div className="pt-[84px] pb-[64px] flex flex-col lg:flex-row items-center lg:items-start">
        <div className="text-center lg:text-left lg:w-fit lg:max-w-[500px]">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl whitespace-pre-wrap tracking-[-0.4px] text-text-dark font-bold">
            Your Powerful Rich Text Editor
          </h1>
          <p className="mt-2 w-fit text-text-secondary font-medium text-lg sm:text-[20px] lg:text-2xl">
            Publishing, Blogs, Newsletters, Magazine, Writing Platforms, Real time Collaboration, Themes, Features, and more.
          </p>
          <div className="mt-[50px]">
            <Link
              href="/doc"
              className="bg-[#0582ff] mr-3 hover:bg-[#045ac3] active:bg-[#045ac3] text-white rounded-[20px] px-5 py-2 text-sm font-semibold"
            >
              Get Started
            </Link>
            <Link
              href="https://github.com/abdulrahman-mh/textrix"
              target="_blank"
              rel="noreferrer noopener"
              className="bg-[#ebf5fe] hover:bg-[#d6e1f5] active:bg-[#d6e1f5] text-[#087fe7] rounded-[20px] px-5 py-2 text-sm font-semibold"
            >
              View on Github
            </Link>
          </div>
        </div>

        <div className="flex-1 relative">
          <img src="/preview-full.png" alt="Textrix Preview" className="w-full h-auto mt-[50px] lg:mt-[-50px]" />
          <div className="preview-gradient"></div>
        </div>
      </div>
      <div className="mt-12 mb-[200px] flex flex-col items-center lg:items-start gap-10 lg:flex-row-reverse lg:gap-10">
        <div className="flex-1 max-w-4xl text-center lg:text-left mb-5 lg:mb-0 lg:mt-22">
          <h2 className="text-3xl font-bold mb-4">Why Choose Textrix?</h2>
          <p className="text-2xl text-text-secondary lg:max-w-[450px]">
            Textrix is built to be flexible, powerful, and easy to use. Whether you&apos;re building a blog, a custom editor, or a full publishing tool,
            Textrix has what you need.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-x-8 lg:gap-y-0 sm:[&>*]:w-[284px] sm:[&>*]:h-[258px] [&>*]:w-full">
          {whyTextrixCards.map(({ icon, title, text, className = '' }, idx) => (
            <div key={idx} className={`p-6 sm:p-8 rounded-2xl bg-gray-200 ${className}`}>
              <div className="flex items-center justify-center w-12 h-12 text-2xl bg-button-secondary-hover rounded-md pointer-events-none">
                {icon}
              </div>
              <h3 className="mt-5 mb-1 text-lg font-normal">{title}</h3>
              <p className="text-sm leading-[21px] text-text-secondary">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
