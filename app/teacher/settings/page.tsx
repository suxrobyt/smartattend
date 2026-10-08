'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { randomPassword } from '@/lib/utils';

type StudentRow = {
  id: string;
  full_name: string;
  username: string;
  user_id: string | null;
};

export default function SettingsPage() {
  // ----- own password -----
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [ownMsg, setOwnMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [ownBusy, setOwnBusy] = useState(false);

  // ----- students -----
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [pw, setPw] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [result, setResult] = useState<{ id: string; ok: boolean; text: string } | null>(null);

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    const { data } = await supabase
      .from('students')
      .select('id, full_name, username, user_id')
      .order('full_name');
    setStudents((data as StudentRow[]) || []);
  }

  async function changeOwn(e: React.FormEvent) {
    e.preventDefault();
    setOwnMsg(null);
    if (next.length < 8) {
      setOwnMsg({ ok: false, text: "Yangi parol kamida 8 ta belgidan iborat bo'lsin" });
      return;
    }
    if (next !== again) {
      setOwnMsg({ ok: false, text: 'Yangi parollar bir xil emas' });
      return;
    }
    setOwnBusy(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      setOwnBusy(false);
      setOwnMsg({ ok: false, text: 'Qaytadan kiring' });
      return;
    }
    // Check the current password first
    const { error: checkError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current,
    });
    if (checkError) {
      setOwnBusy(false);
      setOwnMsg({ ok: false, text: "Hozirgi parol noto'g'ri" });
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: next });
    setOwnBusy(false);
    if (error) {
      setOwnMsg({ ok: false, text: error.message });
      return;
    }
    setCurrent('');
    setNext('');
    setAgain('');
    setOwnMsg({ ok: true, text: "Parol o'zgartirildi" });
  }

  async function saveStudent(s: StudentRow) {
    setResult(null);
    if (pw.length < 8) {
      setResult({ id: s.id, ok: false, text: 'Parol kamida 8 ta belgi bo\'lsin' });
      return;
    }
    setBusyId(s.id);
    try {
      const res = await fetch('/api/students/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: s.id, new_password: pw }),
      });
      const json = await res.json();
      if (!res.ok) {
        setResult({ id: s.id, ok: false, text: json.error || 'Xato' });
      } else {
        setResult({
          id: s.id,
          ok: true,
          text:
            (json.created ? 'Akkaunt yaratildi. ' : "Parol o'zgartirildi. ") +
            `Login: ${s.username} · Parol: ${pw}`,
        });
        setPw('');
        await loadStudents();
      }
    } catch (err: any) {
      setResult({ id: s.id, ok: false, text: err.message || 'Xato' });
    }
    setBusyId(null);
  }

  const filtered = students.filter(
    (s) =>
      s.full_name.toLowerCase().includes(query.toLowerCase()) ||
      s.username.toLowerCase().includes(query.toLowerCase())
  );

  const input =
    'w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 text-sm';

  return (
    <div className="p-4 pb-20 max-w-md mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-white">Sozlamalar</h1>

      {/* Own password */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Mening parolim</h2>
        <form onSubmit={changeOwn} className="space-y-3">
          <input
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder="Hozirgi parol"
            autoComplete="current-password"
            className={input}
          />
          <input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            placeholder="Yangi parol (kamida 8 belgi)"
            autoComplete="new-password"
            className={input}
          />
          <input
            type="password"
            value={again}
            onChange={(e) => setAgain(e.target.value)}
            placeholder="Yangi parolni takrorlang"
            autoComplete="new-password"
            className={input}
          />
          {ownMsg && (
            <p className={ownMsg.ok ? 'text-green-400 text-sm' : 'text-red-400 text-sm'}>
              {ownMsg.text}
            </p>
          )}
          <button
            type="submit"
            disabled={ownBusy}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold py-3 rounded-xl disabled:opacity-50"
          >
            {ownBusy ? 'Saqlanmoqda...' : "Parolni o'zgartirish"}
          </button>
        </form>
      </section>

      {/* Student passwords */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Talabalar parollari</h2>
        <p className="text-slate-400 text-xs">
          "Akkaunt yo'q" talabaga birinchi marta parol qo'ysangiz, uning kirish akkaunti
          yaratiladi. Login talabaning username i bo'ladi.
        </p>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Qidirish (ism yoki username)"
          className={input}
        />

        <div className="space-y-2">
          {filtered.map((s) => (
            <div key={s.id} className="bg-slate-800 border border-slate-700 rounded-xl p-3">
              <button
                onClick={() => {
                  setOpenId(openId === s.id ? null : s.id);
                  setPw('');
                  setResult(null);
                }}
                className="w-full text-left flex items-center justify-between gap-2"
              >
                <span>
                  <span className="block text-white text-sm font-medium">{s.full_name}</span>
                  <span className="block text-slate-500 text-xs">{s.username}</span>
                </span>
                <span
                  className={
                    'text-xs whitespace-nowrap ' +
                    (s.user_id ? 'text-green-400' : 'text-yellow-400')
                  }
                >
                  {s.user_id ? 'Akkaunt bor' : "Akkaunt yo'q"}
                </span>
              </button>

              {openId === s.id && (
                <div className="mt-3 space-y-2">
                  <input
                    type="text"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    placeholder="Yangi parol (kamida 8 belgi)"
                    autoComplete="off"
                    className={input}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPw(randomPassword())}
                      className="bg-slate-900 border border-slate-700 text-slate-200 text-sm py-2.5 rounded-lg"
                    >
                      Parol o'ylab top
                    </button>
                    <button
                      onClick={() => saveStudent(s)}
                      disabled={busyId === s.id}
                      className="bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-lg disabled:opacity-50"
                    >
                      {busyId === s.id ? 'Saqlanmoqda...' : 'Saqlash'}
                    </button>
                  </div>
                  {result && result.id === s.id && (
                    <p
                      className={
                        (result.ok ? 'text-green-400' : 'text-red-400') + ' text-sm break-words'
                      }
                    >
                      {result.text}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
