'use client';
import { useState } from 'react';
import PasswordChangeForm from '@/components/PasswordChangeForm';
import StudentPasswords from '@/components/StudentPasswords';
import { PageTitle, Segmented } from '@/components/ui';
import { useLang } from '@/components/LanguageProvider';

export default function Page() {
  const { t } = useLang();
  const [tab, setTab] = useState<'mine' | 'students'>('mine');
  return (
    <div className="space-y-4">
      <PageTitle title={t('set.passwords')} subtitle={t('set.passwordsDesc')} />
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'mine', label: t('pw.mine') },
          { value: 'students', label: t('pw.students') },
        ]}
      />
      {tab === 'mine' ? <PasswordChangeForm /> : <StudentPasswords />}
    </div>
  );
}
