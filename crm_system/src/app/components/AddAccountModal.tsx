'use client';

import { useState } from 'react';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultRole: string;
}

export default function AddAccountModal({ isOpen, onClose, onSuccess, defaultRole }: AddAccountModalProps) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: defaultRole,
    // 会员专用字段
    memberName: '',
    phone: '',
    email: '',
    quota: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 为会员角色准备完整的数据
      const submitData = defaultRole === 'member' ? formData : {
        username: formData.username,
        password: formData.password,
        role: formData.role
      };

      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (result.success) {
        setFormData({ 
          username: '', 
          password: '', 
          role: defaultRole,
          memberName: '',
          phone: '',
          email: '',
          quota: 0
        });
        onSuccess();
        onClose();
      } else {
        setError(result.message || '添加账户失败');
      }
    } catch (error) {
      setError('网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ 
      username: '', 
      password: '', 
      role: defaultRole,
      memberName: '',
      phone: '',
      email: '',
      quota: 0
    });
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  const isMember = defaultRole === 'member';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg p-6 w-full mx-4 ${isMember ? 'max-w-2xl' : 'max-w-md'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            添加新{isMember ? '會員' : '账户'}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className={isMember ? 'grid grid-cols-2 gap-4' : ''}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                账号名
              </label>
              <input
                type="text"
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入账号名"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                密码
              </label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入密码"
                required
              />
            </div>
          </div>

          {isMember && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="memberName" className="block text-sm font-medium text-gray-700 mb-1">
                    會員姓名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="memberName"
                    value={formData.memberName}
                    onChange={(e) => setFormData({ ...formData, memberName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入會員真實姓名"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    電話號碼 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入電話號碼"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    電子郵箱 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入電子郵箱"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="quota" className="block text-sm font-medium text-gray-700 mb-1">
                    初始配額
                  </label>
                  <input
                    type="number"
                    id="quota"
                    min="0"
                    value={formData.quota}
                    onChange={(e) => setFormData({ ...formData, quota: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入初始配額（默認為0）"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    會員可用的活動參與次數
                  </p>
                </div>
              </div>
            </>
          )}

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              角色
            </label>
            <input
              type="text"
              id="role"
              value={formData.role === 'member' ? '會員' : formData.role}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
            />
            <p className="text-xs text-gray-500 mt-1">
              角色会根据当前页面自动设置
            </p>
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
              type="submit"
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? '添加中...' : '确认'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 