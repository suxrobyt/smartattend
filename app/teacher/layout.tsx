import AppHeader from '@/components/AppHeader';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <AppHeader home="/teacher/dashboard" />
      {children}
    </div>
  );
}
