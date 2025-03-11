import { format } from "date-fns";

export const normalizeDate = (date: Date | string): string => {
  if (typeof date === "string") {
    // 處理各種可能的日期格式
    const [year, month, day] = date.split(/[-/]/).map(Number);
    // 確保月份和日期都是兩位數
    const paddedMonth = month.toString().padStart(2, "0");
    const paddedDay = day.toString().padStart(2, "0");
    return `${year}-${paddedMonth}-${paddedDay}`;
  }
  return format(date, "yyyy-MM-dd"); // 使用 MM-dd 確保兩位數
};
