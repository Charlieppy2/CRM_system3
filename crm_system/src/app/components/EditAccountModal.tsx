'use client';

import { useState, useEffect } from 'react';
import LocationPermissionEditor from './LocationPermissionEditor';

interface Account {
  _id: string;
  username: string;
  password: string;
  role: string;
  isActive: boolean;
  locations: string[];
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  account: Account | null;
  currentRole: string;
}

export default function EditAccountModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  account, 
  currentRole 
}: EditAccountModalProps) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    locations: [] as string[]
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 当账户信息改变时，更新表单数据
  useEffect(() => {
    if (account) {
      setFormData({
        username: account.username,
        password: account.password,
        locations: account.locations || []
      });
    }
  }, [account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;
    
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`/api/accounts/${account._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        onSuccess();
        onClose();
        handleClose();
      } else {
        setError(result.message || '更新账户失败');
      }
    } catch (error) {
      setError('网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setFormData({
      username: '',
      password: '',
      locations: []
    });
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
      case 'admin': return 'blue';
      case 'trainer': return 'green';
      case 'member': return 'orange';
      default: return 'blue';
    }
  };

  if (!isOpen || !account) return null;

  const themeColor = getThemeColor(currentRole);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            修改帳戶資訊
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

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* 显示只读信息 */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-medium text-gray-700 mb-2">帳戶資訊</h3>
              <div>
                <span className="text-sm font-medium text-gray-600">角色：</span>
                <span className={`ml-2 inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                  account.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                  account.role === 'trainer' ? 'bg-green-100 text-green-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {getRoleDisplayName(account.role)}
                </span>
              </div>

            </div>

            {/* 可编辑字段 */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                帳戶名稱 *
              </label>
              <input
                type="text"
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                minLength={3}
                maxLength={50}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">用戶名必須為 3-50 個字符</p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                密碼 *
              </label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                minLength={6}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">密碼至少需要 6 個字符</p>
            </div>

            {/* 地区权限编辑器 - 仅对教练显示 */}
            {account?.role === 'trainer' && (
              <div>
                <LocationPermissionEditor
                  initialLocations={formData.locations}
                  onLocationsChange={(locations) => setFormData({ ...formData, locations })}
                  disabled={isLoading}
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              disabled={isLoading}
            >
              取消
            </button>
            <button
              type="submit"
              className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                themeColor === 'blue' ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' :
                themeColor === 'green' ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' :
                'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
              }`}
              disabled={isLoading}
            >
              {isLoading ? '更新中...' : '確認修改'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 