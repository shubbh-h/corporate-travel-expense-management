const paths = {
  grid: 'M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z',
  plane: 'M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5L21 16Z',
  receipt: 'M6 2h12a2 2 0 0 1 2 2v18l-3-2-3 2-3-2-3 2-3-2-3 2V4a2 2 0 0 1 2-2Zm2 5h8M8 11h8M8 15h5',
  check: 'm5 12 4 4L19 6',
  chart: 'M4 19V5m0 14h16M8 16v-5m4 5V7m4 9v-8',
  users: 'M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm9 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  settings: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm8-3.5-2.1-.8a6.9 6.9 0 0 0-.6-1.45l.9-2.05-1.9-1.9-2.05.9a6.9 6.9 0 0 0-1.45-.6L12 4h-2l-.8 2.1a6.9 6.9 0 0 0-1.45.6l-2.05-.9-1.9 1.9.9 2.05a6.9 6.9 0 0 0-.6 1.45L2 12v2l2.1.8c.15.5.35.99.6 1.45l-.9 2.05 1.9 1.9 2.05-.9c.46.25.95.45 1.45.6L10 22h2l.8-2.1c.5-.15.99-.35 1.45-.6l2.05.9 1.9-1.9-.9-2.05c.25-.46.45-.95.6-1.45L20 14v-2Z',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4',
  search: 'm21 21-4.35-4.35m2.35-5.15a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  chevron: 'm6 9 6 6 6-6',
  logout: 'M10 17l5-5-5-5m5 5H3m12-8h3a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-3',
  menu: 'M4 6h16M4 12h16M4 18h16',
  close: 'm6 6 12 12M18 6 6 18',
  lock: 'M7 10V7a5 5 0 0 1 10 0v3m-11 0h12v10H6V10Z',
  eye: 'M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  eyeOff: 'm3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 4.2A10.8 10.8 0 0 1 12 4c6.5 0 10 8 10 8a18.7 18.7 0 0 1-3.1 4.1M6.1 6.1C3.5 8 2 12 2 12s3.5 8 10 8a10.8 10.8 0 0 0 3.1-.45',
  plus: 'M12 5v14M5 12h14',
  download: 'M12 3v12m0 0 4-4m-4 4-4-4M5 21h14',
  filter: 'M4 5h16M7 12h10m-7 7h4',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  calendar: 'M6 3v3m12-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',
  wallet: 'M4 6h16v13H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14v4H4a2 2 0 0 0 0 4h16',
  user: 'M20 21a8 8 0 0 0-16 0m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z',
  info: 'M12 16v-4m0-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
};

export default function Icon({ name, size = 18, strokeWidth = 1.8, className = '' }) {
  const d = paths[name];
  if (!d) return null;
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
