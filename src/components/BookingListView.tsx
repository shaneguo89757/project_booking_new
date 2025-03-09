import { format } from 'date-fns';
import type { BookingInfo } from '@/types/booking';

interface BookingListViewProps {
  bookings: BookingInfo[];
}

export const BookingListView = ({ bookings }: BookingListViewProps) => {
  // 過濾出有開課的日期，並按日期排序
  const activeBookings = bookings
    .filter(booking => booking.isClassDay)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (activeBookings.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        目前沒有開課的日期
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow divide-y">
      {activeBookings.map((booking) => (
        <div key={booking.date} className="p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {format(new Date(booking.date), 'yyyy-MM-dd')}
          </h3>
          {booking.students.length > 0 ? (
            <ul className="space-y-1 pl-4">
              {booking.students.map((student, index) => (
                <li key={index} className="text-gray-600">
                  - {student}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 pl-4">尚無學生預約</p>
          )}
        </div>
      ))}
    </div>
  );
}; 