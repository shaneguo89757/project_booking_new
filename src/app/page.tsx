'use client';

import { useState, useEffect, useMemo } from 'react';
import { Calendar } from '@/components/Calendar';
import { BookingDialog } from '@/components/BookingDialog';
import { AddStudentDialog } from '@/components/AddStudentDialog';
import { localStorageService, type Booking, type Student } from '@/services/localStorageService';
import { format } from 'date-fns';
import { UserPlusIcon, TableCellsIcon, ListBulletIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { StudentList } from '@/components/StudentList';
import { EditStudentDialog } from '@/components/EditStudentDialog';
import { BookingListView } from '@/components/BookingListView';
import type { BookingInfo } from '@/types/booking';
import { APP_VERSION } from '@/config/version';
import { GoogleLogin } from '@/components/GoogleLogin';
import { sheetService } from '@/services/sheetService';
import { normalizeDate } from '@/utils/dateUtils';
import { useSearchParams } from 'next/navigation';

interface SyncHistory {
  timestamp: number;
  status: 'success' | 'error';
  message?: string;
}

interface SyncedData {
  classDays: ClassDay[];
  bookings: Booking[];
  students: Student[];
}

export default function Home() {
  const [view, setView] = useState<'calendar' | 'students'>('calendar');
  const [calendarView, setCalendarView] = useState<'grid' | 'list'>('grid');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [spreadsheetId, setSpreadsheetId] = useState<string>('');
  const [sheetData, setSheetData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const [syncHistory, setSyncHistory] = useState<SyncHistory[]>([]);
  const [syncedData, setSyncedData] = useState<SyncedData | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const searchParams = useSearchParams();

  // 檢查是否在客戶端
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 載入初始資料
  useEffect(() => {
    if (isClient) {
      setBookings(localStorageService.getBookings());
      setStudents(localStorageService.getStudents());
    }
  }, [isClient]);

  // 載入儲存的設定
  useEffect(() => {
    const savedId = localStorage.getItem('spreadsheetId');
    if (savedId) setSpreadsheetId(savedId);
    
    const savedAutoSync = localStorage.getItem('autoSync');
    if (savedAutoSync) setAutoSync(JSON.parse(savedAutoSync));
  }, []);

  // 在組件載入時檢查 localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('accessToken');
    if (savedToken) {
      setAccessToken(savedToken);
      sheetService.setAccessToken(savedToken);
      setIsAuthenticated(true);
    }
  }, []);

  // 自動同步設定
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoSync && isAuthenticated) {
      interval = setInterval(() => {
        handleSync();
      }, 5 * 60 * 1000); // 每5分鐘同步一次
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoSync, isAuthenticated]);

  // 當切換到學員管理視圖時自動同步
  useEffect(() => {
    if (view === 'students' && isAuthenticated && spreadsheetId) {
      handleSync();
    }
  }, [view, isAuthenticated, spreadsheetId]);

  // 處理重定向後的登入狀態
  useEffect(() => {
    const token = searchParams.get('access_token');
    if (token) {
      handleLoginSuccess(token);
      // 清除 URL 中的 token
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams]);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleStartClass = async (date: Date) => {
    if (!spreadsheetId || !accessToken) {
      setError('尚未設定試算表 ID 或未登入');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const dateStr = format(date, 'yyyy-MM-dd');
      console.log('Starting class for date:', dateStr);
      
      await sheetService.addClassDay(spreadsheetId, dateStr);
      console.log('Class added successfully');
      
      await handleSync();
      setSelectedDate(null);
    } catch (error) {
      console.error('Error starting class:', error);
      setError(error instanceof Error ? error.message : '開課失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseClass = async (date: Date) => {
    if (!spreadsheetId || !accessToken) {
      setError('尚未設定試算表 ID 或未登入');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const dateStr = format(date, 'yyyy-M-d');
      console.log('Attempting to delete class for date:', dateStr);
      
      await sheetService.deleteClassDay(spreadsheetId, dateStr);
      console.log('Class deleted successfully');
      
      // 重新同步資料
      await handleSync();
      setSelectedDate(null);
    } catch (error) {
      console.error('Error closing class:', error);
      setError(error instanceof Error ? error.message : '關閉課程失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStudent = (name: string) => {
    localStorageService.addStudent(name);
    setStudents(localStorageService.getStudents());
  };

  const handleRemoveStudent = async (studentId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    // TODO: 實作 Google Sheet API 移除學生預約
    const result = localStorageService.removeStudentFromBooking(studentId, dateStr);
    if (result.success) {
      await handleSync(); // 重新同步資料
      setError(null);
    } else {
      setError(result.error || '移除學生失敗');
    }
  };

  const handleAddBookingStudent = async (studentIds: string[], date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    // TODO: 實作 Google Sheet API 新增學生預約
    const result = localStorageService.addStudentBooking(studentIds[0], [dateStr]);
    if (result.success) {
      await handleSync(); // 重新同步資料
      setError(null);
    } else {
      setError(result.error || '添加學生失敗');
    }
  };

  const handleDeleteStudent = (student: Student) => {
    if (confirm(`確定要刪除學生 ${student.name} 嗎？`)) {
      const result = localStorageService.deleteStudent(student.id);
      if (result.success) {
        setStudents(localStorageService.getStudents());
      } else {
        alert(result.error);
      }
    }
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
  };

  const handleSaveEditStudent = (newName: string) => {
    if (!editingStudent) return;
    
    const result = localStorageService.editStudent(editingStudent.id, newName);
    if (result.success) {
      setStudents(localStorageService.getStudents());
      setBookings(localStorageService.getBookings());
    } else {
      alert(result.error);
    }
    setEditingStudent(null);
  };

  // 轉換 Google Sheet 資料為行事曆格式
  const transformedBookings: BookingInfo[] = useMemo(() => {
    if (!syncedData) return [];

    // 建立日期對應的預約資料
    const bookingMap = new Map<string, string[]>();
    syncedData.bookings.forEach(booking => {
      if (!bookingMap.has(booking.date)) {
        bookingMap.set(booking.date, []);
      }
      // 找到對應的學生名稱
      const student = syncedData.students.find(s => s.id === booking.studentId);
      if (student) {
        bookingMap.get(booking.date)?.push(student.name);
      }
    });

    // 將開課日期和預約資料合併
    return syncedData.classDays.map(day => ({
      date: day.date,
      students: bookingMap.get(day.date) || [],
      isClassDay: true,
    }));
  }, [syncedData]);

  const handleLoginSuccess = (token: string) => {
    setAccessToken(token);
    sheetService.setAccessToken(token);
    setIsAuthenticated(true);
    // 保存 token 到 localStorage
    localStorage.setItem('accessToken', token);
  };

  const handleSpreadsheetIdChange = (id: string) => {
    setSpreadsheetId(id);
    localStorage.setItem('spreadsheetId', id);
  };

  const handleAutoSyncChange = (enabled: boolean) => {
    setAutoSync(enabled);
    localStorage.setItem('autoSync', JSON.stringify(enabled));
  };

  const addSyncHistory = (status: 'success' | 'error', message?: string) => {
    setSyncHistory(prev => [{
      timestamp: Date.now(),
      status,
      message
    }, ...prev.slice(0, 9)]); // 只保留最近10筆記錄
  };

  const handleSync = async () => {
    if (!spreadsheetId || !accessToken) {
      setError('尚未設定試算表 ID 或未登入');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // 確保每次操作都設定 token
      sheetService.setAccessToken(accessToken);
      const data = await sheetService.syncAll(spreadsheetId);
      setSyncedData(data);
      addSyncHistory('success');
    } catch (error) {
      console.error('Sync error:', error);
      const errorMessage = error instanceof Error ? error.message : '同步失敗';
      setError(errorMessage);
      addSyncHistory('error', errorMessage);
      
      // 如果是認證錯誤，可能需要重新登入
      if (error instanceof Error && error.message.includes('Not authenticated')) {
        setIsAuthenticated(false);
        setAccessToken(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 新增登出函數
  const handleLogout = () => {
    setAccessToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('accessToken');
    // 可能需要清除其他狀態
    setSyncedData(null);
    setSpreadsheetId('');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">課程預約系統</h1>
          <GoogleLogin
            onSuccess={handleLoginSuccess}
            onError={(error) => setError(error)}
          />
        </div>
      </div>
    );
  }

  if (!isClient) {
    return null; // 或顯示載入中的畫面
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">課程預約系統</h1>
              <div className="text-xs text-gray-500 mt-0.5">v{APP_VERSION}</div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsAddStudentOpen(true)}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200"
              >
                <UserPlusIcon className="w-5 h-5 mr-2" />
                新增學員
              </button>
              <div className="space-x-4">
                <button
                  onClick={() => setView('calendar')}
                  className={`px-4 py-2 rounded-lg ${
                    view === 'calendar'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  行事曆
                </button>
                <button
                  onClick={() => setView('students')}
                  className={`px-4 py-2 rounded-lg ${
                    view === 'students'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  學員管理
                </button>
              </div>
              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                >
                  登出
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'calendar' ? (
          <div>
            <div className="mb-4 flex justify-between items-center">
              <div className="inline-flex rounded-lg shadow-sm">
                <button
                  onClick={() => setCalendarView('grid')}
                  className={`inline-flex items-center px-3 py-2 rounded-l-lg border ${
                    calendarView === 'grid'
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <TableCellsIcon className="w-5 h-5 mr-2" />
                  月曆
                </button>
                <button
                  onClick={() => setCalendarView('list')}
                  className={`inline-flex items-center px-3 py-2 rounded-r-lg border-t border-r border-b -ml-px ${
                    calendarView === 'list'
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <ListBulletIcon className="w-5 h-5 mr-2" />
                  列表
                </button>
              </div>
              
              <button
                onClick={handleSync}
                disabled={isLoading}
                className={`inline-flex items-center px-4 py-2 rounded-lg ${
                  isLoading
                    ? 'bg-gray-100 text-gray-400'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                <ArrowPathIcon 
                  className={`w-5 h-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} 
                />
                {isLoading ? '同步中...' : '同步資料'}
              </button>
            </div>

            {calendarView === 'grid' ? (
              <Calendar 
                bookings={transformedBookings} 
                onDateClick={handleDateClick}
                maxStudents={localStorageService.getMaxStudentsPerClass()}
              />
            ) : (
              <BookingListView bookings={transformedBookings} />
            )}
          </div>
        ) : (
          <>
            {/* 加入除錯資訊 */}
            <div className="mb-4 text-sm text-gray-500">
              已載入 {syncedData?.students?.length || 0} 位學生
            </div>
            
            <StudentList
              students={syncedData?.students || []}
              onAddStudent={() => setIsAddStudentOpen(true)}
              onEditStudent={handleEditStudent}
              onDeleteStudent={handleDeleteStudent}
              onSync={handleSync}
              isLoading={isLoading}
            />
          </>
        )}

        {selectedDate && (
          <BookingDialog
            isOpen={!!selectedDate}
            onClose={() => setSelectedDate(null)}
            date={selectedDate || new Date()}
            students={
              syncedData?.bookings
                .filter(b => normalizeDate(b.date) === normalizeDate(selectedDate))
                .map(b => b.studentId) || []
            }
            isClassDay={
              syncedData?.classDays.some(
                d => normalizeDate(d.date) === normalizeDate(selectedDate)
              ) || false
            }
            onStartClass={handleStartClass}
            onCloseClass={handleCloseClass}
            onRemoveStudent={handleRemoveStudent}
            onAddStudent={handleAddBookingStudent}
            allStudents={syncedData?.students || []}
            error={error}
            isLoading={isLoading}
          />
        )}

        <AddStudentDialog
          isOpen={isAddStudentOpen}
          onClose={() => setIsAddStudentOpen(false)}
          onAdd={handleAddStudent}
        />

        {editingStudent && (
          <EditStudentDialog
            isOpen={!!editingStudent}
            onClose={() => setEditingStudent(null)}
            onSave={handleSaveEditStudent}
            student={editingStudent}
          />
        )}

        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">課程預約系統</h1>
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => handleAutoSyncChange(e.target.checked)}
                className="mr-2"
              />
              自動同步 (每5分鐘)
            </label>
            <button
              onClick={handleSync}
              disabled={isLoading || !spreadsheetId}
              className={`
                inline-flex items-center px-4 py-2 rounded-lg
                ${isLoading || !spreadsheetId
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'}
              `}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  同步中...
                </>
              ) : '立即同步'}
            </button>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <input
            type="text"
            value={spreadsheetId}
            onChange={(e) => handleSpreadsheetIdChange(e.target.value)}
            placeholder="請輸入 Google Sheet ID"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <a
            href="https://docs.google.com/spreadsheets"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600"
          >
            開啟 Google Sheets
          </a>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {syncedData && (
          <div className="grid grid-cols-3 gap-6">
            {/* 開課日期 */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-medium mb-4">開課日期</h2>
              <ul className="space-y-2">
                {syncedData.classDays.map((day, index) => (
                  <li key={index} className="px-3 py-2 bg-gray-50 rounded">
                    {day.date}
                  </li>
                ))}
              </ul>
            </div>

            {/* 學生預約 */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-medium mb-4">學生預約</h2>
              <div className="space-y-2">
                {syncedData.bookings.map((booking, index) => (
                  <div key={index} className="px-3 py-2 bg-gray-50 rounded flex justify-between">
                    <span>{booking.date}</span>
                    <span>{
                      syncedData.students.find(s => s.id === booking.studentId)?.name || booking.studentId
                    }</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 學生名冊 */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-medium mb-4">
                學生名冊 ({syncedData.students.length})
              </h2>
              <div className="overflow-y-auto max-h-[600px]">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        編號
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        姓名
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        IG
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        狀態
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {syncedData.students.map((student, index) => (
                      <tr key={student.id} 
                          className={`hover:bg-gray-50 ${!student.active ? 'text-gray-400' : ''}`}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                          {student.id}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                          {student.name}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                          {student.instagram}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${student.active 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                            }`}>
                            {student.active ? '啟用' : '停用'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* 同步歷史記錄 */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-medium mb-4">同步歷史</h2>
              <div className="space-y-2">
                {syncHistory.map((record, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded-lg text-sm ${
                      record.status === 'success'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    <div className="font-medium">
                      {new Date(record.timestamp).toLocaleString()}
                    </div>
                    <div>
                      {record.status === 'success' ? '同步成功' : record.message}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 