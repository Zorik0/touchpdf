import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How TouchPDF handles your files and data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <article className="wrap prose">
      <h1>Privacy policy</h1>
      <p className="muted">Last updated September 15, 2026</p>

      <h2>Your files</h2>
      <p>
        Every TouchPDF tool runs in your browser. Files you open are read and processed on your device, and they are
        never uploaded to us or anyone else. When you close the tab, they&apos;re gone.
      </p>

      <h2>What we collect</h2>
      <p>
        There are no accounts and we don&apos;t collect personal information. Our hosting provider, Vercel, keeps
        standard request logs such as IP address, browser and the page requested, to run and protect the site.
      </p>

      <h2>Cookies and ads</h2>
      <p>
        TouchPDF shows ads from Google AdSense. Google may use cookies to show and measure ads, including ads based on
        your interests. You can change this in{" "}
        <a href="https://adssettings.google.com">Google&apos;s ad settings</a> and read how Google uses data in its{" "}
        <a href="https://policies.google.com/technologies/ads">advertising policy</a>.
      </p>

      <h2>Children</h2>
      <p>TouchPDF isn&apos;t directed at children under 13, and we don&apos;t knowingly collect their information.</p>

      <h2>Contact</h2>
      <p>
        Questions about this policy: <a href="mailto:privacy@touchpdf.space">privacy@touchpdf.space</a>
      </p>
    </article>
  );
}
