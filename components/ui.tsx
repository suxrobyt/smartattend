import Icon, { IconName } from './Icon';

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-[26px] font-bold leading-tight tracking-tight">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="grid rounded-xl border border-line bg-surface p-1" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={
            'rounded-lg px-3 py-2 text-sm font-semibold transition ' +
            (value === o.value ? 'bg-surface-3 text-ink shadow-card' : 'text-muted hover:text-ink')
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Alert({ kind, children }: { kind: 'error' | 'success' | 'info'; children: React.ReactNode }) {
  const c =
    kind === 'error'
      ? 'border-bad/30 bg-bad/10 text-bad'
      : kind === 'success'
      ? 'border-ok/30 bg-ok/10 text-ok'
      : 'border-info/30 bg-info/10 text-info';
  return <div className={'rounded-xl border px-3.5 py-2.5 text-sm break-words ' + c}>{children}</div>;
}

export function Spinner({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-8 text-sm text-muted">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-brand" />
      {label}
    </div>
  );
}

export function Empty({ icon, text }: { icon: IconName; text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line px-6 py-10 text-center text-sm text-muted">
      <Icon name={icon} className="h-8 w-8 opacity-60" />
      {text}
    </div>
  );
}

export function IconTile({ name, tone = 'brand' }: { name: IconName; tone?: 'brand' | 'ok' | 'warn' | 'bad' | 'info' }) {
  const c = {
    brand: 'bg-brand/15 text-brand',
    ok: 'bg-ok/15 text-ok',
    warn: 'bg-warn/15 text-warn',
    bad: 'bg-bad/15 text-bad',
    info: 'bg-info/15 text-info',
  }[tone];
  return (
    <span className={'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ' + c}>
      <Icon name={name} className="h-5 w-5" />
    </span>
  );
}
