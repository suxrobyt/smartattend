'use client';
import { useState } from 'react';
import PasswordChangeForm from '@/components/PasswordChangeForm';
import StudentPasswords from '@/components/StudentPasswords';
import { PageTitle, Segmented, Spinner } from '@/components/ui';
import { useLang } from '@/components/LanguageProvider';
import { useMe } from '@/components/MeProvider';
import { isHead } from '@/lib/teacher';

export default function Page() {
  const { t } = useLang();
  const { me } = useMe();
  const [tab, setTab] = useState<'mine' | 'students'>('mine');
  if (me === undefined) return <Spinner label={t('common.loading')} />;

  // Subject teachers can change only their own password
  if (!isHead(me?.row)) {
    return (
      <div className="space-y-4">
        <PageTitle title={t('set.password')} subtitle={t('set.passwordDesc')} />
        <PasswordChangeForm />
      </div>
    );
  }

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
