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

export default function MyActivityPage() {
  const { user } = useAuth();
  useScrollOptimization();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [error, setError] = useState('');

  // 获取教练的活动列表
  const fetchMyActivities = async () => {
    if (!user || user.role !== 'trainer') {
      setError('您没有权限访问此页面');
      return;
    }

    try {
      setIsLoadingActivities(true);
      const response = await fetch(`/api/activities/by-trainer?trainerId=${user.id}`);
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

  // 选择活动
  const handleSelectActivity = (activity: Activity) => {
    setSelectedActivity(activity);
    setError('');
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

  useEffect(() => {
    fetchMyActivities();
  }, [user]);

  // 检查权限
  if (!user || user.role !== 'trainer') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">您没有权限访问此页面</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">我的活動</h1>
        <p className="mt-2 text-gray-600">查看您負責的活動信息和參與者</p>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
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
                        {activity.location}
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
                        活動地點
                      </label>
                      <div className="text-gray-900">{selectedActivity.location}</div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        持續時間
                      </label>
                      <div className="text-gray-900 font-semibold text-blue-600">{selectedActivity.duration}h</div>
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
                    
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        參與人數
                      </label>
                      <div className="text-gray-900 text-lg font-semibold">{selectedActivity.participants.length} 人</div>
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
    </div>
  );
} 