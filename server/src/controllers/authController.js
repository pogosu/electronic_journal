import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { recordFailedLogin } from '../middlewares/loginRateLimit.js';

export async function login(req, res, next) {
  try {
    const { login, password } = req.body;
    if (!login || !password) {
      return res.status(400).json({ error: 'Логин и пароль обязательны' });
    }

    const row = await User.findByLoginWithDetails(login);
    if (!row) {
      recordFailedLogin(req);
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    const valid = await bcrypt.compare(password, row.password_hash);
    if (!valid) {
      recordFailedLogin(req);
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    if (row.is_blocked) {
      return res.status(403).json({ error: 'Учётная запись заблокирована' });
    }

    const token = jwt.sign(
      { userId: row.id, login: row.login, role: row.role, fullName: row.full_name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      user: {
        id: row.id,
        login: row.login,
        fullName: row.full_name,
        role: row.role,
        department: row.department,
        group: row.group_name ? { name: row.group_name, admissionYear: row.group_year } : null,
      },
    });
  } catch (err) {
    next(err);
  }
}

export function logout(req, res) {
  res.clearCookie('token', { httpOnly: true, sameSite: 'strict' });
  res.json({ message: 'Выход выполнен' });
}

export async function me(req, res, next) {
  try {
    const row = await User.findByIdWithDetails(req.user.userId);
    if (!row) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json({
      id: row.id,
      login: row.login,
      fullName: row.full_name,
      role: row.role,
      department: row.department,
      group: row.group_name ? { name: row.group_name, admissionYear: row.group_year } : null,
    });
  } catch (err) {
    next(err);
  }
}
