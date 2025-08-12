'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useScrollOptimization } from '@/hooks/useScrollOptimization';
import AddAccountModal from '@/app/components/AddAccountModal';
import DeleteAccountModal from '@/app/components/DeleteAccountModal';
import EditAccountModal from '@/app/components/EditAccountModal';

interface Account {
  _id: string;
  username: string;
  role: string;
  isActive: boolean;
  locations: string[];
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

interface AccountDetail extends Account {
  password: string;
}

export default function TrainerManagementPage() {
  const { user } = useAuth();
  useScrollOptimization();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<AccountDetail | null>(null);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<AccountDetail | null>(null);
  const [error, setError] = useState('');

  // 获取教練列表
  const fetchTrainerAccounts = async () => {
    try {
      setIsLoadingAccounts(true);
      const response = await fetch('/api/accounts?role=trainer');
      const result = await response.json();
      
      if (result.success) {
        setAccounts(result.data);
        // 如果有账户且没有选中的账户，默认选中第一个
        if (result.data.length > 0 && !selectedAccount) {
          handleSelectAccount(result.data[0]._id);
        }
      } else {
        setError('获取教練列表失败');
      }
    } catch (error) {
      setError('网络错误，请重试');
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  // 获取账户详细信息
  const handleSelectAccount = async (accountId: string) => {
    try {
      setIsLoadingDetail(true);
      const response = await fetch(`/api/accounts/${accountId}`);
      const result = await response.json();
      
      if (result.success) {
        setSelectedAccount(result.data);
      } else {
        setError('获取账户详情失败');
      }
    } catch (error) {
      setError('网络错误，请重试');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // 添加账户成功回调
  const handleAddSuccess = () => {
    fetchTrainerAccounts(); // 重新获取列表
  };

  // 删除账户处理
  const handleDeleteClick = () => {
    if (selectedAccount) {
      setAccountToDelete(selectedAccount);
      setIsDeleteModalOpen(true);
    }
  };

  // 删除账户成功回调
  const handleDeleteSuccess = () => {
    fetchTrainerAccounts(); // 重新获取列表
    setSelectedAccount(null); // 清空选中的账户
  };

  // 修改账户处理
  const handleEditClick = () => {
    if (selectedAccount) {
      setAccountToEdit(selectedAccount);
      setIsEditModalOpen(true);
    }
  };

  // 修改账户成功回调
  const handleEditSuccess = () => {
    fetchTrainerAccounts(); // 重新获取列表
    if (selectedAccount) {
      // 重新获取选中账户的详细信息
      handleSelectAccount(selectedAccount._id);
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    if (!dateString) return '从未登录';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  useEffect(() => {
    fetchTrainerAccounts();
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      {/* 页面标题和添加按钮 */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">教練帳號管理</h1>
          <p className="mt-2 text-gray-600">管理系統教練帳號，包括查看詳情和新增教練</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleDeleteClick}
            disabled={!selectedAccount}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            刪除帳戶
          </button>
          <button
            onClick={handleEditClick}
            disabled={!selectedAccount}
            className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            修改帳戶
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            + 添加帳戶
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* 主要内容区域 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="flex h-96">
          {/* 左侧 - 教練列表 */}
          <div className="w-1/3 border-r border-gray-200">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">教練列表</h2>
              <p className="text-sm text-gray-600">共 {accounts.length} 個教練</p>
            </div>
            
            <div className="overflow-y-auto h-80">
              {isLoadingAccounts ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : accounts.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  暫無教練帳戶
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {accounts.map((account) => (
                    <button
                      key={account._id}
                      onClick={() => handleSelectAccount(account._id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedAccount?._id === account._id
                          ? 'bg-green-50 border border-green-200 text-green-900'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="font-medium">{account.username}</div>
                      <div className="text-sm text-gray-500">
                        {account.isActive ? '活躍' : '已禁用'} · 創建於 {formatDate(account.createdAt).split(' ')[0]}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 右侧 - 账户详情 */}
          <div className="flex-1">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">帳戶詳情</h2>
            </div>
            
            <div className="p-6">
              {!selectedAccount ? (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  請從左側選擇一個教練帳戶
                </div>
              ) : isLoadingDetail ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      帳號名
                    </label>
                    <div className="text-lg font-semibold text-gray-900">
                      {selectedAccount.username}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      密碼
                    </label>
                    <div className="font-mono text-gray-600 bg-gray-50 p-3 rounded-md">
                      {selectedAccount.password}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      角色
                    </label>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      {selectedAccount.role === 'trainer' ? '教練' : selectedAccount.role}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      地區權限
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedAccount.locations && selectedAccount.locations.length > 0 ? (
                        selectedAccount.locations.map((location) => (
                          <span
                            key={location}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                          >
                            {location}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 text-sm">無地區權限</span>
                      )}
                    </div>
                  </div>



                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        創建時間
                      </label>
                      <div className="text-gray-600">
                        {formatDate(selectedAccount.createdAt)}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        最後登錄
                      </label>
                      <div className="text-gray-600">
                        {formatDate(selectedAccount.lastLogin || '')}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 添加账户弹窗 */}
      <AddAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleAddSuccess}
        defaultRole="trainer"
      />
      
      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={handleDeleteSuccess}
        account={accountToDelete}
        currentRole="trainer"
      />
      
      <EditAccountModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleEditSuccess}
        account={accountToEdit}
        currentRole="trainer"
      />
    </div>
  );
} 