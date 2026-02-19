export default function PrivacyPage() {
  return (
    <div className="page-container">
      <div style={{ maxWidth: 720, margin: '0 auto', paddingTop: 40 }}>
        <h1 className="section-title" style={{ fontSize: '2rem', marginBottom: 24 }}>Privacy Policy</h1>
        <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.92rem' }}>
          <p style={{ marginBottom: 16 }}><strong>Last updated:</strong> February 19, 2026</p>

          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', margin: '28px 0 12px', fontWeight: 700 }}>1. No File Uploads</h2>
          <p style={{ marginBottom: 16 }}>TouchPDF processes all files entirely within your browser. <strong>No files are uploaded to any server.</strong> Your documents never leave your device. We do not store, access, or transmit any of your files.</p>

          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', margin: '28px 0 12px', fontWeight: 700 }}>2. Data We Collect</h2>
          <p style={{ marginBottom: 16 }}>We do not collect personal data. We may use anonymized analytics (e.g., Google Analytics) to understand traffic patterns. This data includes:</p>
          <ul style={{ paddingLeft: 24, marginBottom: 16 }}>
            <li>Pages visited</li>
            <li>Browser type and device category</li>
            <li>Country-level location (no precise geolocation)</li>
          </ul>

          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', margin: '28px 0 12px', fontWeight: 700 }}>3. Cookies</h2>
          <p style={{ marginBottom: 16 }}>We use cookies only for analytics and advertising (Google AdSense). You can disable cookies in your browser settings at any time.</p>

          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', margin: '28px 0 12px', fontWeight: 700 }}>4. Third-Party Services</h2>
          <ul style={{ paddingLeft: 24, marginBottom: 16 }}>
            <li><strong>Google AdSense:</strong> Displays advertisements. Google may use cookies to personalize ads. <a href="https://policies.google.com/privacy" style={{ color: 'var(--accent-1)' }} target="_blank" rel="noopener noreferrer">Google&apos;s Privacy Policy</a></li>
            <li><strong>Vercel:</strong> Hosts this website. <a href="https://vercel.com/legal/privacy-policy" style={{ color: 'var(--accent-1)' }} target="_blank" rel="noopener noreferrer">Vercel&apos;s Privacy Policy</a></li>
          </ul>

          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', margin: '28px 0 12px', fontWeight: 700 }}>5. Children&apos;s Privacy</h2>
          <p style={{ marginBottom: 16 }}>TouchPDF is not directed at children under 13. We do not knowingly collect personal information from children.</p>

          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', margin: '28px 0 12px', fontWeight: 700 }}>6. Contact</h2>
          <p style={{ marginBottom: 16 }}>For questions about this policy, contact us at: <strong>privacy@touchpdf.space</strong></p>
        </div>
      </div>
    </div>
  );
}
