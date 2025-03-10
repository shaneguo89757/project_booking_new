import { Fragment, useState, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { format } from 'date-fns';
import { BookmarkSlashIcon as LeaveIcon } from '@heroicons/react/24/outline';
import { TrashIcon } from '@heroicons/react/24/outline';
import { PlusIcon } from '@heroicons/react/24/outline';
import { AddBookingStudentDialog } from './AddBookingStudentDialog';
import type { Student } from '@/services/localStorageService';

interface BookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  students: string[];
  isClassDay: boolean;
  onStartClass: (date: Date) => void;
  onCloseClass: (date: Date) => void;
  onRemoveStudent: (studentId: string, date: Date) => void;
  onAddStudent: (studentIds: string[], date: Date) => void;
  allStudents: Student[];
  error?: string | null;
  isLoading?: boolean;
}

export const BookingDialog = ({
  isOpen,
  onClose,
  date,
  students,
  isClassDay,
  onStartClass,
  onCloseClass,
  onRemoveStudent,
  onAddStudent,
  allStudents,
  error,
  isLoading = false,
}: BookingDialogProps) => {
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);

  const bookedStudents = useMemo(() => {
    return students.map(studentId => 
      allStudents.find(s => s.id === studentId)
    ).filter((s): s is Student => s !== undefined);
  }, [students, allStudents]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900"
                    >
                      {format(date, 'yyyy年MM月dd日')}の課程
                    </Dialog.Title>
                  </div>
                  {isClassDay && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">今天不想上班...</span>
                      <button
                        onClick={() => onCloseClass(date)}
                        className="text-gray-500 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
                        title="關閉課程"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                {isClassDay ? (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-700">上課學員:</h4>
                      <button
                        onClick={() => setIsAddStudentOpen(true)}
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                      >
                        <PlusIcon className="w-4 h-4 mr-1" />
                        添加學生
                      </button>
                    </div>
                    <ul className="space-y-2">
                      {bookedStudents.map((student) => (
                        <li
                          key={student.id}
                          className="p-2 bg-gray-50 rounded-lg flex justify-between items-center"
                        >
                          <div>
                            <span>{student.name}</span>
                            {student.instagram && (
                              <span className="ml-2 text-sm text-gray-500">
                                @{student.instagram}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => onRemoveStudent(student.id, date)}
                            className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-100"
                          >
                            <LeaveIcon className="w-4 h-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 mb-4">今日未安排課程</p>
                    <button
                      type="button"
                      className="inline-flex justify-center items-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => onStartClass(date)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          處理中...
                        </>
                      ) : (
                        '今日開課吧!'
                      )}
                    </button>
                  </div>
                )}

                <div className="mt-4">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    關閉
                  </button>
                </div>

                <AddBookingStudentDialog
                  isOpen={isAddStudentOpen}
                  onClose={() => setIsAddStudentOpen(false)}
                  students={allStudents}
                  onAdd={(studentIds) => onAddStudent(studentIds, date)}
                  existingStudentIds={students}
                />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}; 