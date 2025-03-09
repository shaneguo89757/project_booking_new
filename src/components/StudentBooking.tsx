import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar } from './Calendar';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface Student {
  id: string;
  name: string;
}

interface ClassDay {
  date: string;
  currentBookings: number;
  maxBookings: number;
}

interface StudentBookingProps {
  students: Student[];
  classDays: ClassDay[];
  onSaveBookings: (studentId: string, dates: string[]) => void;
}

export const StudentBooking = ({
  students,
  classDays,
  onSaveBookings,
}: StudentBookingProps) => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const newSelectedDates = new Set(selectedDates);
    
    if (newSelectedDates.has(dateStr)) {
      newSelectedDates.delete(dateStr);
    } else {
      const classDay = classDays.find(day => day.date === dateStr);
      if (classDay && classDay.currentBookings < classDay.maxBookings) {
        newSelectedDates.add(dateStr);
      }
    }
    
    setSelectedDates(newSelectedDates);
  };

  const handleSave = () => {
    if (selectedStudent) {
      onSaveBookings(selectedStudent.id, Array.from(selectedDates));
      setSelectedDates(new Set());
    }
  };

  const bookings = classDays.map(day => ({
    date: day.date,
    students: [],
    isClassDay: true,
    currentBookings: day.currentBookings,
    maxBookings: day.maxBookings,
  }));

  return (
    <div className="p-4">
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">選擇學員</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {students.map((student) => (
            <button
              key={student.id}
              onClick={() => setSelectedStudent(student)}
              className={`
                p-2 rounded-lg border text-left
                ${
                  selectedStudent?.id === student.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }
              `}
            >
              {student.name}
            </button>
          ))}
        </div>
      </div>

      {selectedStudent && (
        <>
          <div className="mb-4">
            <h3 className="text-lg font-medium">選擇上課日期</h3>
            <p className="text-sm text-gray-500">
              點擊日期進行選擇，再次點擊可取消選擇
            </p>
          </div>

          <Calendar
            bookings={bookings}
            onDateClick={handleDateClick}
          />

          <div className="mt-4 space-y-2">
            <h4 className="font-medium">已選擇的日期:</h4>
            <div className="flex flex-wrap gap-2">
              {Array.from(selectedDates).map(date => (
                <div
                  key={date}
                  className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full"
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  {format(new Date(date), 'MM/dd')}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleSave}
              disabled={selectedDates.size === 0}
              className={`
                w-full py-2 px-4 rounded-lg font-medium
                ${
                  selectedDates.size > 0
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              保存預約
            </button>
          </div>
        </>
      )}
    </div>
  );
}; 