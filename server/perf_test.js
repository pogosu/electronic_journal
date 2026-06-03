const BASE_URL = 'http://localhost:3001';

async function login(login, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Login failed for ${login}: ${data.error}`);
  return data.token;
}

async function measureTime(label, fn) {
  const times = [];
  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    times.push(end - start);
  }
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  console.log(`${label}: среднее ${avg.toFixed(2)} мс (мин: ${min.toFixed(2)}, макс: ${max.toFixed(2)})`);
  return { label, avg, min, max };
}

async function get(url, token) {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
  return res.json();
}

async function post(url, token, body) {
  const res = await fetch(`${BASE_URL}${url}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(`POST ${url} failed: ${res.status} ${data.error || ''}`);
  }
  return res.json();
}

async function runBD01() {
  console.log('=== БД-01: Время отклика ключевых страниц ===');

  const adminToken = await login('admin', 'password');
  const studentToken = await login('student1', 'password');

  const results = [];

  results.push(await measureTime('Список дисциплин (GET /api/disciplines)',
    () => get('/api/disciplines', adminToken)));

  results.push(await measureTime('Журнал успеваемости (GET /api/students/grades)',
    () => get('/api/students/grades', studentToken)));

  results.push(await measureTime('Журнал посещаемости (GET /api/students/attendance)',
    () => get('/api/students/attendance', studentToken)));

  results.push(await measureTime('Панель администратора (GET /api/admin/users)',
    () => get('/api/admin/users', adminToken)));

  console.log('\nСводные результаты БД-01:');
  console.table(results.map(r => ({
    Страница: r.label,
    'Среднее, мс': r.avg.toFixed(2),
    'Мин, мс': r.min.toFixed(2),
    'Макс, мс': r.max.toFixed(2)
  })));
}

async function runBD02() {
  console.log('\n=== БД-02: Задержка отображения оценки ===');

  const teacherToken = await login('teacher1', 'password');
  const studentToken = await login('student1', 'password');

  const saveStart = performance.now();
  await post('/api/grades', teacherToken, { studentId: 1, workId: 1, score: 85 });
  const saveEnd = performance.now();

  const checkStart = performance.now();
  await get('/api/students/grades', studentToken);
  const checkEnd = performance.now();

  const saveTime = (saveEnd - saveStart).toFixed(2);
  const checkTime = (checkEnd - checkStart).toFixed(2);
  const totalDelay = (checkEnd - saveStart).toFixed(2);

  console.log(`Время сохранения оценки: ${saveTime} мс`);
  console.log(`Время проверки студентом: ${checkTime} мс`);
  console.log(`Общая задержка (сохранение + проверка): ${totalDelay} мс`);
}

async function main() {
  try {
    await runBD01();
    await runBD02();
    console.log('\nТестирование завершено.');
  } catch (err) {
    console.error('Ошибка:', err.message);
    process.exit(1);
  }
}

main();
