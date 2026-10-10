'use client';
import LanguagePicker from '@/components/LanguagePicker';
import { PageTitle } from '@/components/ui';
import { useLang } from '@/components/LanguageProvider';
export default function Page() {
  const { t } = useLang();
  return (
    <div>
      <PageTitle title={t('set.language')} subtitle={t('set.languageDesc')} />
      <LanguagePicker />
    </div>
  );
}
