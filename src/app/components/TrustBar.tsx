import { Shield, Zap, CloudOff, Lock } from 'lucide-react';
import styles from '../Home.module.css';

export default function TrustBar() {
  return (
    <div className={styles.trustBar}>
      <div className={styles.trustItem}>
        <Shield size={16} className={styles.trustIcon} />
        <span>100% Client-Side</span>
      </div>
      <div className={styles.trustDivider}>•</div>
      <div className={styles.trustItem}>
        <CloudOff size={16} className={styles.trustIcon} />
        <span>No Uploads</span>
      </div>
      <div className={styles.trustDivider}>•</div>
      <div className={styles.trustItem}>
        <Lock size={16} className={styles.trustIcon} />
        <span>Private & Secure</span>
      </div>
      <div className={styles.trustDivider}>•</div>
      <div className={styles.trustItem}>
        <Zap size={16} className={styles.trustIcon} />
        <span>Instant Processing</span>
      </div>
    </div>
  );
}
