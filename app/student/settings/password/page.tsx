'use client';
import PasswordChangeForm from '@/components/PasswordChangeForm';
import { PageTitle } from '@/components/ui';
import { useLang } from '@/components/LanguageProvider';
export default function Page() {
  const { t } = useLang();
  return (
    <div>
      <PageTitle title={t('set.password')} subtitle={t('set.passwordDesc')} />
      <PasswordChangeForm />
    </div>
  );
}
