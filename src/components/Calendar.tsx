import { useState, useMemo, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, SlotInfo, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, setDefaultOptions } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { BookmarkIcon } from '@heroicons/react/24/solid';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// 設定 date-fns 的預設選項，將每週起始日設為星期一
setDefaultOptions({ weekStartsOn: 1 });

interface BookingInfo {
  date: string;
  students: string[];
  isClassDay: boolean;
}

interface CalendarProps {
  bookings: BookingInfo[];
  onDateClick: (date: Date) => void;
  maxStudents?: number;
}

interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: {
    isFull: boolean;
    studentCount: number;
    isClassDay: boolean;
  };
}

const locales = {
  'zh-TW': zhTW,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

export const Calendar = ({ 
  bookings, 
  onDateClick,
  maxStudents = 7 
}: CalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDesktop, setIsDesktop] = useState(false);

  // 檢測視窗大小
  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024); // 1024px 為桌面版的斷點
    };

    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  // 將 bookings 轉換為 react-big-calendar 的事件格式
  const events = useMemo(() => 
    bookings.map(booking => {
      const date = parse(booking.date, 'yyyy-MM-dd', new Date());
      const studentCount = booking.students.length;
      const isFull = studentCount >= maxStudents;

      // 根據螢幕大小決定顯示的文字
      const title = isDesktop 
        ? `已預約 ${studentCount} 人`
        : `${studentCount}`;

      return {
        title,
        start: date,
        end: date,
        allDay: true,
        resource: {
          isFull,
          studentCount,
          isClassDay: booking.isClassDay,
        },
      };
    }),
  [bookings, maxStudents, isDesktop]);

  const eventPropGetter = (event: CalendarEvent) => {
    const isFull = event.resource.isFull;
    const isClassDay = event.resource.isClassDay;

    if (!isClassDay) return {};

    return {
      className: 'cursor-default pointer-events-none select-none',
      style: {
        backgroundColor: 'transparent',
        color: isFull ? '#B91C1C' : '#15803D',
        border: 'none',
        borderRadius: '0.25rem',
        padding: '2px',
      },
    };
  };

  const dayPropGetter = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const isClassDay = bookings.some(booking => booking.date === dateStr && booking.isClassDay);

    return {
      className: '',
      style: {
        backgroundColor: isClassDay ? '#EFF6FF' : '#F9FAFB',
      }
    };
  };

  const components = {
    event: (props: { event: CalendarEvent }) => (
      <div className="flex items-center justify-center gap-0.5 h-full text-xs">
        <BookmarkIcon className="w-3.5 h-3.5" />
        <span className="font-medium">{props.event.title}</span>
      </div>
    ),
  };

  const handleNavigate = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        {/* 年月標題 */}
        <h2 className="text-2xl font-semibold text-gray-900 text-center mb-4">
          {format(currentDate, 'yyyy年 M月')}
        </h2>
        
        {/* 導航按鈕 */}
        <div className="flex justify-end items-center space-x-2">
          <button
            onClick={() => setCurrentDate(new Date())}
            className={`px-3 py-1.5 text-sm rounded-lg ${
              isToday(currentDate)
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            今天
          </button>
          <button
            onClick={handlePrevMonth}
            className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            上個月
          </button>
          <button
            onClick={handleNextMonth}
            className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            下個月
          </button>
        </div>
      </div>

      <div className="h-[600px]">
        <BigCalendar
          localizer={localizer}
          events={events}
          view="month"
          views={['month']}
          date={currentDate}
          onNavigate={handleNavigate}
          toolbar={false}
          onSelectSlot={(slotInfo: SlotInfo) => {
            onDateClick(slotInfo.start);
          }}
          selectable
          popup={false}
          eventPropGetter={eventPropGetter}
          dayPropGetter={dayPropGetter}
          components={components}
          className="h-full"
        />
      </div>
    </div>
  );
}; 