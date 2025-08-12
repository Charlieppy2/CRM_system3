'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useScrollOptimization } from '@/hooks/useScrollOptimization';

interface AttendanceRecord {
  _id: string;
  name: string;
  contactInfo: string;
  location: string;
  activity: string;
  createdAt: string;
  updatedAt: string;
}

export default function AttendancePage() {
  const router = useRouter();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 启用滚动性能优化
  useScrollOptimization();
  // 新增状态：更新模式相关
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [editedRecords, setEditedRecords] = useState<AttendanceRecord[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [updatedCount, setUpdatedCount] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  // 新增状态：删除功能相关
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchAttendanceRecords();
  }, []);

  const fetchAttendanceRecords = async () => {
    try {
      const response = await fetch('/api/attendance/accessible');
      const data = await response.json();
      if (response.ok && data.success) {
        setAttendanceRecords(data.data);
        
        // 如果用户是教练且没有地区权限，显示提示信息
        if (data.data.length === 0 && data.message) {
          console.info(data.message);
        }
      } else {
        console.error('獲取數據失敗:', data.message || data.error);
        if (response.status === 403) {
          alert('您沒有權限查看出席記錄');
        }
      }
    } catch (error) {
      console.error('獲取數據失敗:', error);
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

  // 新增函数：开启更新模式
  const enterUpdateMode = () => {
    setIsUpdateMode(true);
    setEditedRecords([...attendanceRecords]);
    setSelectedRecords([]);
  };

  // 新增函数：退出更新模式
  const exitUpdateMode = () => {
    setIsUpdateMode(false);
    setEditedRecords([]);
    setUpdatedCount(0);
    setSelectedRecords([]);
  };

  // 新增函数：处理记录编辑
  const handleRecordEdit = (index: number, field: string, value: string) => {
    const newEditedRecords = [...editedRecords];
    newEditedRecords[index] = {
      ...newEditedRecords[index],
      [field]: value
    };
    setEditedRecords(newEditedRecords);
    
    // 计算修改的记录数量
    const changedCount = newEditedRecords.filter((record) => {
      const original = attendanceRecords.find(orig => orig._id === record._id);
      return original && (
        record.name !== original.name ||
        record.contactInfo !== original.contactInfo ||
        record.location !== original.location ||
        record.activity !== original.activity
      );
    }).length;
    setUpdatedCount(changedCount);
  };

  // 新增函数：处理记录选择
  const handleRecordSelect = (recordId: string) => {
    setSelectedRecords(prev => {
      if (prev.includes(recordId)) {
        return prev.filter(id => id !== recordId);
      } else {
        return [...prev, recordId];
      }
    });
  };

  // 新增函数：全选/取消全选
  const handleSelectAll = () => {
    if (selectedRecords.length === filteredRecords.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(filteredRecords.map(record => record._id));
    }
  };

  // 新增函数：确认删除
  const confirmDelete = () => {
    if (selectedRecords.length > 0) {
      setShowDeleteModal(true);
    }
  };

  // 新增函数：执行删除操作
  const executeDelete = async () => {
    setIsDeleting(true);
    try {
      const deletePromises = selectedRecords.map(async (recordId) => {
        const response = await fetch(`/api/attendance/${recordId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error(`刪除記錄 ${recordId} 失敗`);
        }
        return response.json();
      });

      await Promise.all(deletePromises);
      
      // 重新获取数据
      await fetchAttendanceRecords();
      
      // 退出更新模式
      exitUpdateMode();
      setShowDeleteModal(false);
      
      alert(`成功刪除 ${selectedRecords.length} 筆記錄！`);
    } catch (error) {
      console.error('刪除失敗:', error);
      alert('刪除失敗，請稍後重試');
    } finally {
      setIsDeleting(false);
    }
  };

  // 新增函数：确认更新
  const confirmUpdate = () => {
    setShowConfirmModal(true);
  };

  // 新增函数：执行更新
  const executeUpdate = async () => {
    setIsUpdating(true);
    try {
      const updatePromises = editedRecords.map(async (record) => {
        const original = attendanceRecords.find(orig => orig._id === record._id);
        if (original && (
          record.name !== original.name ||
          record.contactInfo !== original.contactInfo ||
          record.location !== original.location ||
          record.activity !== original.activity
        )) {
          const response = await fetch(`/api/attendance/${record._id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: record.name,
              contactInfo: record.contactInfo,
              location: record.location,
              activity: record.activity
            })
          });
          
          if (!response.ok) {
            throw new Error(`更新記錄 ${record.name} 失敗`);
          }
          return response.json();
        }
        return null;
      });

      await Promise.all(updatePromises);
      
      // 重新获取数据
      await fetchAttendanceRecords();
      
      // 退出更新模式
      exitUpdateMode();
      setShowConfirmModal(false);
      
      alert(`成功更新 ${updatedCount} 筆記錄！`);
    } catch (error) {
      console.error('更新失敗:', error);
      alert('更新失敗，請稍後重試');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredRecords = attendanceRecords.filter(record => {
    if (!searchTerm.trim()) return true;
    
    const searchTermLower = searchTerm.toLowerCase();
    return (
      record.name.toLowerCase().includes(searchTermLower) ||
      record.contactInfo.toLowerCase().includes(searchTermLower) ||
      record.location.toLowerCase().includes(searchTermLower) ||
      record.activity.toLowerCase().includes(searchTermLower)
    );
  });

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
            活動出席管理系統
          </h1>
          <p className="text-gray-600">
            管理活動出席、會議簽到和相關聯絡資訊
          </p>
        </div>
        
        {/* 搜索框 */}
        <div className="relative">
          <input
            type="text"
            placeholder="搜索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 px-4 py-2 pl-10 pr-10 text-sm border border-gray-300 rounded-full bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:shadow-md"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* 記錄表格 */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              活動出席記錄 ({filteredRecords.length} 筆)
              {isUpdateMode && updatedCount > 0 && (
                <span className="ml-2 text-sm text-orange-600">
                  ({updatedCount} 筆待更新)
                </span>
              )}
              {isUpdateMode && selectedRecords.length > 0 && (
                <span className="ml-2 text-sm text-red-600">
                  ({selectedRecords.length} 筆已選擇)
                </span>
              )}
            </h2>
            
            <div className="flex gap-3">
              {!isUpdateMode ? (
                <>
                  <button
                    onClick={() => router.push('/attendance/add')}
                    className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    添加記錄
                  </button>
                  <button
                    onClick={enterUpdateMode}
                    className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    更新記錄
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={confirmUpdate}
                    disabled={updatedCount === 0 || isUpdating}
                    className={`flex items-center px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${
                      updatedCount === 0 || isUpdating
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {isUpdating ? '更新中...' : '確認更新'}
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={selectedRecords.length === 0 || isDeleting}
                    className={`flex items-center px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${
                      selectedRecords.length === 0 || isDeleting
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {isDeleting ? '刪除中...' : '刪除記錄'}
                  </button>
                  <button
                    onClick={exitUpdateMode}
                    disabled={isUpdating || isDeleting}
                    className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    取消
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* 滑動窗口的表格容器 */}
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {isUpdateMode && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedRecords.length === filteredRecords.length && filteredRecords.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  參加者姓名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  聯絡方式
                </th>
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
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={isUpdateMode ? 6 : 5} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm ? '未找到符合條件的記錄' : '暫無活動記錄'}
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record, index) => {
                  const editedRecord = isUpdateMode ? editedRecords.find(r => r._id === record._id) || record : record;
                  const editIndex = isUpdateMode ? editedRecords.findIndex(r => r._id === record._id) : -1;
                  
                  return (
                    <tr key={record._id} className="hover:bg-gray-50">
                      {isUpdateMode && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedRecords.includes(record._id)}
                            onChange={() => handleRecordSelect(record._id)}
                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isUpdateMode ? (
                          <input
                            type="text"
                            value={editedRecord.name}
                            onChange={(e) => handleRecordEdit(editIndex, 'name', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <div className="text-sm font-medium text-gray-900">
                            {record.name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isUpdateMode ? (
                          <input
                            type="text"
                            value={editedRecord.contactInfo}
                            onChange={(e) => handleRecordEdit(editIndex, 'contactInfo', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <div className="text-sm text-gray-900">
                            {record.contactInfo}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isUpdateMode ? (
                          <input
                            type="text"
                            value={editedRecord.location}
                            onChange={(e) => handleRecordEdit(editIndex, 'location', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <div className="text-sm text-gray-900">
                            {record.location}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isUpdateMode ? (
                          <textarea
                            value={editedRecord.activity}
                            onChange={(e) => handleRecordEdit(editIndex, 'activity', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            rows={2}
                          />
                        ) : (
                          <div className="text-sm text-gray-500 max-w-xs truncate" title={record.activity}>
                            {record.activity}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDate(record.createdAt)}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 確認更新彈窗 */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0"></div>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 z-10">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">確認更新記錄</h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-600 mb-4">
                您即將更新 <span className="font-semibold text-orange-600">{updatedCount}</span> 筆記錄，
                此操作不可撤銷。是否確認執行？
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isUpdating}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={executeUpdate}
                disabled={isUpdating}
                className={`px-4 py-2 text-white rounded-lg transition-colors ${
                  isUpdating 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isUpdating ? '更新中...' : '確認更新'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 確認刪除彈窗 */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0"></div>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 z-10">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">確認刪除記錄</h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-600 mb-4">
                您即將刪除 <span className="font-semibold text-red-600">{selectedRecords.length}</span> 筆記錄，
                此操作不可撤銷。是否確認執行？
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={executeDelete}
                disabled={isDeleting}
                className={`px-4 py-2 text-white rounded-lg transition-colors ${
                  isDeleting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isDeleting ? '刪除中...' : '確認刪除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 