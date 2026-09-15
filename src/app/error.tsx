"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="wrap prose">
      <h1>This page stopped working.</h1>
      <p className="muted">Your files stayed on your device. Reload the page to start again.</p>
      <p>
        <button type="button" className="link-button" onClick={reset}>
          Try again
        </button>{" "}
        or <Link href="/">go to all tools</Link>.
      </p>
    </div>
  );
}
