import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ToolClient } from "@/tools/base/ToolClient";
import { CATEGORIES, findTool, TOOLS } from "@/tools/registry";

export const dynamicParams = false;

export function generateStaticParams() {
  return TOOLS.map((tool) => ({ tool: tool.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[tool]">): Promise<Metadata> {
  const tool = findTool((await params).tool);
  if (!tool) return {};
  return {
    title: tool.seo.title,
    description: tool.seo.description,
    alternates: { canonical: `/${tool.slug}` },
    openGraph: { title: tool.seo.title, description: tool.seo.description, url: `/${tool.slug}` },
  };
}

export default async function ToolPage({ params }: PageProps<"/[tool]">) {
  const tool = findTool((await params).tool);
  if (!tool) notFound();

  const category = CATEGORIES.find((entry) => entry.id === tool.category);
  const related = TOOLS.filter((entry) => entry.category === tool.category && entry.slug !== tool.slug);

  return (
    <div className="wrap tool-page">
      <header className="tool-head">
        <Link href="/#tools" className="crumb">
          All tools
        </Link>
        <h1>{tool.name}</h1>
        <p className="lede">{tool.description}</p>
      </header>

      <ToolClient slug={tool.slug} input={tool.input} zipName={tool.zipName} />

      <p className="device-note">Runs on your device. Your files are never uploaded.</p>

      {related.length > 0 && category && (
        <nav className="related" aria-label="Related tools">
          <h2>More {category.name.toLowerCase()} tools</h2>
          <ul>
            {related.map((entry) => (
              <li key={entry.slug}>
                <Link href={`/${entry.slug}`}>{entry.name}</Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
