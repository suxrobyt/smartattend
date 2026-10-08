'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Student, AttendanceRecord } from '@/lib/types';

export default function StudentDashboard() {
  const [student, setStudent] = useState<Student | null>(null);
  const [todayStatus, setTodayStatus] = useState('Not marked');
  const [attendanceStats, setAttendanceStats] = useState({
    present: 0,
    late: 0,
    absent: 0,
    excused: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudentData();
  }, []);

  const loadStudentData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Get student profile
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (studentData) {
        setStudent(studentData);

        // Get attendance stats
        const { data: records } = await supabase
          .from('attendance_records')
          .select('status, created_at')
          .eq('student_id', studentData.id);

        if (records) {
          const stats = {
            present: records.filter((r) => r.status === 'present').length,
            late: records.filter((r) => r.status === 'late').length,
            absent: records.filter((r) => r.status === 'absent').length,
            excused: records.filter((r) => r.status === 'excused').length,
          };
          setAttendanceStats(stats);

          // Get today's status
          const today = new Date().toLocaleDateString('en-CA');
          const todayRecord = records.find((r) => new Date(r.created_at).toLocaleDateString('en-CA') === today);
          if (todayRecord) {
            setTodayStatus(todayRecord.status.toUpperCase());
          }
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading student data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-20 bg-slate-700 rounded-lg animate-pulse" />
        <div className="h-32 bg-slate-700 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          Assalomu alaykum, {student?.full_name}
        </h1>
        <p className="text-slate-400 mt-1">Group: 9-26</p>
      </div>

      {/* Today's Status */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl p-6 text-white">
        <p className="text-sm opacity-90 mb-2">TODAY'S STATUS</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-4xl font-bold">{todayStatus}</p>
          </div>
          <div className="text-6xl opacity-20">📋</div>
        </div>
      </div>

      {/* Attendance Percentage */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
        <p className="text-slate-400 text-sm mb-4">ATTENDANCE RATE</p>
        <div className="flex items-end gap-4">
          <div>
            <p className="text-5xl font-bold text-white mb-2">
              {Math.round(
                (attendanceStats.present /
                  (attendanceStats.present +
                    attendanceStats.late +
                    attendanceStats.absent +
                    attendanceStats.excused || 1)) *
                  100
              )}
              %
            </p>
            <p className="text-slate-400 text-sm">of total classes attended</p>
          </div>
          <div className="text-5xl">📊</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <p className="text-slate-400 text-xs mb-2">PRESENT</p>
          <p className="text-3xl font-bold text-green-400">{attendanceStats.present}</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <p className="text-slate-400 text-xs mb-2">LATE</p>
          <p className="text-3xl font-bold text-yellow-400">{attendanceStats.late}</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <p className="text-slate-400 text-xs mb-2">ABSENT</p>
          <p className="text-3xl font-bold text-red-400">{attendanceStats.absent}</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <p className="text-slate-400 text-xs mb-2">EXCUSED</p>
          <p className="text-3xl font-bold text-blue-400">{attendanceStats.excused}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <Link
        href="/student/history"
        className="block text-center w-full bg-slate-800 border border-slate-700 text-white font-semibold py-3 rounded-xl"
      >
        📅 Davomat tarixi
      </Link>
    </div>
  );
}
