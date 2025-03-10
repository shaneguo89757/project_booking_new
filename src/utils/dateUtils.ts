import { format, parse } from 'date-fns';

export const normalizeDate = (date: Date | string): string => {
  if (typeof date === 'string') {
    // 處理各種可能的日期格式
    const [year, month, day] = date.split(/[-/]/).map(Number);
    return `${year}-${month}-${day}`;
  }
  return format(date, 'yyyy-M-d');
}; 