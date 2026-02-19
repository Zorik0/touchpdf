export default function TermsPage() {
  return (
    <div className="page-container">
      <div style={{ maxWidth: 720, margin: '0 auto', paddingTop: 40 }}>
        <h1 className="section-title" style={{ fontSize: '2rem', marginBottom: 24 }}>Terms of Use</h1>
        <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.92rem' }}>
          <p style={{ marginBottom: 16 }}><strong>Last updated:</strong> February 19, 2026</p>

          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', margin: '28px 0 12px', fontWeight: 700 }}>1. Acceptance</h2>
          <p style={{ marginBottom: 16 }}>By using TouchPDF (&quot;touchpdf.space&quot;), you agree to these Terms. If you do not agree, do not use the service.</p>

          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', margin: '28px 0 12px', fontWeight: 700 }}>2. Service Description</h2>
          <p style={{ marginBottom: 16 }}>TouchPDF provides free, client-side PDF tools. All processing happens in your browser. We do not guarantee results for every PDF format or corrupt files.</p>

          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', margin: '28px 0 12px', fontWeight: 700 }}>3. No Warranty</h2>
          <p style={{ marginBottom: 16 }}>The service is provided &quot;as is&quot; without warranties of any kind. We are not responsible for any data loss, corruption, or issues arising from the use of this tool.</p>

          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', margin: '28px 0 12px', fontWeight: 700 }}>4. Acceptable Use</h2>
          <p style={{ marginBottom: 16 }}>You agree not to:</p>
          <ul style={{ paddingLeft: 24, marginBottom: 16 }}>
            <li>Use the service for illegal purposes</li>
            <li>Attempt to reverse-engineer or scrape the site</li>
            <li>Overload the service with automated requests</li>
          </ul>

          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', margin: '28px 0 12px', fontWeight: 700 }}>5. Intellectual Property</h2>
          <p style={{ marginBottom: 16 }}>TouchPDF and its logo are owned by the creator. You retain all rights to your own files. We never access, copy, or store your documents.</p>

          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', margin: '28px 0 12px', fontWeight: 700 }}>6. Limitation of Liability</h2>
          <p style={{ marginBottom: 16 }}>TouchPDF shall not be liable for any indirect, incidental, or consequential damages resulting from the use of the service.</p>

          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', margin: '28px 0 12px', fontWeight: 700 }}>7. Changes</h2>
          <p style={{ marginBottom: 16 }}>We may update these terms at any time. Continued use of the service constitutes acceptance of updated terms.</p>

          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', margin: '28px 0 12px', fontWeight: 700 }}>8. Contact</h2>
          <p style={{ marginBottom: 16 }}>For questions, contact: <strong>legal@touchpdf.space</strong></p>
        </div>
      </div>
    </div>
  );
}
