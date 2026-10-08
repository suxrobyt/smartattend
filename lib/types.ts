export type User = {
  id: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  full_name: string;
  avatar_url?: string;
  created_at: string;
};

export type Student = {
  id: string;
  user_id: string;
  username: string;
  full_name: string;
  group_id: string;
  status: 'active' | 'inactive';
  attendance_percentage: number;
  last_login?: string;
  created_at: string;
};

export type Teacher = {
  id: string;
  user_id: string;
  username: string;
  full_name: string;
  group_ids: string[];
  created_at: string;
};

export type AttendanceSession = {
  id: string;
  group_id: string;
  teacher_id: string;
  subject: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'active' | 'closed';
  qr_token?: string;
  qr_token_expires_at?: string;
  created_at: string;
};

export type AttendanceRecord = {
  id: string;
  session_id: string;
  student_id: string;
  status: 'present' | 'late' | 'absent' | 'excused';
  marked_at: string;
  marked_by?: string;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'attendance' | 'system' | 'info';
  read: boolean;
  created_at: string;
};
