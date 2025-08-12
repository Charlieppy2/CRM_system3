'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useScrollOptimization } from '@/hooks/useScrollOptimization';

export default function Home() {
  const { user, isLoading } = useAuth();
  
  // 启用滚动性能优化
  useScrollOptimization();

  return (
    <div>
      {/* 歡迎標題 */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          歡迎使用 CRM 管理系統
        </h1>
        {!isLoading && user && (
          <div className="mb-4">
            <p className="text-lg text-blue-600 font-medium">
              欢迎回来，{user.username}！
            </p>
            <p className="text-sm text-gray-500">
              您的身份：{user.role === 'admin' ? '系统管理员' : user.role === 'trainer' ? '教练' : user.role === 'member' ? '会员' : '普通用户'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
