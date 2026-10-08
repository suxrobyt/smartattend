import AppHeader from '@/components/AppHeader';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <AppHeader home="/student/dashboard" />
      {children}
    </div>
  );
}
