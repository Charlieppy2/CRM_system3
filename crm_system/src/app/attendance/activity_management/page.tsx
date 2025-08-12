'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useScrollOptimization } from '@/hooks/useScrollOptimization';

interface Activity {
  _id: string;
  activityName: string;
  trainerId: string;
  trainerName: string;
  startTime: string;
  endTime: string;
  duration: number;
  participants: string[];
  location: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

interface Trainer {
  _id: string;
  username: string;
  role: string;
  isActive: boolean;
}

export default function ActivityManagementPage() {
  const { user } = useAuth();
  useScrollOptimization();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [isLoadingTrainers, setIsLoadingTrainers] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 添加活动表单数据
  const [addFormData, setAddFormData] = useState({
    activityName: '',
    trainerId: '',
    startTime: '',
    endTime: '',
    location: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 获取活动列表
  const fetchActivities = async () => {
    try {
      setIsLoadingActivities(true);
      const response = await fetch('/api/activities');
      const result = await response.json();
      
      if (result.success) {
        setActivities(result.data);
        if (result.data.length > 0 && !selectedActivity) {
          setSelectedActivity(result.data[0]);
        }
      } else {
        setError('获取活动列表失败');
      }
    } catch (error) {
      setError('网络错误，请重试');
    } finally {
      setIsLoadingActivities(false);
    }
  };

  // 获取教练列表
  const fetchTrainers = async () => {
    try {
      setIsLoadingTrainers(true);
      const response = await fetch('/api/accounts?role=trainer');
      const result = await response.json();
      
      if (result.success) {
        setTrainers(result.data);
      } else {
        setError('获取教练列表失败');
      }
    } catch (error) {
      setError('网络错误，请重试');
    } finally {
      setIsLoadingTrainers(false);
    }
  };

  // 选择活动
  const handleSelectActivity = (activity: Activity) => {
    setSelectedActivity(activity);
    setError('');
    setSuccessMessage('');
  };

  // 添加活动表单处理
  const handleAddFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAddFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 提交添加活动
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!addFormData.trainerId) {
      setError('请选择负责教练');
      return;
    }

    // 验证时间
    const startTime = new Date(addFormData.startTime);
    const endTime = new Date(addFormData.endTime);
    
    if (endTime <= startTime) {
      setError('结束时间必须晚于开始时间');
      return;
    }

    try {
      setIsSubmitting(true);
      const selectedTrainer = trainers.find(t => t._id === addFormData.trainerId);
      
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...addFormData,
          trainerName: selectedTrainer?.username || ''
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setSuccessMessage('活动添加成功');
        setIsAddModalOpen(false);
        setAddFormData({
          activityName: '',
          trainerId: '',
          startTime: '',
          endTime: '',
          location: '',
          description: ''
        });
        fetchActivities(); // 重新获取活动列表
      } else {
        setError(result.message || '添加活动失败');
      }
    } catch (error) {
      setError('网络错误，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 格式化时间显示
  const formatDateTime = (dateString: string) => {
    if (!dateString) return '无时间';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 格式化时间用于输入框
  const formatDateTimeInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  };

  useEffect(() => {
    fetchActivities();
    fetchTrainers();
  }, []);

  // 清除消息
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  return (
    <div className="max-w-7xl mx-auto">
      {/* 页面标题和添加按钮 */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">活動管理</h1>
          <p className="mt-2 text-gray-600">管理活動信息、分配教練和查看參與者</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + 添加活動
        </button>
      </div>

      {/* 错误和成功提示 */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-sm text-green-600">{successMessage}</p>
        </div>
      )}

      {/* 主要内容区域 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="flex h-auto min-h-96">
          {/* 左侧 - 活动列表 */}
          <div className="w-1/3 border-r border-gray-200">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">活動列表</h2>
              <p className="text-sm text-gray-600">共 {activities.length} 個活動</p>
            </div>
            
            <div className="overflow-y-auto max-h-96">
              {isLoadingActivities ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : activities.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-gray-500">
                  暫無活動
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {activities.map((activity) => (
                    <button
                      key={activity._id}
                      onClick={() => handleSelectActivity(activity)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedActivity?._id === activity._id
                          ? 'bg-blue-50 border border-blue-200 text-blue-900'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="font-medium">{activity.activityName}</div>
                      <div className="text-sm text-gray-500">
                        教練: {activity.trainerName} · {activity.location}
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatDateTime(activity.startTime)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 右侧 - 活动详情 */}
          <div className="flex-1 flex flex-col">
            {!selectedActivity ? (
              <div className="flex items-center justify-center h-96 text-gray-500">
                請從左側選擇一個活動
              </div>
            ) : (
              <>
                {/* 活动基本信息 */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-start mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">{selectedActivity.activityName}</h2>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedActivity.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedActivity.isActive ? '進行中' : '已結束'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        負責教練
                      </label>
                      <div className="text-gray-900">{selectedActivity.trainerName}</div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        活動地點
                      </label>
                      <div className="text-gray-900">{selectedActivity.location}</div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        開始時間
                      </label>
                      <div className="text-gray-900">{formatDateTime(selectedActivity.startTime)}</div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        結束時間
                      </label>
                      <div className="text-gray-900">{formatDateTime(selectedActivity.endTime)}</div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        持續時間
                      </label>
                      <div className="text-gray-900 font-semibold text-blue-600">{selectedActivity.duration}h</div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        參與人數
                      </label>
                      <div className="text-gray-900">{selectedActivity.participants.length} 人</div>
                    </div>
                  </div>

                  {selectedActivity.description && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        活動描述
                      </label>
                      <div className="text-gray-900 bg-gray-50 p-3 rounded-md">
                        {selectedActivity.description}
                      </div>
                    </div>
                  )}
                </div>

                {/* 参与者列表 */}
                <div className="flex-1 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">參與者列表</h3>
                    <span className="text-sm text-gray-600">共 {selectedActivity.participants.length} 位參與者</span>
                  </div>
                  
                  <div className="overflow-y-auto max-h-64">
                    {selectedActivity.participants.length === 0 ? (
                      <div className="flex items-center justify-center h-32 text-gray-500">
                        暫無參與者
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {selectedActivity.participants.map((participant, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-3">
                            <div className="font-medium text-gray-900">{participant}</div>
                            <div className="text-sm text-gray-500">參與者 #{index + 1}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 添加活动模态框 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">添加新活動</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="activityName" className="block text-sm font-medium text-gray-700 mb-1">
                    活動名稱 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="activityName"
                    name="activityName"
                    value={addFormData.activityName}
                    onChange={handleAddFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="輸入活動名稱"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="trainerId" className="block text-sm font-medium text-gray-700 mb-1">
                    負責教練 <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="trainerId"
                    name="trainerId"
                    value={addFormData.trainerId}
                    onChange={handleAddFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">選擇教練</option>
                    {trainers.map((trainer) => (
                      <option key={trainer._id} value={trainer._id}>
                        {trainer.username}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                    開始時間 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    id="startTime"
                    name="startTime"
                    value={addFormData.startTime}
                    onChange={handleAddFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                    結束時間 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    id="endTime"
                    name="endTime"
                    value={addFormData.endTime}
                    onChange={handleAddFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  活動地點 <span className="text-red-500">*</span>
                </label>
                <select
                  id="location"
                  name="location"
                  value={addFormData.location}
                  onChange={handleAddFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">選擇地點</option>
                  <option value="灣仔">灣仔</option>
                  <option value="黃大仙">黃大仙</option>
                  <option value="石門">石門</option>
                </select>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  活動描述
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={addFormData.description}
                  onChange={handleAddFormChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="輸入活動描述（可選）"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  disabled={isSubmitting}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '添加中...' : '确认添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 