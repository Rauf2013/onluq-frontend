export const sellerLevel = (sales = 0) => {
  if (sales >= 50) return 'Süper Satıcı';
  if (sales >= 20) return 'Pro Satıcı';
  if (sales >= 5) return 'Onaylı Satıcı';
  return 'Yeni Satıcı';
};

export const levelColor = (level) => {
  switch (level) {
    case 'Süper Satıcı': return { bg: 'rgba(168, 85, 247, 0.12)', fg: '#a855f7' };
    case 'Pro Satıcı':   return { bg: 'rgba(16, 185, 129, 0.12)', fg: '#10b981' };
    case 'Onaylı Satıcı':return { bg: 'rgba(59, 130, 246, 0.12)', fg: '#3b82f6' };
    default:             return { bg: 'var(--bg-muted)',          fg: 'var(--text-tertiary)' };
  }
};

export const PACKAGE_TIERS = [
  { tier: 'bronze', label: 'Bronz',  color: '#b45309', bg: 'rgba(180, 83, 9, 0.10)' },
  { tier: 'silver', label: 'Gümüş',  color: '#475569', bg: 'rgba(71, 85, 105, 0.12)' },
  { tier: 'gold',   label: 'Qızıl',  color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
];
