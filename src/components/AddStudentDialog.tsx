import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';

interface AddStudentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, instagram: string) => void;
}

export const AddStudentDialog = ({
  isOpen,
  onClose,
  onAdd,
}: AddStudentDialogProps) => {
  const [name, setName] = useState('');
  const [instagram, setInstagram] = useState('');
  const [nameError, setNameError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证名称是否填写
    if (!name.trim()) {
      setNameError('請輸入學員姓名');
      return;
    }
    
    onAdd(name.trim(), instagram.trim());
    setName('');
    setInstagram('');
    setNameError('');
    onClose();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (e.target.value.trim()) {
      setNameError('');
    }
  };

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
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 mb-4"
                >
                  新增學員
                </Dialog.Title>

                <form onSubmit={handleSubmit}>
                  <div className="mt-2 space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        姓名 <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={handleNameChange}
                        placeholder="請輸入學員姓名"
                        className={`w-full px-3 py-2 border ${
                          nameError ? 'border-red-500' : 'border-gray-300'
                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      />
                      {nameError && (
                        <p className="mt-1 text-sm text-red-500">{nameError}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="instagram" className="block text-sm font-medium text-gray-700 mb-1">
                        Instagram
                      </label>
                      <input
                        id="instagram"
                        type="text"
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value)}
                        placeholder="請輸入 Instagram 帳號（選填）"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                      onClick={onClose}
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    >
                      新增
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}; 