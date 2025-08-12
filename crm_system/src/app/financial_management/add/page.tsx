'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AddFinancialRecord() {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    recordType: 'income',
    memberName: '',
    item: '',
    details: '',
    location: '灣仔',
    unitPrice: 0,
    quantity: 1,
    recordDate: new Date().toISOString().split('T')[0]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);

  // 計算總額
  useEffect(() => {
    setTotalAmount(formData.unitPrice * formData.quantity);
  }, [formData.unitPrice, formData.quantity]);

  // 處理表單輸入變化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'unitPrice' || name === 'quantity' ? parseFloat(value) || 0 : value
    }));
  };

  // 處理表單提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.memberName || !formData.item || formData.unitPrice <= 0) {
      alert('請填寫所有必填字段');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // 準備提交數據
      const submitData = {
        ...formData,
        unitPrice: parseFloat(formData.unitPrice.toString()),
        quantity: parseInt(formData.quantity.toString()),
        createdBy: user?.id
      };
      
      console.log('提交的數據:', submitData);
      
      const response = await fetch('/api/financial-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      console.log('API響應狀態:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('API響應結果:', result);
        
        if (result.success) {
          alert('財務記錄創建成功！');
          router.push('/financial_management');
        } else {
          alert(result.message || '創建失敗');
        }
      } else {
        const errorText = await response.text();
        console.error('API錯誤響應:', errorText);
        alert(`創建失敗 (${response.status}): ${errorText}`);
      }
    } catch (error) {
      console.error('創建財務記錄失敗:', error);
      alert('創建失敗，請稍後重試');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 權限檢查
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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">新增財務記錄</h1>
        <p className="text-gray-600">創建新的財務記錄</p>
      </div>

      {/* 介紹框 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-800 mb-2">創建您的財務記錄</h3>
            <p className="text-blue-700">開始記錄您的收入和支出，輕鬆管理財務</p>
          </div>
        </div>
      </div>

      {/* 表單 */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 記錄類型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              記錄類型 *
            </label>
            <div className="flex space-x-6">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="recordType"
                  value="income"
                  checked={formData.recordType === 'income'}
                  onChange={handleInputChange}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">收入</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="recordType"
                  value="expense"
                  checked={formData.recordType === 'expense'}
                  onChange={handleInputChange}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">支出</span>
              </label>
            </div>
          </div>

          {/* 成員姓名 */}
          <div>
            <label htmlFor="memberName" className="block text-sm font-medium text-gray-700 mb-2">
              成員 *
            </label>
            <input
              type="text"
              id="memberName"
              name="memberName"
              value={formData.memberName}
              onChange={handleInputChange}
              placeholder="輸入成員姓名"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* 項目名稱 */}
          <div>
            <label htmlFor="item" className="block text-sm font-medium text-gray-700 mb-2">
              項目 *
            </label>
            <input
              type="text"
              id="item"
              name="item"
              value={formData.item}
              onChange={handleInputChange}
              placeholder="輸入項目名稱"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* 地點 */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              地點
            </label>
            <select
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="灣仔">灣仔</option>
              <option value="黃大仙">黃大仙</option>
              <option value="石門">石門</option>
            </select>
          </div>

          {/* 單價和數量 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="unitPrice" className="block text-sm font-medium text-gray-700 mb-2">
                單價 *
              </label>
              <input
                type="number"
                id="unitPrice"
                name="unitPrice"
                value={formData.unitPrice}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                數量 *
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                min="1"
                step="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* 詳細描述 */}
          <div>
            <label htmlFor="details" className="block text-sm font-medium text-gray-700 mb-2">
              詳情
            </label>
            <textarea
              id="details"
              name="details"
              value={formData.details}
              onChange={handleInputChange}
              placeholder="輸入詳細描述"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 記錄日期 */}
          <div>
            <label htmlFor="recordDate" className="block text-sm font-medium text-gray-700 mb-2">
              記錄日期
            </label>
            <input
              type="date"
              id="recordDate"
              name="recordDate"
              value={formData.recordDate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 總額顯示 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              總額:
            </label>
            <div className="text-2xl font-bold text-gray-900">
              ${totalAmount.toFixed(2)}
            </div>
          </div>

          {/* 操作按鈕 */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? '保存中...' : '保存記錄'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 