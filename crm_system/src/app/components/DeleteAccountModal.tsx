'use client';

import { useState } from 'react';

interface Account {
  _id: string;
  username: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  account: Account | null;
  currentRole: string;
}

export default function DeleteAccountModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  account, 
  currentRole 
}: DeleteAccountModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (!account) return;
    
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`/api/accounts/${account._id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.message || '删除账户失败');
      }
    } catch (error) {
      setError('网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return '管理員';
      case 'trainer': return '教練';
      case 'member': return '會員';
      default: return role;
    }
  };

  const getThemeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'red';
      case 'trainer': return 'red';
      case 'member': return 'red';
      default: return 'red';
    }
  };

  if (!isOpen || !account) return null;

  const themeColor = getThemeColor(currentRole);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            確認刪除帳戶
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h3 className="text-red-800 font-medium">注意：此操作無法撤銷</h3>
                <p className="text-red-700 text-sm mt-1">刪除後該帳戶將永久移除，無法恢復。</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-700">帳戶名稱：</span>
              <span className="ml-2 font-semibold text-gray-900">{account.username}</span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">角色：</span>
              <span className={`ml-2 inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                account.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                account.role === 'trainer' ? 'bg-green-100 text-green-800' :
                'bg-orange-100 text-orange-800'
              }`}>
                {getRoleDisplayName(account.role)}
              </span>
            </div>

          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            disabled={isLoading}
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? '刪除中...' : '確認刪除'}
          </button>
        </div>
      </div>
    </div>
  );
} 