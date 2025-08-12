'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useScrollOptimization } from '@/hooks/useScrollOptimization';

export default function UnauthorizedPage() {
  const { user } = useAuth();
  useScrollOptimization();

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return '管理員';
      case 'trainer': return '教練';
      case 'member': return '會員';
      case 'user': return '普通用户';
      default: return role;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
          <svg className="h-10 w-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          無權限訪問
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          抱歉，您沒有權限訪問此頁面
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            {user && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">當前帳戶信息</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">用戶名：</span>
                    <span className="text-sm font-medium text-gray-900">{user.username}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">角色：</span>
                    <span className={`ml-1 inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'trainer' ? 'bg-green-100 text-green-800' :
                      user.role === 'member' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {getRoleDisplayName(user.role)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">權限說明</h3>
              <div className="text-sm text-blue-800 space-y-1">
                {user?.role === 'trainer' && (
                  <>
                    <p>✅ 您可以訪問：</p>
                    <ul className="ml-4 space-y-1">
                      <li>• 首頁</li>
                      <li>• 出席管理</li>
                    </ul>
                    <p className="mt-2">❌ 您無法訪問：</p>
                    <ul className="ml-4 space-y-1">
                      <li>• 帳號管理（僅限管理員）</li>
                    </ul>
                  </>
                )}
                {user?.role === 'member' && (
                  <p>會員權限配置中，請聯繫管理員。</p>
                )}
                {user?.role === 'admin' && (
                  <p>管理員擁有全部權限，如果看到此頁面可能是系統錯誤。</p>
                )}
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <Link
                href="/"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                返回首頁
              </Link>
              
              {user?.role === 'trainer' && (
                <Link
                  href="/attendance"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  前往出席管理
                </Link>
              )}
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                如有疑問，請聯繫系統管理員
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 