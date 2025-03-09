import { Fragment, useState } from 'react';
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
  onStartClass: () => void;
  onCloseClass: () => void;
  onRemoveStudent: (studentName: string) => void;
  onAddStudent: (studentIds: string[]) => void;
  allStudents: Student[];
  error?: string | null;
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
}: BookingDialogProps) => {
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);

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
                        onClick={onCloseClass}
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
                      {students.map((student, index) => (
                        <li
                          key={index}
                          className="p-2 bg-gray-50 rounded-lg flex justify-between items-center"
                        >
                          <span>{student}</span>
                          <button
                            onClick={() => onRemoveStudent(student)}
                            className="text-gray-400 text-red-500 p-1 rounded-full bg-red-100 hover:bg-red-300"
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
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={onStartClass}
                    >
                      今日開課吧!
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
                  onAdd={onAddStudent}
                  existingStudentIds={allStudents
                    .filter(s => students.includes(s.name))
                    .map(s => s.id)}
                />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}; 