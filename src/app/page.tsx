import Link from "next/link";
import { CATEGORIES, TOOLS } from "@/tools/registry";

export default function HomePage() {
  return (
    <div className="wrap">
      <section className="intro">
        <h1>Merge, split, compress and convert PDFs in your browser.</h1>
        <p className="lede">
          Free, with no sign-up and no watermarks. Every tool runs on your device, so your files are never uploaded.
        </p>
      </section>

      <section id="tools" className="index" aria-label="Tools">
        {CATEGORIES.map((category) => {
          const tools = TOOLS.filter((tool) => tool.category === category.id);
          if (tools.length === 0) return null;
          return (
            <div key={category.id} className="index-group">
              <h2>{category.name}</h2>
              <ul>
                {tools.map((tool) => (
                  <li key={tool.slug}>
                    <Link href={`/${tool.slug}`}>
                      <span className="tool-name">{tool.name}</span>
                      <span className="tool-summary">{tool.summary}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
        {TOOLS.length === 0 && <p className="muted">The tools are being rebuilt and will be back shortly.</p>}
      </section>
    </div>
  );
}
