export interface Booking {
  date: string;
  students: Student[];
  isClassDay: boolean;
}

export interface Student {
  id: string;
  name: string;
}

const defaultStudents: Student[] = [
  { id: '1', name: '張小明' },
  { id: '2', name: '李小華' },
  { id: '3', name: '王小美' },
];

const MAX_STUDENTS_PER_CLASS = 7; // 設定每堂課的最大人數

class LocalStorageService {
  private readonly BOOKINGS_KEY = 'bookings';
  private readonly STUDENTS_KEY = 'students';

  private isClient = typeof window !== 'undefined';

  constructor() {
    if (this.isClient) {
      // 初始化範例資料
      if (!this.getBookings().length) {
        this.setBookings([]);
      }
      if (!this.getStudents().length) {
        this.setStudents(defaultStudents);
      }
    }
  }

  // 取得每堂課的最大人數限制
  getMaxStudentsPerClass(): number {
    return MAX_STUDENTS_PER_CLASS;
  }

  // 檢查課程是否已滿
  isClassFull(date: string): boolean {
    const booking = this.getBookings().find(b => b.date === date);
    return booking ? booking.students.length >= MAX_STUDENTS_PER_CLASS : false;
  }

  // 取得所有預約
  getBookings(): Booking[] {
    if (!this.isClient) return [];
    const bookings = localStorage.getItem(this.BOOKINGS_KEY);
    return bookings ? JSON.parse(bookings) : [];
  }

  // 設置預約
  setBookings(bookings: Booking[]) {
    if (!this.isClient) return;
    localStorage.setItem(this.BOOKINGS_KEY, JSON.stringify(bookings));
  }

  // 新增課程
  addClassDay(date: string) {
    if (!this.isClient) return;
    const bookings = this.getBookings();
    const existingBooking = bookings.find(b => b.date === date);
    
    if (!existingBooking) {
      bookings.push({
        date,
        students: [],
        isClassDay: true,
      });
      this.setBookings(bookings);
    }
  }

  // 關閉課程
  closeClassDay(date: string): { success: boolean; error?: string } {
    if (!this.isClient) return { success: false, error: '無法在伺服器端執行此操作' };
    
    const bookings = this.getBookings();
    const bookingIndex = bookings.findIndex(b => b.date === date);
    
    if (bookingIndex === -1) {
      return { success: false, error: '找不到該課程' };
    }

    // 檢查是否有學生預約
    const booking = bookings[bookingIndex];
    if (booking.students.length > 0) {
      return { 
        success: false, 
        error: `無法關閉課程：已有 ${booking.students.length} 位學生預約` 
      };
    }

    // 如果沒有學生預約，則可以關閉課程
    bookings.splice(bookingIndex, 1);
    this.setBookings(bookings);
    return { success: true };
  }

  // 新增學生預約
  addStudentBooking(studentId: string, dates: string[]): { success: boolean; error?: string } {
    if (!this.isClient) return { success: false, error: '無法在伺服器端執行此操作' };
    
    const bookings = this.getBookings();
    const student = this.getStudents().find(s => s.id === studentId);
    
    if (!student) return { success: false, error: '找不到該學生' };

    // 檢查所有選擇的日期是否有任何一個已經額滿
    const fullDates = dates.filter(date => this.isClassFull(date));
    if (fullDates.length > 0) {
      return {
        success: false,
        error: `以下日期課程已額滿：${fullDates.join(', ')}`
      };
    }

    dates.forEach(date => {
      const booking = bookings.find(b => b.date === date);
      if (booking) {
        if (!booking.students.some(s => s.id === student.id)) {
          booking.students.push(student);
        }
      } else {
        bookings.push({
          date,
          students: [student],
          isClassDay: true,
        });
      }
    });

    this.setBookings(bookings);
    return { success: true };
  }

  // 從特定日期移除學生
  removeStudentFromBooking(studentName: string, date: string): { success: boolean; error?: string } {
    if (!this.isClient) return { success: false, error: '無法在伺服器端執行此操作' };
    
    const bookings = this.getBookings();
    const booking = bookings.find(b => b.date === date);
    
    if (!booking) {
      return { success: false, error: '找不到該課程' };
    }

    const studentIndex = booking.students.findIndex(s => s.name === studentName);
    if (studentIndex === -1) {
      return { success: false, error: '找不到該學生' };
    }

    booking.students.splice(studentIndex, 1);
    this.setBookings(bookings);
    return { success: true };
  }

  // 取得所有學生
  getStudents(): Student[] {
    if (!this.isClient) return defaultStudents;
    const students = localStorage.getItem(this.STUDENTS_KEY);
    return students ? JSON.parse(students) : defaultStudents;
  }

  // 新增學生
  addStudent(name: string): Student {
    if (!this.isClient) throw new Error('Cannot add student on server side');
    
    const students = this.getStudents();
    const newStudent: Student = {
      id: Date.now().toString(),
      name,
    };
    
    students.push(newStudent);
    this.setStudents(students);
    
    return newStudent;
  }

  // 刪除學生
  deleteStudent(studentId: string): { success: boolean; error?: string } {
    if (!this.isClient) return { success: false, error: '無法在伺服器端執行此操作' };

    // 檢查學生是否有預約
    const bookings = this.getBookings();
    const hasBookings = bookings.some(booking => 
      booking.students.some(student => student.id === studentId)
    );

    if (hasBookings) {
      return { 
        success: false, 
        error: '無法刪除：該學生還有課程預約，請先取消所有預約' 
      };
    }

    // 刪除學生
    const students = this.getStudents();
    const index = students.findIndex(s => s.id === studentId);
    
    if (index === -1) {
      return { success: false, error: '找不到該學生' };
    }

    students.splice(index, 1);
    this.setStudents(students);
    return { success: true };
  }

  // 設置學生
  private setStudents(students: Student[]) {
    if (!this.isClient) return;
    localStorage.setItem(this.STUDENTS_KEY, JSON.stringify(students));
  }

  // 編輯學生
  editStudent(studentId: string, newName: string): { success: boolean; error?: string } {
    if (!this.isClient) return { success: false, error: '無法在伺服器端執行此操作' };

    const students = this.getStudents();
    const studentIndex = students.findIndex(s => s.id === studentId);
    
    if (studentIndex === -1) {
      return { success: false, error: '找不到該學生' };
    }

    // 檢查是否有重名
    if (students.some(s => s.name === newName && s.id !== studentId)) {
      return { success: false, error: '已存在相同名稱的學生' };
    }

    // 更新學生名字
    students[studentIndex].name = newName;
    this.setStudents(students);

    // 更新所有預約中的學生名字
    const bookings = this.getBookings();
    bookings.forEach(booking => {
      booking.students.forEach(student => {
        if (student.id === studentId) {
          student.name = newName;
        }
      });
    });
    this.setBookings(bookings);

    return { success: true };
  }
}

// 匯出單例
export const localStorageService = new LocalStorageService(); 