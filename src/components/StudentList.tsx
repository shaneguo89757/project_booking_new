import type { Student } from '@/services/sheetService';
import { ArrowPathIcon, PencilIcon, TrashIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { useMemo, useState } from 'react';

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
  const { groupedStudents, indices, totalActive, totalInactive } = useMemo(() => {
    console.log("StudentList: 处理学员数据，总数:", students.length);
    const filteredStudents = students
      .filter(student => 
        searchTerm === '' || 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.instagram && student.instagram.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    
    const grouped: GroupedStudents = {};
    let activeCount = 0;
    let inactiveCount = 0;
    
    filteredStudents.forEach(student => {
      // 計算活躍/非活躍學生數量
      if (student.active) {
        activeCount++;
      } else {
        inactiveCount++;
      }
      console.log(`StudentList: 学员 ${student.name} 状态:`, student.active ? "活跃" : "停用");

      // 按姓名首字母分組
      const firstChar = student.name.charAt(0);
      if (!grouped[firstChar]) {
        grouped[firstChar] = [];
      }
      grouped[firstChar].push(student);
    });

    // 對每個組內的學生按姓名排序
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => {
        // 首先按活躍狀態排序（活躍的排在前面）
        if (a.active !== b.active) {
          return a.active ? -1 : 1;
        }
        // 然後按姓名排序
        return a.name.localeCompare(b.name);
      });
    });

    console.log("StudentList: 统计完成 -", 
      "活跃:", activeCount,
      "停用:", inactiveCount
    );

    return {
      groupedStudents: grouped,
      indices: Object.keys(grouped).sort(),
      totalActive: activeCount,
      totalInactive: inactiveCount,
    };
  }, [students, searchTerm]);

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">學員管理</h2>
            <div className="text-sm text-gray-500 mt-1">
              共 {students.length} 位學員 
              <span className="ml-2 text-green-600">({totalActive} 位活躍</span>
              <span className="ml-1 text-red-600">{totalInactive} 位停用)</span>
            </div>
          </div>
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
                      className={`px-4 py-3 flex justify-between items-center hover:bg-gray-50 ${
                        !student.active ? 'opacity-60' : ''
                      }`}
                    >
                      <div>
                        <div className="flex items-center">
                          <span className="text-gray-900">{student.name}</span>
                          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                            student.active 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {student.active ? '啟用' : '停用'}
                          </span>
                        </div>
                        {student.instagram && (
                          <a
                            href={`https://instagram.com/${student.instagram}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block mt-0.5 text-xs text-blue-500 hover:text-blue-700"
                          >
                            {student.instagram}
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {onEditStudent && (
                          <button
                            onClick={() => onEditStudent(student)}
                            className="p-1 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50"
                            title="編輯學員"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                        )}
                        {onDeleteStudent && student.active && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log("Delete button clicked for student:", student);
                              onDeleteStudent(student);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50"
                            title={student.active ? "停用學員" : "學員已停用"}
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