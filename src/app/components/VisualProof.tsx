'use client';

import { FileText, MousePointer2 } from 'lucide-react';
import styles from '../Home.module.css';

export default function VisualProof() {
  return (
    <div className={styles.visualProof}>
      {/* Simulation of a Drag and Drop interface */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <div style={{
            display: 'flex',
            gap: '12px',
            background: 'rgba(255,255,255,0.05)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)'
        }}>
            {[1, 2, 3].map(i => (
                <div key={i} style={{
                    width: '60px',
                    height: '80px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    transform: i === 2 ? 'rotate(5deg) translateY(-5px)' : 'none',
                    boxShadow: i === 2 ? '0 10px 20px rgba(0,0,0,0.2)' : 'none',
                    border: i === 2 ? '1px solid var(--accent-1)' : '1px solid transparent'
                }}>
                    <FileText size={24} style={{ opacity: 0.5 }} />
                    <span style={{ position: 'absolute', bottom: 4, right: 4, fontSize: '10px', opacity: 0.5 }}>{i}</span>
                </div>
            ))}
        </div>
        
        {/* Cursor Animation */}
        <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            color: 'var(--accent-1)',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
        }}>
            <MousePointer2 size={24} fill="currentColor" />
        </div>
      </div>
      <div style={{ marginTop: '16px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
        <span style={{ color: 'var(--accent-1)', fontWeight: 600 }}>Drag & Drop</span> to reorder pages instantly.
      </div>
    </div>
  );
}
