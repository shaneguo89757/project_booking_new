'use client';

import { useState, useEffect } from 'react';
import { Calendar } from '@/components/Calendar';
import { BookingDialog } from '@/components/BookingDialog';
import { AddStudentDialog } from '@/components/AddStudentDialog';
import { localStorageService, type Booking, type Student } from '@/services/localStorageService';
import { format } from 'date-fns';
import { UserPlusIcon, TableCellsIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import { StudentList } from '@/components/StudentList';
import { EditStudentDialog } from '@/components/EditStudentDialog';
import { BookingListView } from '@/components/BookingListView';
import type { BookingInfo } from '@/types/booking';

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

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleStartClass = async () => {
    if (!selectedDate) return;

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    localStorageService.addClassDay(dateStr);
    setBookings(localStorageService.getBookings());
    setSelectedDate(null);
  };

  const handleCloseClass = async () => {
    if (!selectedDate) return;

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const result = localStorageService.closeClassDay(dateStr);
    
    if (result.success) {
      setBookings(localStorageService.getBookings());
      setSelectedDate(null);
      setError(null);
    } else {
      setError(result.error || '關閉課程失敗');
    }
  };

  const handleAddStudent = (name: string) => {
    localStorageService.addStudent(name);
    setStudents(localStorageService.getStudents());
  };

  const handleRemoveStudent = (studentName: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const result = localStorageService.removeStudentFromBooking(studentName, dateStr);
    if (result.success) {
      setBookings(localStorageService.getBookings());
      setError(null);
    } else {
      setError(result.error || '移除學生失敗');
    }
  };

  const handleAddBookingStudent = (studentIds: string[], date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const result = localStorageService.addStudentBooking(studentIds[0], [dateStr]);
    if (result.success && studentIds.length > 1) {
      // 添加剩餘的學生
      for (let i = 1; i < studentIds.length; i++) {
        const additionalResult = localStorageService.addStudentBooking(studentIds[i], [dateStr]);
        if (!additionalResult.success) {
          setError(additionalResult.error || '部分學生添加失敗');
          break;
        }
      }
    }
    
    if (result.success) {
      setBookings(localStorageService.getBookings());
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

  // 轉換 Booking[] 為 BookingInfo[]
  const transformedBookings: BookingInfo[] = bookings.map(booking => ({
    date: booking.date,
    students: booking.students.map(student => student.name),
    isClassDay: booking.isClassDay,
  }));

  if (!isClient) {
    return null; // 或顯示載入中的畫面
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">課程預約系統</h1>
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
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'calendar' ? (
          <div>
            <div className="mb-4 flex justify-end">
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
          <StudentList
            students={students}
            onAddStudent={() => setIsAddStudentOpen(true)}
            onEditStudent={handleEditStudent}
            onDeleteStudent={handleDeleteStudent}
          />
        )}

        {selectedDate && (
          <BookingDialog
            isOpen={!!selectedDate}
            onClose={() => {
              setSelectedDate(null);
              setError(null);
            }}
            date={selectedDate}
            students={
              bookings.find(
                b => b.date === format(selectedDate, 'yyyy-MM-dd')
              )?.students.map(s => s.name) || []
            }
            isClassDay={bookings.some(
              b => b.date === format(selectedDate, 'yyyy-MM-dd')
            )}
            onStartClass={handleStartClass}
            onCloseClass={handleCloseClass}
            onRemoveStudent={(studentName) => handleRemoveStudent(studentName, selectedDate)}
            onAddStudent={(studentIds) => handleAddBookingStudent(studentIds, selectedDate)}
            allStudents={students}
            error={error}
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
      </main>
    </div>
  );
} 