import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import type { Student } from '@/services/localStorageService';
import { CheckIcon } from '@heroicons/react/24/outline';

interface AddBookingStudentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onAdd: (studentIds: string[]) => void;
  existingStudentIds: string[];
}

export const AddBookingStudentDialog = ({
  isOpen,
  onClose,
  students,
  onAdd,
  existingStudentIds,
}: AddBookingStudentDialogProps) => {
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

  const availableStudents = students.filter(
    student => !existingStudentIds.includes(student.id)
  );

  const handleAdd = () => {
    if (selectedStudents.size > 0) {
      onAdd(Array.from(selectedStudents));
      setSelectedStudents(new Set());
      onClose();
    }
  };

  const toggleStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-20" onClose={onClose}>
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
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 mb-2"
                >
                  選擇學生
                </Dialog.Title>
                <p className="text-sm text-gray-500 mb-4">
                  可以選擇多位學生一起添加
                </p>

                {availableStudents.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">沒有可添加的學生</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 mb-6">
                    {availableStudents.map((student) => (
                      <button
                        key={student.id}
                        onClick={() => toggleStudent(student.id)}
                        className={`p-2 rounded-lg border text-left relative ${
                          selectedStudents.has(student.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <span>{student.name}</span>
                        {selectedStudents.has(student.id) && (
                          <CheckIcon className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-blue-500" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    已選擇 {selectedStudents.size} 位學生
                  </span>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                      onClick={onClose}
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                        selectedStudents.size > 0
                          ? 'bg-blue-100 text-blue-900 hover:bg-blue-200 focus-visible:ring-blue-500'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                      onClick={handleAdd}
                      disabled={selectedStudents.size === 0}
                    >
                      添加
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}; 