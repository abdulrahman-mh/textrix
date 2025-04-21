import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode, { type Options } from "rehype-pretty-code";
import moonlightTheme from "./app/ui/textrix-code-light-theme.json";

const nextConfig: NextConfig = {
  // Configure `pageExtensions` to include markdown and MDX files
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  // Optionally, add any other Next.js config below
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },
};

const rehypePrettyCodeOptions: Options = {
  keepBackground: false,
  theme: moonlightTheme as any,
};

const withMDX = createMDX({
  // Add markdown plugins here, as desired
  options: {
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: "wrap",
          properties: {
            className: "linked-heading",
          },
        },
      ],
      [rehypePrettyCode, rehypePrettyCodeOptions],
    ],
  },
});
export default withMDX(nextConfig);
