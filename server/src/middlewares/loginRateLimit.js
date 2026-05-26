const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000; // 15 минут
const MAX_ATTEMPTS = 5;

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

export function checkLoginBlock(req, res, next) {
  const ip = getClientIp(req);
  const now = Date.now();
  const record = attempts.get(ip);

  if (record && record.blockedUntil > now) {
    const minutes = Math.ceil((record.blockedUntil - now) / 60000);
    return res.status(429).json({
      error: `Слишком много попыток входа. Попробуйте через ${minutes} мин.`,
      retryAfterMinutes: minutes,
    });
  }

  next();
}

export function recordFailedLogin(req) {
  const ip = getClientIp(req);
  const now = Date.now();

  // Очистить устаревшие записи
  for (const [key, value] of attempts.entries()) {
    const expired = value.blockedUntil
      ? value.blockedUntil < now
      : value.firstAttempt && now - value.firstAttempt > WINDOW_MS;
    if (expired) {
      attempts.delete(key);
    }
  }

  let record = attempts.get(ip);
  if (!record || (record.firstAttempt && now - record.firstAttempt > WINDOW_MS)) {
    record = { count: 0, firstAttempt: now, blockedUntil: 0 };
  }

  record.count++;
  if (record.count >= MAX_ATTEMPTS) {
    record.blockedUntil = now + WINDOW_MS;
    record.count = 0;
  }

  attempts.set(ip, record);
}
