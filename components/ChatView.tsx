'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fmtTime } from '@/lib/utils';
import { useLang } from './LanguageProvider';
import { useMe } from '@/components/MeProvider';
import { groupLabel } from '@/lib/schedule';
import Avatar from './Avatar';
import Icon from './Icon';
import { Alert, Segmented, Spinner } from './ui';

type Person = { user_id: string; full_name: string; role: string; username: string };
type Msg = { id: string; sender_id: string; recipient_id: string | null; body: string; created_at: string };

export default function ChatView() {
  const { t } = useLang();
  const { groupCode } = useMe();
  const [me, setMe] = useState<string | null>(null);
  const [group, setGroup] = useState<string | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [tab, setTab] = useState<'group' | 'private'>('group');
  const [peer, setPeer] = useState<Person | null>(null);
  const [q, setQ] = useState('');
  const [text, setText] = useState('');
  const [ready, setReady] = useState(false);
  const [notSetup, setNotSetup] = useState(false);
  const [err, setErr] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const loadMsgs = useCallback(async () => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('id, sender_id, recipient_id, body, created_at')
      .order('created_at', { ascending: false })
      .limit(300);
    if (error) {
      if (/chat_messages|relation|schema cache/i.test(error.message)) setNotSetup(true);
      return;
    }
    setMsgs(((data as Msg[]) || []).reverse());
  }, []);

  useEffect(() => {
    let ch: ReturnType<typeof supabase.channel> | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user.id;
      if (!uid) return;
      setMe(uid);
      const { data: ppl, error: e1 } = await supabase.rpc('chat_people');
      if (e1) {
        setNotSetup(true);
        setReady(true);
        return;
      }
      setPeople(((ppl as Person[]) || []).filter((p) => p.user_id !== uid));
      const { data: g } = await supabase.rpc('my_group_id');
      setGroup((g as string) || null);
      await loadMsgs();
      setReady(true);
      ch = supabase
        .channel('chat-' + uid)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, () => loadMsgs())
        .subscribe();
      timer = setInterval(loadMsgs, 6000);
    })();
    return () => {
      if (ch) supabase.removeChannel(ch);
      if (timer) clearInterval(timer);
    };
  }, [loadMsgs]);

  const visible = peer
    ? msgs.filter((m) => m.recipient_id && ((m.sender_id === me && m.recipient_id === peer.user_id) || (m.sender_id === peer.user_id && m.recipient_id === me)))
    : msgs.filter((m) => !m.recipient_id);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [visible.length, peer, tab]);

  const nameOf = (id: string) => people.find((p) => p.user_id === id)?.full_name || '';
  const roleOf = (id: string) => people.find((p) => p.user_id === id)?.role;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || !me || !group) return;
    setText('');
    setErr('');
    const { error } = await supabase.from('chat_messages').insert({
      group_id: group,
      sender_id: me,
      recipient_id: peer ? peer.user_id : null,
      body,
    });
    if (error) {
      setErr(t('chat.sendFailed'));
      setText(body);
    } else {
      loadMsgs();
    }
  }

  if (!ready) return <div className="px-4"><Spinner label={t('common.loading')} /></div>;
  if (notSetup) return <div className="p-4"><Alert kind="info">{t('chat.notSetup')}</Alert></div>;

  const inThread = tab === 'group' || peer;
  const f = q.trim().toLowerCase();
  const list = people.filter((p) => !f || p.full_name.toLowerCase().includes(f));
  const lastWith = (id: string) =>
    [...msgs].reverse().find((m) => m.recipient_id && (m.sender_id === id || m.recipient_id === id));

  return (
    <div className="chat-h flex flex-col">
      {!peer && (
        <div className="px-4 pb-2 pt-3">
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: 'group', label: t('chat.group') },
              { value: 'private', label: t('chat.private') },
            ]}
          />
        </div>
      )}

      {peer && (
        <div className="flex items-center gap-3 border-b border-line px-3 py-2.5">
          <button type="button" onClick={() => setPeer(null)} className="flex h-9 w-9 items-center justify-center rounded-xl text-brand hover:bg-white/5" aria-label={t('common.back')}>
            <Icon name="chevron-left" />
          </button>
          <Avatar name={peer.full_name} size={36} tone={peer.role === 'teacher' ? 'teacher' : 'brand'} />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold">{peer.full_name}</p>
            <p className="text-xs text-muted">{t('role.' + (peer.role === 'teacher' ? 'teacher' : 'student'))}</p>
          </div>
        </div>
      )}

      {tab === 'group' && !peer && (
        <div className="flex items-center gap-3 px-4 pb-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-2 text-[#04101f]">
            <Icon name="users" className="h-[18px] w-[18px]" />
          </span>
          <div>
            <p className="text-[15px] font-semibold leading-tight">{t('chat.groupName')}{groupCode ? ' · ' + groupLabel(groupCode) : ''}</p>
            <p className="text-xs text-muted">{t('chat.members', { n: people.length + 1 })}</p>
          </div>
        </div>
      )}

      {tab === 'private' && !peer ? (
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="relative mb-3">
            <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
            <input className="field pl-10" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('chat.search')} />
          </div>
          <div className="card divide-y divide-line overflow-hidden">
            {list.map((p) => {
              const last = lastWith(p.user_id);
              return (
                <button key={p.user_id} type="button" onClick={() => setPeer(p)} className="flex w-full items-center gap-3 px-3.5 py-3 text-left hover:bg-surface-2">
                  <Avatar name={p.full_name} tone={p.role === 'teacher' ? 'teacher' : 'brand'} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[15px] font-semibold">{p.full_name}</span>
                      {p.role === 'teacher' && <span className="chip !border-warn/30 !bg-warn/10 !py-0 !text-warn">{t('role.teacher')}</span>}
                    </span>
                    <span className="block truncate text-xs text-muted">{last ? (last.sender_id === me ? t('chat.you') + ': ' : '') + last.body : ' '}</span>
                  </span>
                </button>
              );
            })}
            {list.length === 0 && <p className="p-6 text-center text-sm text-muted">{t('chat.noPeople')}</p>}
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 space-y-1.5 overflow-y-auto px-4 py-3">
            {visible.length === 0 && <p className="py-10 text-center text-sm text-muted">{t('chat.empty')}</p>}
            {visible.map((m, i) => {
              const mine = m.sender_id === me;
              const prev = visible[i - 1];
              const showName = !peer && !mine && (!prev || prev.sender_id !== m.sender_id);
              return (
                <div key={m.id} className={'flex ' + (mine ? 'justify-end' : 'justify-start')}>
                  <div
                    className={
                      'max-w-[80%] rounded-2xl px-3.5 py-2 text-[15px] ' +
                      (mine ? 'rounded-br-md bg-brand text-[#04101f]' : 'rounded-bl-md border border-line bg-surface-2')
                    }
                  >
                    {showName && (
                      <p className={'mb-0.5 text-xs font-semibold ' + (roleOf(m.sender_id) === 'teacher' ? 'text-warn' : 'text-brand-2')}>
                        {nameOf(m.sender_id) || '…'}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <p className={'mt-0.5 text-right text-[10px] ' + (mine ? 'text-[#04101f]/60' : 'text-muted')}>{fmtTime(m.created_at)}</p>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
          {err && <div className="px-4 pb-2"><Alert kind="error">{err}</Alert></div>}
          <form onSubmit={send} className="flex items-end gap-2 border-t border-line bg-bg/80 px-3 py-2.5">
            <input
              className="field !rounded-full"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('chat.placeholder')}
              maxLength={2000}
              aria-label={t('chat.placeholder')}
            />
            <button className="btn-primary !h-11 !w-11 shrink-0 !rounded-full !p-0" disabled={!text.trim()} aria-label={t('chat.send')}>
              <Icon name="send" className="h-5 w-5" />
            </button>
          </form>
        </>
      )}
    </div>
  );
}
