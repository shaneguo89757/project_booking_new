import { useMemo, useState } from 'react';
import { UserPlusIcon, PencilIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import type { Student } from '@/services/sheetService';

interface StudentListProps {
  students: Student[];
  onAddStudent: () => void;
  onEditStudent?: (student: Student) => void;
  onDeleteStudent?: (student: Student) => void;
  onSync?: () => Promise<void>;
  isLoading?: boolean;
}

interface GroupedStudents {
  [key: string]: Student[];
}

export const StudentList = ({
  students,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onSync,
  isLoading = false,
}: StudentListProps) => {
  const [selectedIndex, setSelectedIndex] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 過濾和分組學生
  const { groupedStudents, indices } = useMemo(() => {
    const filteredStudents = students
      .filter(student => 
        (searchTerm === '' || 
         student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         student.instagram?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    
    const grouped: GroupedStudents = {};
    
    filteredStudents.forEach(student => {
      const firstChar = student.name.charAt(0);
      if (!grouped[firstChar]) {
        grouped[firstChar] = [];
      }
      grouped[firstChar].push(student);
    });

    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => a.name.localeCompare(b.name));
    });

    return {
      groupedStudents: grouped,
      indices: Object.keys(grouped).sort(),
    };
  }, [students, searchTerm]);

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">學員管理</h2>
          <div className="flex items-center space-x-2">
            {onSync && (
              <button
                onClick={onSync}
                disabled={isLoading}
                className={`inline-flex items-center px-3 py-1.5 rounded-lg
                  ${isLoading 
                    ? 'bg-gray-100 text-gray-400'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
              >
                <ArrowPathIcon className={`w-5 h-5 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? '同步中...' : '同步資料'}
              </button>
            )}
            <button
              onClick={onAddStudent}
              className="inline-flex items-center px-3 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200"
            >
              <UserPlusIcon className="w-5 h-5 mr-1" />
              新增學員
            </button>
          </div>
        </div>

        {/* 搜尋欄 */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜尋學員姓名或 IG..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="flex">
        <div className="flex-1 overflow-y-auto max-h-[70vh]">
          {indices.length > 0 ? (
            indices.map(index => (
              <div key={index} id={`index-${index}`}>
                <div className="sticky top-0 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-500">
                  {index}
                </div>
                <ul className="divide-y divide-gray-100">
                  {groupedStudents[index].map(student => (
                    <li
                      key={student.id}
                      className="px-4 py-3 flex justify-between items-center hover:bg-gray-50"
                    >
                      <div>
                        <span className="text-gray-900">{student.name}</span>
                        {student.instagram && (
                          <span className="ml-2 text-sm text-gray-500">
                            @{student.instagram}
                          </span>
                        )}
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                          student.active 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {student.active ? '啟用' : '停用'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {onEditStudent && (
                          <button
                            onClick={() => onEditStudent(student)}
                            className="p-1 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                        )}
                        {onDeleteStudent && (
                          <button
                            onClick={() => onDeleteStudent(student)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? '找不到符合的學員' : '尚無學員資料'}
            </div>
          )}
        </div>

        {/* 右側索引列表 */}
        {indices.length > 0 && (
          <div className="w-6 flex flex-col justify-center text-center text-xs font-medium sticky top-0 h-[70vh] bg-white">
            {indices.map(index => (
              <button
                key={index}
                className={`py-0.5 ${
                  selectedIndex === index
                    ? 'text-blue-600'
                    : 'text-gray-400 hover:text-gray-900'
                }`}
                onClick={() => {
                  setSelectedIndex(index);
                  document.getElementById(`index-${index}`)?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {index}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 