-- =====================================================
-- Миграция: создание базы данных "Электронный журнал"
-- PostgreSQL 17+
-- =====================================================

BEGIN;

-- Очистка старых таблиц для применения новой структуры
DROP TABLE IF EXISTS attendances CASCADE;
DROP TABLE IF EXISTS grades CASCADE;
DROP TABLE IF EXISTS works CASCADE;
DROP TABLE IF EXISTS work_types CASCADE;
DROP TABLE IF EXISTS grade_systems CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS lesson_types CASCADE;
DROP TABLE IF EXISTS journals CASCADE;
DROP TABLE IF EXISTS teacher_assignments CASCADE;
DROP TABLE IF EXISTS disciplines CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;

-- -----------------------------------------------------
-- 1. Таблица ролей
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- -----------------------------------------------------
-- 2. Таблица групп
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    admission_year INT NOT NULL CHECK (admission_year > 2000 AND admission_year < 2100)
);

-- -----------------------------------------------------
-- 3. Таблица дисциплин
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS disciplines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

-- -----------------------------------------------------
-- 4. Таблица пользователей
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    login VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_blocked BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_users_full_name ON users USING btree (full_name);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users USING btree (role_id);

-- -----------------------------------------------------
-- 5. Таблица студентов
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    group_id INT NOT NULL REFERENCES groups(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_students_user_id ON students USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_students_group_id ON students USING btree (group_id);

-- -----------------------------------------------------
-- 6. Таблица преподавателей
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS teachers (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    department VARCHAR(255) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON teachers USING btree (user_id);

-- -----------------------------------------------------
-- 7. Таблица назначений преподавателей
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS teacher_assignments (
    id SERIAL PRIMARY KEY,
    teacher_id INT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    group_id INT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    discipline_id INT NOT NULL REFERENCES disciplines(id) ON DELETE RESTRICT,
    semester VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(teacher_id, group_id, discipline_id, semester)
);

CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher_id ON teacher_assignments USING btree (teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_group_id ON teacher_assignments USING btree (group_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_discipline_id ON teacher_assignments USING btree (discipline_id);

-- -----------------------------------------------------
-- 8. Таблица журналов (успеваемости и посещаемости)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS journals (
    id SERIAL PRIMARY KEY,
    group_id INT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    teacher_id INT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    discipline_id INT NOT NULL REFERENCES disciplines(id) ON DELETE RESTRICT,
    semester VARCHAR(20) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'grades' CHECK (type IN ('grades', 'attendance')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_journals_group_id ON journals USING btree (group_id);
CREATE INDEX IF NOT EXISTS idx_journals_teacher_id ON journals USING btree (teacher_id);
CREATE INDEX IF NOT EXISTS idx_journals_discipline_id ON journals USING btree (discipline_id);
CREATE INDEX IF NOT EXISTS idx_journals_type ON journals USING btree (type);

-- -----------------------------------------------------
-- 9. Таблица типов занятий
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS lesson_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE
);

-- -----------------------------------------------------
-- 10. Таблица занятий
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS lessons (
    id SERIAL PRIMARY KEY,
    journal_id INT NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
    lesson_date DATE NOT NULL,
    lesson_type_id INT NOT NULL REFERENCES lesson_types(id) ON DELETE RESTRICT,
    display_order INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_lessons_journal_id ON lessons USING btree (journal_id);
CREATE INDEX IF NOT EXISTS idx_lessons_lesson_date ON lessons USING btree (lesson_date);

-- -----------------------------------------------------
-- 11. Справочник типов работ
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS work_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE
);

-- -----------------------------------------------------
-- 12. Справочник систем оценивания
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS grade_systems (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- -----------------------------------------------------
-- 13. Таблица работ (контрольных, лабораторных и т.д.)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS works (
    id SERIAL PRIMARY KEY,
    journal_id INT NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    work_type_id INT NOT NULL REFERENCES work_types(id) ON DELETE RESTRICT,
    grade_system_id INT NOT NULL REFERENCES grade_systems(id) ON DELETE RESTRICT,
    min_score NUMERIC(5,2) DEFAULT 0,
    max_score NUMERIC(5,2) NOT NULL,
    is_mandatory BOOLEAN DEFAULT TRUE,
    deadline DATE,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_works_journal_id ON works USING btree (journal_id);

-- -----------------------------------------------------
-- 14. Таблица оценок
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS grades (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    work_id INT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
    score NUMERIC(5,2) NOT NULL,
    grade_date DATE DEFAULT CURRENT_DATE,
    teacher_id INT REFERENCES teachers(id) ON DELETE SET NULL,
    UNIQUE(student_id, work_id)
);

CREATE INDEX IF NOT EXISTS idx_grades_student_id ON grades USING btree (student_id);
CREATE INDEX IF NOT EXISTS idx_grades_work_id ON grades USING btree (work_id);
CREATE INDEX IF NOT EXISTS idx_grades_teacher_id ON grades USING btree (teacher_id);

-- -----------------------------------------------------
-- 15. Таблица посещаемости
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS attendances (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    lesson_id INT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'excused', 'late')),
    attendance_date DATE DEFAULT CURRENT_DATE,
    UNIQUE(student_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_attendances_student_id ON attendances USING btree (student_id);
CREATE INDEX IF NOT EXISTS idx_attendances_lesson_id ON attendances USING btree (lesson_id);

-- -----------------------------------------------------
-- 16. Таблица аудита
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_at ON audit_logs USING btree (changed_at);

COMMIT;
