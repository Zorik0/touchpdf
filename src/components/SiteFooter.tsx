import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-row">
        <p>Made for my wife. Everyone else is welcome too.</p>
        <nav className="footer-links" aria-label="Footer">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <a href="https://github.com/Zorik0/touchpdf">Source code</a>
        </nav>
      </div>
    </footer>
  );
}
