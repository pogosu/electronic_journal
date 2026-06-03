export interface User {
  id: number;
  login: string;
  fullName: string;
  role: 'admin' | 'teacher' | 'student' | 'deanery';
  department?: string;
  group?: { name: string; admissionYear: number };
}

export interface Group {
  id: number;
  name: string;
  admissionYear: number;
  admission_year?: number;
  course: number;
}

export interface Journal {
  id: number;
  group_id: number;
  teacher_id: number;
  discipline_id: number;
  discipline_name?: string;
  semester: string;
  group_name?: string;
  teacher_name?: string;
  admissionYear?: number;
}

export interface WorkType {
  id: number;
  name: string;
  slug: string;
}

export interface GradeSystem {
  id: number;
  name: string;
  description: string;
}

export interface Work {
  id: number;
  journal_id: number;
  title: string;
  work_type_id: number;
  grade_system_id: number;
  min_score: number;
  max_score: number;
  is_mandatory: boolean;
  deadline: string | null;
  display_order: number;
  is_active: boolean;
  work_type_name?: string;
  work_type_slug?: string;
  grade_system_name?: string;
}

export interface Lesson {
  id: number;
  journal_id: number;
  lesson_date: string;
  lesson_type_id: number;
  lesson_type_name?: string;
  lesson_type_slug?: string;
}

export interface Grade {
  id: number;
  student_id: number;
  work_id: number;
  score: number;
  grade_date: string;
  teacher_id: number;
  student_name?: string;
  work_title?: string;
  max_score?: number;
  is_mandatory?: boolean;
  discipline?: string;
}

export interface Attendance {
  id: number;
  student_id: number;
  lesson_id: number;
  status: 'present' | 'absent' | 'excused' | 'late';
  attendance_date: string;
  student_name?: string;
  lesson_date?: string;
  lesson_type?: string;
  discipline?: string;
}

export interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  table_name: string;
  old_value: any;
  new_value: any;
  changed_at: string;
  login?: string;
  full_name?: string;
  role?: string;
}

export interface JournalTableRow {
  studentId: number;
  fullName: string;
  grades: {
    workId: number;
    title: string;
    score: number | null;
    maxScore: number;
    isMandatory: boolean;
  }[];
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
