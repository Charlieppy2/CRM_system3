'use client';

import { useState, useEffect } from 'react';

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
}

interface EditFinancialRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: FinancialRecord | null;
  onUpdate: () => void;
}

export default function EditFinancialRecordModal({
  isOpen,
  onClose,
  record,
  onUpdate
}: EditFinancialRecordModalProps) {
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

  // 當記錄變化時，更新表單數據
  useEffect(() => {
    if (record) {
      setFormData({
        recordType: record.recordType,
        memberName: record.memberName,
        item: record.item,
        details: record.details || '',
        location: record.location,
        unitPrice: record.unitPrice,
        quantity: record.quantity,
        recordDate: new Date(record.recordDate).toISOString().split('T')[0]
      });
      setTotalAmount(record.unitPrice * record.quantity);
    }
  }, [record]);

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
    
    if (!record || !formData.memberName || !formData.item || formData.unitPrice <= 0) {
      alert('請填寫所有必填字段');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await fetch(`/api/financial-records/${record._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          unitPrice: parseFloat(formData.unitPrice.toString()),
          quantity: parseInt(formData.quantity.toString())
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          alert('財務記錄修改成功！');
          onUpdate();
          onClose();
        } else {
          alert(result.message || '修改失敗');
        }
      } else {
        const errorText = await response.text();
        alert(`修改失敗 (${response.status}): ${errorText}`);
      }
    } catch (error) {
      console.error('修改財務記錄失敗:', error);
      alert('修改失敗，請稍後重試');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 標題欄 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">修改財務記錄</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 表單內容 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? '修改中...' : '保存修改'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 