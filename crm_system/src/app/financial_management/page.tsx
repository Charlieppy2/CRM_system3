'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import EditFinancialRecordModal from '@/app/components/EditFinancialRecordModal';

interface FinancialRecord {
  _id: string;
  recordType: 'income' | 'expense';
  memberName: string;
  item: string;
  details?: string;
  location: string;
  unitPrice: number;
  quantity: number;
  totalAmount: number;
  recordDate: string;
  createdBy: {
    username: string;
  };
}

interface FinancialStats {
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
}

export default function FinancialOverview() {
  const { user } = useAuth();
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [stats, setStats] = useState<FinancialStats>({
    totalIncome: 0,
    totalExpense: 0,
    netAmount: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [editingRecord, setEditingRecord] = useState<FinancialRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // 獲取財務記錄
  const fetchFinancialRecords = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/financial-records');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRecords(data.data.records);
          setStats(data.data.stats);
          setTotalRecords(data.data.pagination.total);
        }
      }
    } catch (error) {
      console.error('獲取財務記錄失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 搜索記錄
  const handleSearch = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) {
        params.append('memberName', searchTerm);
      }
      
      const response = await fetch(`/api/financial-records?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRecords(data.data.records);
          setStats(data.data.stats);
          setTotalRecords(data.data.pagination.total);
        }
      }
    } catch (error) {
      console.error('搜索失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 處理修改記錄
  const handleEdit = (record: FinancialRecord) => {
    setEditingRecord(record);
    setIsEditModalOpen(true);
  };

  // 處理刪除記錄
  const handleDelete = async (recordId: string) => {
    if (!confirm('確定要刪除這條財務記錄嗎？此操作無法撤銷。')) {
      return;
    }

    try {
      const response = await fetch(`/api/financial-records/${recordId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          alert('財務記錄刪除成功！');
          fetchFinancialRecords(); // 重新獲取數據
        } else {
          alert(result.message || '刪除失敗');
        }
      } else {
        alert('刪除失敗，請稍後重試');
      }
    } catch (error) {
      console.error('刪除財務記錄失敗:', error);
      alert('刪除失敗，請稍後重試');
    }
  };

  // 處理記錄更新
  const handleRecordUpdate = () => {
    fetchFinancialRecords(); // 重新獲取數據
  };

  useEffect(() => {
    fetchFinancialRecords();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">無權限訪問</h1>
          <p className="text-gray-600">您沒有權限訪問此頁面</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* 頁面標題 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">財務管理</h1>
        <p className="text-gray-600">管理成員的收支記錄</p>
      </div>

      {/* 搜索和操作按鈕 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder="搜索成員、項目、詳情或地點..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            搜索
          </button>
          <Link
            href="/financial_management/add"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            + 新增記錄
          </Link>
        </div>
      </div>

      {/* 記錄計數 */}
      <div className="mb-6">
        <p className="text-gray-600">
          找到 {totalRecords} 筆記錄
        </p>
      </div>

      {/* 財務概覽卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">總收入</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.totalIncome)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">總支出</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(stats.totalExpense)}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">淨額</p>
              <p className={`text-2xl font-bold ${stats.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(stats.netAmount)}
              </p>
            </div>
            <div className={`p-3 rounded-full ${stats.netAmount >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <svg className={`w-6 h-6 ${stats.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 財務記錄表格 */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            財務記錄 ({totalRecords}筆)
          </h2>
        </div>
        
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">載入中...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">暫無財務記錄</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    時間
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    成員
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    項目
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    詳情
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    地點
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    單價
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    數量
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    總額
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    類型
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {records.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(record.recordDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.memberName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.item}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate">
                      {record.details || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(record.unitPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(record.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        record.recordType === 'income' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {record.recordType === 'income' ? '收入' : '支出'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleEdit(record)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        修改
                      </button>
                      <button 
                        onClick={() => handleDelete(record._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        刪除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 修改財務記錄模態框 */}
      <EditFinancialRecordModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingRecord(null);
        }}
        record={editingRecord}
        onUpdate={handleRecordUpdate}
      />
    </div>
  );
} 