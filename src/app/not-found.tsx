import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap prose">
      <h1>That page doesn&apos;t exist.</h1>
      <p className="muted">It may have moved when TouchPDF was rebuilt.</p>
      <p>
        <Link href="/#tools">See all tools</Link>
      </p>
    </div>
  );
}
