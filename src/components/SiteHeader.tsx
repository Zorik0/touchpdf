import Link from "next/link";
import { Logo } from "./Logo";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="wrap header-row">
        <Link href="/" className="brand" aria-label="TouchPDF home">
          <Logo />
          <span>
            touch<b>pdf</b>
          </span>
        </Link>
        <nav className="header-nav" aria-label="Main">
          <Link href="/#tools">All tools</Link>
        </nav>
      </div>
    </header>
  );
}
