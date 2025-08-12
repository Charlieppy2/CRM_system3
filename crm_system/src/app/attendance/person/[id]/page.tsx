'use client'

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface AttendanceRecord {
  _id: string;
  name: string;
  contactInfo: string;
  location: string;
  activity: string;
  createdAt: string;
}

export default function PersonDetailPage() {
  const router = useRouter();
  const params = useParams();
  const personId = params.id as string;
  
  const [personRecords, setPersonRecords] = useState<AttendanceRecord[]>([]);
  const [personInfo, setPersonInfo] = useState<{ name: string; contactInfo: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (personId) {
      fetchPersonRecords();
    }
  }, [personId]);

  const fetchPersonRecords = async () => {
    try {
      const response = await fetch('/api/attendance');
      const data = await response.json();
      if (response.ok) {
        const decodedName = decodeURIComponent(personId);
        const records = data.filter((record: AttendanceRecord) => 
          record.name.trim().toLowerCase() === decodedName.toLowerCase()
        );
        
        setPersonRecords(records);
        if (records.length > 0) {
          setPersonInfo({
            name: records[0].name,
            contactInfo: records[0].contactInfo
          });
        }
      } else {
        console.error('获取数据失败:', data.error);
      }
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!personInfo) {
    return (
      <div>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">找不到該參與者</h2>
          <p className="text-gray-600 mb-6">該參與者可能不存在或記錄已被刪除</p>
          <button
            onClick={() => router.push('/attendance/by_name')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回參與者列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* 返回按钮和页面标题 */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => router.push('/attendance/by_name')}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors mr-4"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          返回列表
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-800">個人出席記錄</h1>
        </div>
      </div>

      {/* 个人信息卡片 */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-16 w-16">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-600">
                {personInfo.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-6 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {personInfo.name}
                </h2>
                <div className="flex items-center text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {personInfo.contactInfo}
                </div>
              </div>
              <div className="mt-4 sm:mt-0">
                <div className="flex items-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{personRecords.length}</div>
                    <div className="text-sm text-gray-500">總出席次數</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 记录列表 */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-1">
            出席紀錄
          </h2>
          <p className="text-sm text-gray-500">
            出席次數：{personRecords.length}
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  地點
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  活動內容
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  日期
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {personRecords.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    暫無出席記錄
                  </td>
                </tr>
              ) : (
                personRecords.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {record.location}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs" title={record.activity}>
                        {record.activity}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatDate(record.createdAt)}
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