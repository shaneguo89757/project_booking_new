'use client';

import { AddStudentDialog } from '@/components/AddStudentDialog';
import { BookingDialog } from '@/components/BookingDialog';
import { BookingListView } from '@/components/BookingListView';
import { Calendar } from '@/components/Calendar';
import { EditStudentDialog } from '@/components/EditStudentDialog';
import { GoogleLogin } from '@/components/GoogleLogin';
import { StudentList } from '@/components/StudentList';
import { APP_VERSION } from '@/config/version';
import type { DataServiceState } from '@/services/dataService';
import { dataService } from '@/services/dataService';
import type { Student } from '@/services/sheetService';
import { normalizeDate } from '@/utils/dateUtils';
import { ArrowPathIcon, ListBulletIcon, TableCellsIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Home() {
  const [view, setView] = useState<'calendar' | 'students'>('calendar');
  const [calendarView, setCalendarView] = useState<'grid' | 'list'>('grid');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [autoSync, setAutoSync] = useState(false);
  const searchParams = useSearchParams();
  const [state, setState] = useState<DataServiceState>(dataService.getState());

  // 訂閱數據變化
  useEffect(() => {
    return dataService.subscribe(setState);
  }, []);

  // 處理重定向後的登入狀態
  useEffect(() => {
    const token = searchParams.get('access_token');
    if (token) {
      handleLoginSuccess(token);
      // 清除 URL 中的 token
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams]);

  // 載入儲存的自動同步設定
  useEffect(() => {
    const savedAutoSync = localStorage.getItem('autoSync');
    if (savedAutoSync) {
      setAutoSync(JSON.parse(savedAutoSync));
    }
  }, []);

  // 自動同步設定
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoSync && state.isAuthenticated) {
      interval = setInterval(() => {
        dataService.syncAll();
      }, 5 * 60 * 1000); // 每5分鐘同步一次
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoSync, state.isAuthenticated]);

  // 當切換到學員管理視圖時自動同步
  useEffect(() => {
    if (view === 'students' && state.isAuthenticated && state.spreadsheetId) {
      dataService.syncAll();
    }
  }, [view, state.isAuthenticated, state.spreadsheetId]);

  const handleLoginSuccess = (token: string) => {
    dataService.setAccessToken(token);
  };

  const handleSpreadsheetIdChange = (id: string) => {
    dataService.setSpreadsheetId(id);
  };

  const handleAutoSyncChange = (enabled: boolean) => {
    setAutoSync(enabled);
    localStorage.setItem('autoSync', JSON.stringify(enabled));
  };

  const handleStartClass = async (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    await dataService.startClass(dateStr);
    setSelectedDate(null);
  };

  const handleCloseClass = async (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    await dataService.closeClass(dateStr);
    setSelectedDate(null);
  };

  const handleAddStudent = async (name: string) => {
    await dataService.addStudent(name);
  };

  const handleRemoveStudent = async (studentId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    await dataService.removeBooking(studentId, dateStr);
  };

  const handleAddBookingStudent = async (studentIds: string[], date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    await dataService.addBooking(studentIds[0], [dateStr]);
  };

  const handleDeleteStudent = async (student: Student) => {
    if (confirm(`確定要刪除學生 ${student.name} 嗎？`)) {
      await dataService.deleteStudent(student.id);
    }
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
  };

  const handleSaveEditStudent = async (newName: string) => {
    if (!editingStudent) return;
    await dataService.editStudent(editingStudent.id, newName);
    setEditingStudent(null);
  };

  // 轉換資料為行事曆格式
  const transformedBookings = state.bookings.map(booking => ({
    date: booking.date,
    students: booking.students.map(s => s.name),
    isClassDay: booking.isClassDay,
  }));

  if (!state.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">課程預約系統</h1>
          <GoogleLogin
            onSuccess={handleLoginSuccess}
            onError={(error) => setState(prev => ({ ...prev, error }))}
          />
        </div>
      </div>
    );
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
              {state.isAuthenticated && (
                <button
                  onClick={() => dataService.logout()}
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
                onClick={() => dataService.syncAll()}
                disabled={state.isLoading}
                className={`inline-flex items-center px-4 py-2 rounded-lg ${
                  state.isLoading
                    ? 'bg-gray-100 text-gray-400'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                <ArrowPathIcon 
                  className={`w-5 h-5 mr-2 ${state.isLoading ? 'animate-spin' : ''}`} 
                />
                {state.isLoading ? '同步中...' : '同步資料'}
              </button>
            </div>

            {calendarView === 'grid' ? (
              <Calendar 
                bookings={transformedBookings} 
                onDateClick={setSelectedDate}
                maxStudents={7}
              />
            ) : (
              <BookingListView bookings={transformedBookings} />
            )}
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-500">
              已載入 {state.students.length || 0} 位學生
            </div>
            
            <StudentList
              students={state.students}
              onAddStudent={() => setIsAddStudentOpen(true)}
              onEditStudent={handleEditStudent}
              onDeleteStudent={handleDeleteStudent}
              onSync={() => dataService.syncAll()}
              isLoading={state.isLoading}
            />
          </>
        )}

        {selectedDate && (
          <BookingDialog
            isOpen={!!selectedDate}
            onClose={() => setSelectedDate(null)}
            date={selectedDate}
            students={
              state.bookings
                .filter(b => normalizeDate(b.date) === normalizeDate(selectedDate))
                .flatMap(b => b.students.map(s => s.id))
            }
            isClassDay={
              state.classDays.some(
                d => normalizeDate(d.date) === normalizeDate(selectedDate)
              )
            }
            onStartClass={handleStartClass}
            onCloseClass={handleCloseClass}
            onRemoveStudent={handleRemoveStudent}
            onAddStudent={handleAddBookingStudent}
            allStudents={state.students}
            error={state.error}
            isLoading={state.isLoading}
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
              onClick={() => dataService.syncAll()}
              disabled={state.isLoading || !state.spreadsheetId}
              className={`
                inline-flex items-center px-4 py-2 rounded-lg
                ${state.isLoading || !state.spreadsheetId
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'}
              `}
            >
              {state.isLoading ? (
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
            value={state.spreadsheetId || ''}
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

        {state.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {state.error}
          </div>
        )}
      </main>
    </div>
  );
} 