import { z } from 'zod';

const fullNameRegex = /^[а-яА-ЯёЁ\s-]+$/;

export const createUserSchema = z.object({
  login: z.string().min(1, 'Логин обязателен'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
  fullName: z.string()
    .min(1, 'ФИО обязательно')
    .regex(fullNameRegex, 'ФИО может содержать только русские буквы, пробелы и тире'),
  role: z.enum(['admin', 'teacher', 'student', 'deanery'], {
    message: 'Некорректная роль',
  }),
  department: z.string().optional(),
  groupId: z.number().int().positive().optional().or(z.string().optional()),
});

export const updateUserSchema = z.object({
  fullName: z.string()
    .min(1, 'ФИО обязательно')
    .regex(fullNameRegex, 'ФИО может содержать только русские буквы, пробелы и тире'),
  role: z.enum(['admin', 'teacher', 'student', 'deanery'], {
    message: 'Некорректная роль',
  }),
  isBlocked: z.boolean().or(z.string().transform((v) => v === 'true' || v === true)),
});
