'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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
      // Get total students
      const { data: students } = await supabase
        .from('students')
        .select('id');

      // Get today's attendance
      const today = new Date().toISOString().split('T')[0];
      const { data: todayRecords } = await supabase
        .from('attendance_records')
        .select('status')
        .like('created_at', `${today}%`);

      const totalStudents = students?.length || 0;
      const presentToday = todayRecords?.filter((r) => r.status === 'present').length || 0;
      const lateToday = todayRecords?.filter((r) => r.status === 'late').length || 0;
      const absentToday = todayRecords?.filter((r) => r.status === 'absent').length || 0;

      const attendanceRate =
        totalStudents > 0
          ? Math.round(
              ((presentToday + lateToday) / totalStudents) * 100
            )
          : 0;

      setStats({
        totalStudents,
        presentToday,
        lateToday,
        absentToday,
        attendanceRate,
      });

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
        <p className="text-sm opacity-90 mb-2">TODAY'S ATTENDANCE RATE</p>
        <div className="flex items-center justify-between">
          <p className="text-5xl font-bold">{stats.attendanceRate}%</p>
          <div className="text-6xl opacity-20">📈</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-semibold py-4 rounded-xl transition text-lg">
          ✓ START ATTENDANCE
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold py-3 rounded-xl transition">
            📋 History
          </button>
          <button className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold py-3 rounded-xl transition">
            👥 Students
          </button>
          <button className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold py-3 rounded-xl transition">
            📊 Reports
          </button>
          <button className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold py-3 rounded-xl transition">
            ⚙️ Settings
          </button>
        </div>
      </div>
    </div>
  );
}
