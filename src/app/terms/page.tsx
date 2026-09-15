import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "The terms for using TouchPDF.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <article className="wrap prose">
      <h1>Terms of use</h1>
      <p className="muted">Last updated September 15, 2026</p>

      <h2>Using TouchPDF</h2>
      <p>
        By using touchpdf.space you agree to these terms. If you don&apos;t agree, please don&apos;t use the site.
      </p>

      <h2>The service</h2>
      <p>
        TouchPDF provides free PDF tools that run in your browser. Some files, such as damaged or unusual PDFs, may
        not work, and we can&apos;t guarantee a result for every document.
      </p>

      <h2>No warranty</h2>
      <p>
        The service is provided as is, without warranties of any kind. Keep a copy of important files before you
        change them.
      </p>

      <h2>Acceptable use</h2>
      <ul>
        <li>Don&apos;t use TouchPDF for anything illegal.</li>
        <li>Only unlock or edit documents you have the right to change.</li>
        <li>Don&apos;t overload the site with automated requests.</li>
      </ul>

      <h2>Your content</h2>
      <p>You keep all rights to your files. We never receive, copy or store them.</p>

      <h2>Liability</h2>
      <p>
        TouchPDF isn&apos;t liable for indirect, incidental or consequential damages that result from using the
        service.
      </p>

      <h2>Changes</h2>
      <p>We may update these terms. Using the site after a change means you accept the updated terms.</p>

      <h2>Contact</h2>
      <p>
        Questions about these terms: <a href="mailto:legal@touchpdf.space">legal@touchpdf.space</a>
      </p>
    </article>
  );
}
