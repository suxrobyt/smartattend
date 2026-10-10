import { initials } from '@/lib/utils';

export default function Avatar({ name, size = 40, tone }: { name: string; size?: number; tone?: 'brand' | 'teacher' }) {
  const bg = tone === 'teacher' ? 'bg-gradient-to-br from-warn/80 to-bad/70 text-[#1b0f00]' : 'bg-gradient-to-br from-brand/80 to-brand-2/80 text-[#04101f]';
  return (
    <span
      className={'flex shrink-0 items-center justify-center rounded-full font-bold ' + bg}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(name) || '?'}
    </span>
  );
}
