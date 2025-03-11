import { normalizeDate } from "@/utils/dateUtils";

export interface Student {
  id: string;
  name: string;
  instagram: string;
  active: boolean;
}

export interface Booking {
  date: string;
  studentId: string;
}

export interface ClassDay {
  date: string;
}

export class SheetService {
  private accessToken: string | null = null;
  private readonly SHEETS = {
    CLASS_DAYS: "開課日期",
    BOOKINGS: "學生預約",
    STUDENTS: "學生名冊",
  };

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  private async handleTokenExpired() {
    localStorage.removeItem("accessToken");
    // 可以觸發一個自定義事件通知應用程式
    window.dispatchEvent(new CustomEvent("tokenExpired"));
  }

  private async fetchSheetData(
    spreadsheetId: string,
    range: string
  ): Promise<string[][]> {
    if (!this.accessToken) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    if (response.status === 401) {
      // Token 過期
      await this.handleTokenExpired();
      throw new Error("Token expired");
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Failed to fetch sheet data: ${response.status} ${
          errorData.error?.message || "Unknown error"
        }`
      );
    }

    const data = await response.json();
    return data.values || [];
  }

  async getClassDays(spreadsheetId: string): Promise<ClassDay[]> {
    try {
      const range = `${this.SHEETS.CLASS_DAYS}!A2:A`; // 跳過標題行
      const values = await this.fetchSheetData(spreadsheetId, range);

      return values.map((row) => ({
        date: row[0],
      }));
    } catch (error) {
      console.error("Error fetching class days:", error);
      throw error;
    }
  }

  async getBookings(spreadsheetId: string): Promise<Booking[]> {
    try {
      const range = `${this.SHEETS.BOOKINGS}!A2:B`; // 跳過標題行
      const values = await this.fetchSheetData(spreadsheetId, range);

      return values.map((row) => ({
        date: row[0],
        studentId: row[1],
      }));
    } catch (error) {
      console.error("Error fetching bookings:", error);
      throw error;
    }
  }

  async getStudents(spreadsheetId: string): Promise<Student[]> {
    try {
      const range = `${this.SHEETS.STUDENTS}!A2:D`; // 跳過標題行
      const values = await this.fetchSheetData(spreadsheetId, range);

      // 加入除錯日誌
      console.log("Raw student data from sheet:", values);

      const students = values.map((row) => {
        const student = {
          id: row[0]?.toString() || "",
          name: row[1]?.toString() || "",
          instagram: row[2]?.toString() || "",
          active: row[3]?.toString().toLowerCase() === "true",
        };

        // 檢查每個學生的資料
        console.log("Processed student:", student);

        return student;
      });

      // 檢查最終的學生列表
      console.log("Final students list:", students);

      return students;
    } catch (error) {
      console.error("Error fetching students:", error);
      throw error;
    }
  }

  // 同步所有資料
  async syncAll(spreadsheetId: string) {
    try {
      const [classDays, bookings, students] = await Promise.all([
        this.getClassDays(spreadsheetId),
        this.getBookings(spreadsheetId),
        this.getStudents(spreadsheetId),
      ]);

      return {
        classDays,
        bookings,
        students,
      };
    } catch (error) {
      console.error("Error syncing all data:", error);
      throw error;
    }
  }

  // 首先新增一個方法來獲取工作表 ID
  private async getSheetId(
    spreadsheetId: string,
    sheetName: string
  ): Promise<number> {
    try {
      console.log("Fetching sheet info for:", spreadsheetId);
      console.log("Access token:", this.accessToken?.substring(0, 10) + "...");

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Response:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        throw new Error(
          `Failed to fetch spreadsheet info: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("Sheets found:", data.sheets?.length);

      const sheet = data.sheets?.find(
        (s: any) => s.properties.title === sheetName
      );

      if (!sheet) {
        console.error(
          "Available sheets:",
          data.sheets?.map((s: any) => s.properties.title)
        );
        throw new Error(`Sheet "${sheetName}" not found`);
      }

      console.log("Found sheet ID:", sheet.properties.sheetId);
      return sheet.properties.sheetId;
    } catch (error) {
      console.error("Error in getSheetId:", error);
      throw error;
    }
  }

  async deleteClassDay(
    spreadsheetId: string,
    targetDate: string
  ): Promise<boolean> {
    try {
      if (!this.accessToken) {
        throw new Error("Access token not set");
      }

      console.log("Starting deleteClassDay operation");
      console.log("Spreadsheet ID:", spreadsheetId);
      console.log("Target date:", targetDate);

      // 1. 獲取工作表 ID
      const sheetId = await this.getSheetId(
        spreadsheetId,
        this.SHEETS.CLASS_DAYS
      );
      console.log("Sheet ID:", sheetId);

      // 2. 獲取所有開課日期
      const range = `${this.SHEETS.CLASS_DAYS}!A2:A`; // 從第二行開始，跳過標題行
      const response = await this.fetchSheetData(spreadsheetId, range);
      console.log("All dates:", response);

      // 3. 找出要刪除的行號
      const rowIndex = response.findIndex((row) => {
        if (!row[0]) return false; // 跳過空行
        const dateFromSheet = row[0].trim(); // 清理可能的空白
        console.log("Processing date from sheet:", dateFromSheet);

        try {
          return normalizeDate(dateFromSheet) === normalizeDate(targetDate);
        } catch (e) {
          console.error("Error comparing dates:", e);
          return false;
        }
      });

      console.log("Row index to delete:", rowIndex);

      if (rowIndex === -1) {
        throw new Error("找不到該課程日期");
      }

      // 4. 刪除該行（注意：實際行號需要+2，因為我們跳過了標題行且索引從0開始）
      const actualRowIndex = rowIndex + 2;
      console.log("Actual row to delete:", actualRowIndex);

      const deleteResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requests: [
              {
                deleteDimension: {
                  range: {
                    sheetId: sheetId,
                    dimension: "ROWS",
                    startIndex: actualRowIndex - 1,
                    endIndex: actualRowIndex,
                  },
                },
              },
            ],
          }),
        }
      );

      const deleteResponseData = await deleteResponse.json();
      console.log("Delete response:", deleteResponseData);

      if (!deleteResponse.ok) {
        throw new Error(
          `Failed to delete row: ${
            deleteResponseData.error?.message || "Unknown error"
          }`
        );
      }

      return true;
    } catch (error) {
      console.error("Error in deleteClassDay:", error);
      throw error;
    }
  }

  async addClassDay(spreadsheetId: string, date: string): Promise<boolean> {
    try {
      if (!this.accessToken) {
        throw new Error("Access token not set");
      }

      // 格式化日期，確保月份和日期都是兩位數
      const formatDateWithPadding = (dateStr: string) => {
        const [year, month, day] = dateStr.split("-");
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      };

      const formattedDate = formatDateWithPadding(date);
      console.log("Adding new class day:", formattedDate);

      // 1. 檢查日期是否已存在
      const existingDates = await this.fetchSheetData(
        spreadsheetId,
        `${this.SHEETS.CLASS_DAYS}!A:A`
      );

      const dateExists = existingDates.some(
        (row) => normalizeDate(row[0]) === normalizeDate(formattedDate)
      );

      if (dateExists) {
        throw new Error("該日期已經開課");
      }

      // 2. 添加新的課程日期（使用格式化後的日期）
      const appendResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${this.SHEETS.CLASS_DAYS}!A:A:append?valueInputOption=USER_ENTERED`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            values: [[formattedDate]],
          }),
        }
      );

      if (!appendResponse.ok) {
        const errorData = await appendResponse.json();
        console.error("Add class day response:", errorData);
        throw new Error(errorData.error?.message || "新增課程失敗");
      }

      // 3. 獲取工作表 ID
      const sheetId = await this.getSheetId(
        spreadsheetId,
        this.SHEETS.CLASS_DAYS
      );

      // 4. 排序工作表
      const sortResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requests: [
              {
                sortRange: {
                  range: {
                    sheetId: sheetId,
                    startRowIndex: 1, // 跳過標題行
                    startColumnIndex: 0,
                    endColumnIndex: 1,
                  },
                  sortSpecs: [
                    {
                      dimensionIndex: 0,
                      sortOrder: "ASCENDING",
                    },
                  ],
                },
              },
            ],
          }),
        }
      );

      if (!sortResponse.ok) {
        const errorData = await sortResponse.json();
        console.error("Sort response:", errorData);
        console.warn("Failed to sort sheet:", errorData.error?.message);
      } else {
        console.log("Sheet sorted successfully");
      }

      return true;
    } catch (error) {
      console.error("Error adding class day:", error);
      throw error;
    }
  }

  async updateStudent(
    spreadsheetId: string,
    student: Student
  ): Promise<boolean> {
    try {
      if (!this.accessToken) {
        throw new Error("Access token not set");
      }

      console.log("SheetService: 开始更新学员数据:", student);

      // 1. 獲取所有學生資料
      const range = `${this.SHEETS.STUDENTS}!A2:D`;
      console.log("SheetService: 获取学员数据范围:", range);
      const values = await this.fetchSheetData(spreadsheetId, range);
      console.log("SheetService: 当前表格数据:", values);

      // 2. 找到要更新的學生的行號
      const rowIndex = values.findIndex((row) => row[0] === student.id);
      console.log("SheetService: 找到学员所在行:", rowIndex + 2);

      if (rowIndex === -1) {
        throw new Error("找不到該學生");
      }

      // 3. 更新該行資料
      const updateRange = `${this.SHEETS.STUDENTS}!A${rowIndex + 2}:D${
        rowIndex + 2
      }`;
      console.log("SheetService: 更新范围:", updateRange);

      // 準備更新的數據
      const updateData = [
        student.id,
        student.name,
        student.instagram || "",
        student.active.toString().toLowerCase(), // 确保布尔值转换为小写字符串
      ];

      console.log("SheetService: 准备更新的数据:", updateData);

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${updateRange}?valueInputOption=USER_ENTERED`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            values: [updateData],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("SheetService: 更新失败:", errorData);
        throw new Error(errorData.error?.message || "更新學生資料失敗");
      }

      const responseData = await response.json();
      console.log("SheetService: 更新成功，响应:", responseData);

      return true;
    } catch (error) {
      console.error("SheetService: 更新学员时发生错误:", error);
      throw error;
    }
  }

  private async getMaxStudentId(spreadsheetId: string): Promise<number> {
    try {
      // 获取所有学员数据
      const range = `${this.SHEETS.STUDENTS}!A2:A`;
      const values = await this.fetchSheetData(spreadsheetId, range);

      // 过滤出数字 ID 并找出最大值
      const maxId = values.reduce((max, row) => {
        const id = parseInt(row[0], 10);
        return isNaN(id) ? max : Math.max(max, id);
      }, 0);

      console.log("SheetService: 当前最大学员 ID:", maxId);
      return maxId;
    } catch (error) {
      console.error("SheetService: 获取最大学员 ID 失败:", error);
      throw error;
    }
  }

  async addStudent(
    spreadsheetId: string,
    student: Omit<Student, "id">
  ): Promise<Student> {
    try {
      if (!this.accessToken) {
        throw new Error("Access token not set");
      }

      console.log("SheetService: 开始添加新学员:", student);

      // 获取当前最大 ID 并生成新 ID
      const maxId = await this.getMaxStudentId(spreadsheetId);
      const newId = (maxId + 1).toString();
      console.log("SheetService: 生成新 ID:", newId);

      const newStudent: Student = {
        ...student,
        id: newId,
        active: true,
      };

      // 准备新学员数据
      const newStudentData = [
        newStudent.id,
        newStudent.name,
        newStudent.instagram || "",
        newStudent.active.toString().toLowerCase(),
      ];

      console.log("SheetService: 准备添加的数据:", newStudentData);

      // 添加新行
      const appendResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${this.SHEETS.STUDENTS}!A:D:append?valueInputOption=USER_ENTERED`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            values: [newStudentData],
          }),
        }
      );

      if (!appendResponse.ok) {
        const errorData = await appendResponse.json();
        console.error("SheetService: 添加学员失败:", errorData);
        throw new Error(errorData.error?.message || "新增學員失敗");
      }

      const responseData = await appendResponse.json();
      console.log("SheetService: 添加学员成功，响应:", responseData);

      // 获取工作表 ID 并对数据进行排序
      const sheetId = await this.getSheetId(
        spreadsheetId,
        this.SHEETS.STUDENTS
      );

      // 对学生名册按姓名排序
      const sortResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requests: [
              {
                sortRange: {
                  range: {
                    sheetId: sheetId,
                    startRowIndex: 1, // 跳过标题行
                    startColumnIndex: 0,
                    endColumnIndex: 4,
                  },
                  sortSpecs: [
                    {
                      dimensionIndex: 0, // 按流水號排序
                      sortOrder: "ASCENDING",
                    },
                  ],
                },
              },
            ],
          }),
        }
      );

      if (!sortResponse.ok) {
        console.warn("SheetService: 排序失败，但不影响添加操作");
      }

      return newStudent;
    } catch (error) {
      console.error("SheetService: 添加学员时发生错误:", error);
      throw error;
    }
  }
}

export const sheetService = new SheetService();
