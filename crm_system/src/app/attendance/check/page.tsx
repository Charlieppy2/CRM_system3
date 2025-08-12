'use client'

import { useState, useEffect } from 'react';

interface AttendanceRecord {
  _id: string;
  name: string;
  contactInfo: string;
  location: string;
  activity: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function CheckPage() {
  const [selectedDate, setSelectedDate] = useState(() => {
    // 获取本地今天的日期，避免时区问题
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // 格式化时间，只显示时:分
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // 获取指定日期的记录
  const fetchRecordsByDate = async (date: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/attendance/by-date?date=${date}`);
      
      if (!response.ok) {
        throw new Error('獲取記錄失敗');
      }
      
      const data = await response.json();
      setRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '發生未知錯誤');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // 更新出席状态 - 优化版本以防止闪烁
  const updateStatus = async (recordId: string, newStatus: string) => {
    // 立即更新本地状态以获得即时反馈
    const optimisticUpdate = (prevRecords: AttendanceRecord[]) => 
      prevRecords.map(record => 
        record._id === recordId 
          ? { ...record, status: newStatus }
          : record
      );
    
    // 先乐观更新UI
    setRecords(optimisticUpdate);
    setUpdatingStatus(recordId);
    
    try {
      const response = await fetch(`/api/attendance/${recordId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('更新狀態失敗');
      }

      const updatedRecord = await response.json();
      
      // 确认更新成功，再次更新状态确保数据一致性
      setRecords(prevRecords => 
        prevRecords.map(record => 
          record._id === recordId 
            ? { ...record, status: updatedRecord.status, updatedAt: updatedRecord.updatedAt }
            : record
        )
      );
    } catch (err) {
      console.error('更新狀態失敗:', err);
      // 回滚乐观更新
      setRecords(prevRecords => 
        prevRecords.map(record => 
          record._id === recordId 
            ? { ...record, status: record.status === newStatus ? '出席' : record.status }
            : record
        )
      );
      alert('更新狀態失敗，請稍後重試');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // 当选择的日期改变时，获取对应的记录
  useEffect(() => {
    if (selectedDate) {
      fetchRecordsByDate(selectedDate);
    }
  }, [selectedDate]);

  // 格式化显示日期
  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* 页面标题 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">點名記錄</h1>
          <p className="text-sm text-gray-600 mt-1">查看指定日期的出席記錄</p>
        </div>

        {/* 日期选择器 */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <label htmlFor="date-picker" className="text-sm font-medium text-gray-700">
              選擇日期：
            </label>
            <input
              id="date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            {selectedDate && (
              <span className="text-sm text-gray-600">
                {formatDisplayDate(selectedDate)}
              </span>
            )}
          </div>
        </div>

        {/* 记录内容 */}
        <div className="p-6">
          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">載入中...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">錯誤</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && records.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">沒有記錄</h3>
              <p className="mt-1 text-sm text-gray-500">
                所選日期 {formatDisplayDate(selectedDate)} 沒有出席記錄
              </p>
            </div>
          )}

          {!loading && !error && records.length > 0 && (
            <div className="overflow-hidden">
              <div className="mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                  {formatDisplayDate(selectedDate)} 的出席記錄
                </h2>
                <p className="text-sm text-gray-600">共 {records.length} 筆記錄</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        名稱
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        時間
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        活動內容
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        地點
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        狀態
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {records.map((record, index) => (
                      <tr key={record._id} className={`transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {record.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatTime(record.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="max-w-xs truncate" title={record.activity}>
                            {record.activity}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="relative inline-block">
                            <select
                              value={record.status || '出席'}
                              onChange={(e) => updateStatus(record._id, e.target.value)}
                              disabled={updatingStatus === record._id}
                              className={`
                                appearance-none
                                relative
                                w-16
                                pl-2
                                pr-5
                                py-2
                                border
                                rounded-lg
                                text-sm
                                font-medium
                                transition-all
                                duration-200
                                cursor-pointer
                                focus:outline-none
                                focus:ring-2
                                focus:ring-offset-1
                                ${record.status === '早退' 
                                  ? 'border-orange-200 bg-orange-50 text-orange-700 focus:ring-orange-500 hover:bg-orange-100' 
                                  : 'border-green-200 bg-green-50 text-green-700 focus:ring-green-500 hover:bg-green-100'
                                }
                                ${updatingStatus === record._id 
                                  ? 'opacity-60 cursor-wait' 
                                  : 'hover:shadow-sm'
                                }
                              `}
                            >
                              <option value="出席">出席</option>
                              <option value="早退">早退</option>
                            </select>
                            
                            {/* 自定义下拉箭头 */}
                            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                              {updatingStatus === record._id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                              ) : (
                                <svg className="h-4 w-4 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 