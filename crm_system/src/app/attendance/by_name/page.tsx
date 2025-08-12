'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AttendanceRecord {
  _id: string;
  name: string;
  contactInfo: string;
  location: string;
  activity: string;
  createdAt: string;
}

interface PersonSummary {
  name: string;
  contactInfo: string;
  count: number;
  records: AttendanceRecord[];
}

export default function AttendanceByNamePage() {
  const router = useRouter();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [personSummaries, setPersonSummaries] = useState<PersonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAttendanceRecords();
  }, []);

  const fetchAttendanceRecords = async () => {
    try {
      const response = await fetch('/api/attendance/accessible');
      const data = await response.json();
      if (response.ok && data.success) {
        setAttendanceRecords(data.data);
        processPersonSummaries(data.data);
        
        // 如果用户是教练且没有地区权限，显示提示信息
        if (data.data.length === 0 && data.message) {
          console.info(data.message);
        }
      } else {
        console.error('获取数据失败:', data.message || data.error);
        if (response.status === 403) {
          alert('您沒有權限查看出席記錄');
        }
      }
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const processPersonSummaries = (records: AttendanceRecord[]) => {
    const personMap = new Map<string, PersonSummary>();
    
    records.forEach(record => {
      const key = record.name.trim().toLowerCase();
      if (personMap.has(key)) {
        const existing = personMap.get(key)!;
        existing.count += 1;
        existing.records.push(record);
      } else {
        personMap.set(key, {
          name: record.name,
          contactInfo: record.contactInfo,
          count: 1,
          records: [record]
        });
      }
    });

    const summaries = Array.from(personMap.values())
      .sort((a, b) => b.count - a.count); // 按参与次数降序排序
    
    setPersonSummaries(summaries);
  };

  const filteredPersons = personSummaries.filter(person => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      person.name.toLowerCase().includes(searchLower) ||
      person.contactInfo.toLowerCase().includes(searchLower)
    );
  });

  const handlePersonClick = (person: PersonSummary) => {
    // 使用姓名作为ID（URL编码）
    const personId = encodeURIComponent(person.name);
    router.push(`/attendance/person/${personId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* 頁面標題和搜索框 */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📋 按姓名分類
          </h1>
          <p className="text-gray-600">
            查看所有參與者的出席統計，點擊姓名查看詳細記錄
          </p>
        </div>
        
        {/* 右上角小型搜索框 */}
        <div className="relative">
          <input
            type="text"
            placeholder="搜索姓名或聯絡方式..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setSearchTerm('');
                e.currentTarget.blur();
              }
            }}
            className="w-64 px-4 py-2 pl-10 pr-10 text-sm border border-gray-300 rounded-full bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:shadow-md"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {/* 搜索結果提示 */}
          {searchTerm && (
            <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs text-gray-600 whitespace-nowrap z-10">
              找到 <span className="font-semibold text-blue-600">{filteredPersons.length}</span> 位參與者
            </div>
          )}
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">總參與人數</h3>
          <p className="text-3xl font-bold text-blue-600">
            {personSummaries.length} 人
          </p>
        </div>
        <div className="bg-green-50 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-green-800 mb-2">總出席次數</h3>
          <p className="text-3xl font-bold text-green-600">
            {attendanceRecords.length} 次
          </p>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-purple-800 mb-2">平均出席次數</h3>
          <p className="text-3xl font-bold text-purple-600">
            {personSummaries.length > 0 ? (attendanceRecords.length / personSummaries.length).toFixed(1) : '0'} 次
          </p>
        </div>
      </div>

      {/* 人員列表 */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            參與者列表 ({filteredPersons.length} 人)
            {searchTerm && personSummaries.length !== filteredPersons.length && (
              <span className="text-sm text-gray-500 ml-2">
                (總共 {personSummaries.length} 人)
              </span>
            )}
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  姓名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  聯絡方式
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  參與次數
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPersons.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm ? '未找到符合條件的參與者' : '暫無參與者數據'}
                  </td>
                </tr>
              ) : (
                filteredPersons.map((person, index) => (
                  <tr key={person.name} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handlePersonClick(person)}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        {person.name}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{person.contactInfo}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          {person.count} 次
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 