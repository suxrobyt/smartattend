'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { todayLocal } from '@/lib/utils';

export default function TeacherDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    lateToday: 0,
    absentToday: 0,
    attendanceRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: students } = await supabase.from('students').select('id');

      // Use the most recent lesson of today
      const today = todayLocal();
      const { data: sessions } = await supabase
        .from('attendance_sessions')
        .select('id')
        .eq('session_date', today)
        .order('created_at', { ascending: false })
        .limit(1);

      let records: { status: string }[] = [];
      if (sessions && sessions[0]) {
        const { data } = await supabase
          .from('attendance_records')
          .select('status')
          .eq('session_id', sessions[0].id);
        records = data || [];
      }

      const totalStudents = students?.length || 0;
      const presentToday = records.filter((r) => r.status === 'present').length;
      const lateToday = records.filter((r) => r.status === 'late').length;
      const absentToday = records.filter((r) => r.status === 'absent').length;
      const attendanceRate =
        totalStudents > 0
          ? Math.round(((presentToday + lateToday) / totalStudents) * 100)
          : 0;

      setStats({ totalStudents, presentToday, lateToday, absentToday, attendanceRate });
      setLoading(false);
    } catch (error) {
      console.error('Error loading stats:', error);
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Teacher Dashboard</h1>
        <p className="text-slate-400 mt-1">Group: 9-26</p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-600/20 border border-blue-500/30 rounded-xl p-4">
          <p className="text-blue-300 text-xs mb-1">TOTAL STUDENTS</p>
          <p className="text-3xl font-bold text-blue-400">{stats.totalStudents}</p>
        </div>
        <div className="bg-green-600/20 border border-green-500/30 rounded-xl p-4">
          <p className="text-green-300 text-xs mb-1">PRESENT TODAY</p>
          <p className="text-3xl font-bold text-green-400">{stats.presentToday}</p>
        </div>
        <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-xl p-4">
          <p className="text-yellow-300 text-xs mb-1">LATE TODAY</p>
          <p className="text-3xl font-bold text-yellow-400">{stats.lateToday}</p>
        </div>
        <div className="bg-red-600/20 border border-red-500/30 rounded-xl p-4">
          <p className="text-red-300 text-xs mb-1">ABSENT TODAY</p>
          <p className="text-3xl font-bold text-red-400">{stats.absentToday}</p>
        </div>
      </div>

      {/* Attendance Rate */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <p className="text-sm opacity-90 mb-2">OXIRGI DARS BO'YICHA DAVOMAT</p>
        <div className="flex items-center justify-between">
          <p className="text-5xl font-bold">{stats.attendanceRate}%</p>
          <div className="text-6xl opacity-20">📈</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Link
          href="/teacher/attendance"
          className="block text-center w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold py-4 rounded-xl text-lg"
        >
          ✓ DAVOMAT BOSHLASH
        </Link>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/teacher/history"
            className="block text-center bg-slate-800 border border-slate-700 text-white font-semibold py-3 rounded-xl"
          >
            📋 Tarix
          </Link>
          <Link
            href="/teacher/students"
            className="block text-center bg-slate-800 border border-slate-700 text-white font-semibold py-3 rounded-xl"
          >
            👥 Talabalar
          </Link>
          <Link
            href="/teacher/reports"
            className="block text-center bg-slate-800 border border-slate-700 text-white font-semibold py-3 rounded-xl"
          >
            📊 Hisobot
          </Link>
          <Link
            href="/teacher/settings"
            className="block text-center bg-slate-800 border border-slate-700 text-white font-semibold py-3 rounded-xl"
          >
            ⚙️ Sozlamalar
          </Link>
        </div>
      </div>
    </div>
  );
}
