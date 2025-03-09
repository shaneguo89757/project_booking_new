import { useMemo, useState } from 'react';
import type { Student } from '@/services/localStorageService';
import { UserPlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface StudentListProps {
  students: Student[];
  onAddStudent: () => void;
  onEditStudent?: (student: Student) => void;
  onDeleteStudent?: (student: Student) => void;
}

interface GroupedStudents {
  [key: string]: Student[];
}

export const StudentList = ({
  students,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
}: StudentListProps) => {
  const [selectedIndex, setSelectedIndex] = useState<string | null>(null);

  // 按照姓名分組並排序
  const { groupedStudents, indices } = useMemo(() => {
    const grouped: GroupedStudents = {};
    
    // 獲取每個學生的首字
    students.forEach(student => {
      const firstChar = student.name.charAt(0);
      if (!grouped[firstChar]) {
        grouped[firstChar] = [];
      }
      grouped[firstChar].push(student);
    });

    // 對每個組內的學生進行排序
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => a.name.localeCompare(b.name));
    });

    // 獲取並排序索引
    const sortedIndices = Object.keys(grouped).sort();

    return {
      groupedStudents: grouped,
      indices: sortedIndices,
    };
  }, [students]);

  const scrollToIndex = (index: string) => {
    const element = document.getElementById(`index-${index}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setSelectedIndex(index);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">學員管理</h2>
        <button
          onClick={onAddStudent}
          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200"
        >
          <UserPlusIcon className="w-5 h-5 mr-1" />
          新增學員
        </button>
      </div>

      <div className="flex">
        {/* 主要列表區域 */}
        <div className="flex-1 overflow-y-auto max-h-[70vh]">
          {indices.map(index => (
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
                    <span className="text-gray-900">{student.name}</span>
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
          ))}
        </div>

        {/* 右側索引列表 */}
        <div className="w-6 flex flex-col justify-center text-center text-xs font-medium sticky top-0 h-[70vh] bg-white">
          {indices.map(index => (
            <button
              key={index}
              className={`py-0.5 ${
                selectedIndex === index
                  ? 'text-blue-600'
                  : 'text-gray-400 hover:text-gray-900'
              }`}
              onClick={() => scrollToIndex(index)}
            >
              {index}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}; 