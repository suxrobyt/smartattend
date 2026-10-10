import type { SVGProps } from 'react';

export type IconName =
  | 'home' | 'calendar' | 'check-circle' | 'message' | 'settings' | 'users' | 'chart'
  | 'history' | 'clipboard' | 'eye' | 'eye-off' | 'logout' | 'key' | 'globe' | 'send'
  | 'chevron-right' | 'chevron-left' | 'user' | 'download' | 'copy' | 'check' | 'search' | 'pin';

const P: Record<IconName, JSX.Element> = {
  home: (<><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" /></>),
  calendar: (<><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M8 3v4M16 3v4M3.5 10h17" /></>),
  'check-circle': (<><circle cx="12" cy="12" r="9" /><path d="m8.5 12.5 2.5 2.5 4.5-5" /></>),
  message: <path d="M20.5 12a8 8 0 0 1-11.7 7.1L4 20.5l1.4-4.4A8 8 0 1 1 20.5 12Z" />,
  settings: (<><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></>),
  users: (<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20v-1A5.5 5.5 0 0 1 8 13.5h2a5.5 5.5 0 0 1 5.5 5.5v1" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14a5 5 0 0 1 3 4.5V20" /></>),
  chart: (<><path d="M5 20v-8M12 20V5M19 20v-5" /><path d="M3 20h18" /></>),
  history: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  clipboard: (<><rect x="5" y="4" width="14" height="17" rx="2.5" /><path d="M9 4h6v2.5H9zM9 12h6M9 16h4" /></>),
  eye: (<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>),
  'eye-off': (<><path d="M3 3l18 18" /><path d="M10.6 6.1A9.8 9.8 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.2 3.9M6.6 6.6A16 16 0 0 0 2 12s3.5 6 10 6c1.5 0 2.8-.3 4-.8" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>),
  logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
  key: (<><circle cx="8" cy="15" r="4" /><path d="m11 12 9-9M16 7l3 3" /></>),
  globe: (<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>),
  send: <path d="M22 2 11 13M22 2l-7 20-4-9-9-4Z" />,
  'chevron-right': <path d="m9 6 6 6-6 6" />,
  'chevron-left': <path d="m15 6-6 6 6 6" />,
  user: (<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>),
  download: <path d="M12 3v12m0 0-4-4m4 4 4-4M4 21h16" />,
  copy: (<><rect x="9" y="9" width="11" height="11" rx="2.5" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></>),
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  search: (<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>),
  pin: (<><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></>),
};

export default function Icon({
  name,
  className = 'h-5 w-5',
  ...rest
}: { name: IconName; className?: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {P[name]}
    </svg>
  );
}
