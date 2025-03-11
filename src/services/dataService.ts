import type { Booking } from "./localStorageService";
import { localStorageService } from "./localStorageService";
import type { Student } from "./sheetService";
import { SheetService } from "./sheetService";

export interface DataServiceState {
  students: Student[];
  bookings: Booking[];
  classDays: { date: string }[];
  isAuthenticated: boolean;
  spreadsheetId: string | null;
  isLoading: boolean;
  error: string | null;
}

class DataService {
  private static instance: DataService;
  private sheetService: SheetService;
  private state: DataServiceState;
  private listeners: ((state: DataServiceState) => void)[] = [];

  private constructor() {
    this.sheetService = new SheetService();

    // 檢查是否有保存的登入狀態
    const savedToken = localStorage.getItem("accessToken");
    const savedSpreadsheetId = localStorage.getItem("spreadsheetId");

    this.state = {
      students: [],
      bookings: [],
      classDays: [],
      isAuthenticated: !!savedToken,
      spreadsheetId: savedSpreadsheetId,
      isLoading: false,
      error: null,
    };

    // 如果有保存的 token，恢復登入狀態
    if (savedToken) {
      this.sheetService.setAccessToken(savedToken);

      // 如果有試算表 ID，自動同步數據
      if (savedSpreadsheetId) {
        this.syncAll().catch((error) => {
          console.error("Failed to sync data on init:", error);
          // 如果同步失敗且是因為認證問題，清除登入狀態
          if (
            error.message.includes("Not authenticated") ||
            error.message.includes("Token expired")
          ) {
            this.logout();
          }
        });
      }
    }

    // 初始化時從 localStorage 載入資料
    this.loadFromLocalStorage();
  }

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  private setState(newState: Partial<DataServiceState>) {
    this.state = { ...this.state, ...newState };
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.state));
  }

  subscribe(listener: (state: DataServiceState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private loadFromLocalStorage() {
    const localBookings = localStorageService.getBookings();
    const localStudents = localStorageService.getStudents();
    this.setState({
      bookings: localBookings,
      students: localStudents.map((s) => ({
        ...s,
        instagram: "",
        active: true,
      })),
    });
  }

  // 認證相關方法
  setAccessToken(token: string) {
    this.sheetService.setAccessToken(token);
    this.setState({ isAuthenticated: true });
    localStorage.setItem("accessToken", token);
  }

  logout() {
    localStorage.removeItem("accessToken");
    this.setState({
      isAuthenticated: false,
      spreadsheetId: null,
    });
  }

  // Spreadsheet ID 相關方法
  setSpreadsheetId(id: string) {
    this.setState({ spreadsheetId: id });
    localStorage.setItem("spreadsheetId", id);
  }

  // 資料同步方法
  async syncAll() {
    if (!this.state.spreadsheetId || !this.state.isAuthenticated) {
      this.setState({ error: "尚未設定試算表 ID 或未登入" });
      return;
    }

    try {
      console.log("DataService: 开始同步数据...");
      this.setState({ isLoading: true, error: null });

      console.log("DataService: 调用 sheetService.syncAll...");
      const data = await this.sheetService.syncAll(this.state.spreadsheetId);
      console.log("DataService: 获取到的数据:", data);

      // 更新所有數據
      console.log("DataService: 开始更新状态...");
      this.setState({
        // 更新學生資料
        students: data.students,

        // 更新課程預約資料
        // 將每個預約轉換為包含完整學生信息的格式
        bookings: data.classDays.map((classDay) => {
          // 找出這個日期的所有預約
          const dayBookings = data.bookings
            .filter((b) => b.date === classDay.date)
            .map((b) => data.students.find((s) => s.id === b.studentId))
            .filter((s): s is Student => s !== undefined);

          return {
            date: classDay.date,
            students: dayBookings,
            isClassDay: true,
          };
        }),

        // 更新開課日期
        classDays: data.classDays,
      });
      console.log("DataService: 状态更新完成");
    } catch (error) {
      console.error("DataService: 同步数据时发生错误:", error);
      const errorMessage = error instanceof Error ? error.message : "同步失敗";
      this.setState({ error: errorMessage });

      if (errorMessage.includes("Not authenticated")) {
        this.logout();
      }
    } finally {
      this.setState({ isLoading: false });
      console.log("DataService: 同步流程结束");
    }
  }

  // 課程相關方法
  async startClass(date: string) {
    if (!this.state.spreadsheetId) {
      this.setState({ error: "尚未設定試算表 ID" });
      return;
    }

    try {
      this.setState({ isLoading: true, error: null });
      await this.sheetService.addClassDay(this.state.spreadsheetId, date);
      await this.syncAll();
    } catch (error) {
      this.setState({
        error: error instanceof Error ? error.message : "開課失敗",
      });
    }
  }

  async closeClass(date: string) {
    if (!this.state.spreadsheetId) {
      this.setState({ error: "尚未設定試算表 ID" });
      return;
    }

    try {
      this.setState({ isLoading: true, error: null });
      await this.sheetService.deleteClassDay(this.state.spreadsheetId, date);
      await this.syncAll();
    } catch (error) {
      this.setState({
        error: error instanceof Error ? error.message : "關閉課程失敗",
      });
    }
  }

  // 學生相關方法
  async addStudent(name: string) {
    try {
      console.log("DataService: 开始添加新学员:", name);

      // 检查是否已设置 spreadsheetId
      if (!this.state.spreadsheetId) {
        throw new Error("尚未設定試算表 ID");
      }

      // 创建新学员对象（不包含 ID，因为 ID 将由 SheetService 生成）
      const studentData = {
        name,
        instagram: "",
        active: true,
      };

      console.log("DataService: 准备添加学员数据:", studentData);

      // 添加到 Google Sheets 并获取包含新 ID 的完整学员数据
      const newStudent = await this.sheetService.addStudent(
        this.state.spreadsheetId,
        studentData
      );
      console.log(
        "DataService: 已添加到 Google Sheets，返回的数据:",
        newStudent
      );

      // 同步所有数据以确保本地状态更新
      await this.syncAll();
      console.log("DataService: 数据同步完成");

      return newStudent;
    } catch (error) {
      console.error("DataService: 添加学员失败:", error);
      this.setState({
        error: error instanceof Error ? error.message : "新增學員失敗",
      });
      throw error;
    }
  }

  async editStudent(
    studentId: string,
    newName: string,
    options?: { active?: boolean }
  ) {
    try {
      // 先從當前狀態中獲取學生資料
      const student = this.state.students.find((s) => s.id === studentId);
      if (!student) {
        throw new Error("找不到學生資料");
      }

      // 更新學生資料
      const updatedStudent = {
        ...student,
        name: newName,
        active: options?.active !== undefined ? options.active : student.active,
      };

      // 更新 Google Sheets
      if (this.state.spreadsheetId) {
        await this.sheetService.updateStudent(
          this.state.spreadsheetId,
          updatedStudent
        );
      }

      // 同步所有資料
      await this.syncAll();
    } catch (error) {
      this.setState({
        error: error instanceof Error ? error.message : "編輯學生失敗",
      });
      throw error; // 向上傳遞錯誤
    }
  }

  async deleteStudent(studentId: string) {
    try {
      const result = localStorageService.deleteStudent(studentId);
      if (result.success) {
        await this.syncAll();
      } else {
        this.setState({ error: result.error });
      }
    } catch (error) {
      this.setState({
        error: error instanceof Error ? error.message : "刪除學生失敗",
      });
    }
  }

  // 預約相關方法
  async addBooking(studentId: string, dates: string[]) {
    try {
      const result = localStorageService.addStudentBooking(studentId, dates);
      if (result.success) {
        await this.syncAll();
      } else {
        this.setState({ error: result.error });
      }
    } catch (error) {
      this.setState({
        error: error instanceof Error ? error.message : "新增預約失敗",
      });
    }
  }

  async removeBooking(studentId: string, date: string) {
    try {
      const result = localStorageService.removeStudentFromBooking(
        studentId,
        date
      );
      if (result.success) {
        await this.syncAll();
      } else {
        this.setState({ error: result.error });
      }
    } catch (error) {
      this.setState({
        error: error instanceof Error ? error.message : "取消預約失敗",
      });
    }
  }

  // 取得當前狀態
  getState(): DataServiceState {
    return this.state;
  }
}

export const dataService = DataService.getInstance();
