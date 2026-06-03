export function getCurrentSemester(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  if (month >= 9) {
    return `${year}-осень`;
  }
  if (month >= 2 && month <= 8) {
    return `${year}-весна`;
  }
  // Январь — завершение осеннего семестра предыдущего года
  return `${year - 1}-осень`;
}

export function getSemesterOptions(count: number = 6): string[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const options: string[] = [];

  let currentYear: number;
  let currentSem: 'осень' | 'весна';

  if (month >= 9) {
    currentYear = year;
    currentSem = 'осень';
  } else if (month >= 2) {
    currentYear = year;
    currentSem = 'весна';
  } else {
    currentYear = year - 1;
    currentSem = 'осень';
  }

  for (let i = 0; i < count; i++) {
    const sem = i % 2 === 0 ? currentSem : (currentSem === 'осень' ? 'весна' : 'осень');
    const y = currentYear - Math.floor(i / 2);
    // alternate semester order: current first, then previous pair, etc.
    options.push(`${y}-${sem}`);
  }
  return options;
}
