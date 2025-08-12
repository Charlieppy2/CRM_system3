'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface Member {
  _id: string;
  username: string;
  memberName: string;
  phone: string;
  email: string;
  quota: number;
  isActive: boolean;
}

interface Activity {
  _id: string;
  activityName: string;
  trainerId: string;
  trainerName: string;
  startTime: string;
  endTime: string;
  duration: number;
  location: string;
  isActive: boolean;
}

export default function AddAttendancePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    contactInfo: '',
    location: '',
    activityId: '',
    activityName: ''
  });
  const [memberValidation, setMemberValidation] = useState<{
    isValidating: boolean;
    member: Member | null;
    error: string;
  }>({
    isValidating: false,
    member: null,
    error: ''
  });

  // 所有可用的地区
  const ALL_LOCATIONS = ['灣仔', '黃大仙', '石門'];

  // 获取活动列表
  const fetchActivities = async () => {
    try {
      setIsLoadingActivities(true);
      const response = await fetch('/api/activities');
      const result = await response.json();
      
      if (result.success) {
        setActivities(result.data);
      }
    } catch (error) {
      console.error('获取活动列表失败:', error);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        // 管理员可以选择所有地区
        setAvailableLocations(ALL_LOCATIONS);
      } else if (user.role === 'trainer') {
        // 教练只能选择他们有权限的地区
        setAvailableLocations(user.locations || []);
      }
    }
    // 获取活动列表
    fetchActivities();
  }, [user]);

  // 验证会员信息
  const validateMember = async (name: string, contactInfo: string) => {
    if (!name.trim() || !contactInfo.trim()) {
      setMemberValidation({
        isValidating: false,
        member: null,
        error: ''
      });
      return;
    }

    setMemberValidation(prev => ({ ...prev, isValidating: true, error: '' }));

    try {
      const response = await fetch(`/api/accounts/validate-member?name=${encodeURIComponent(name)}&contact=${encodeURIComponent(contactInfo)}`);
      const result = await response.json();

      if (result.success && result.data) {
        const member = result.data;
        if (!member.isActive) {
          setMemberValidation({
            isValidating: false,
            member: null,
            error: '該會員帳戶已被禁用'
          });
        } else if (member.quota <= 0) {
          setMemberValidation({
            isValidating: false,
            member: member,
            error: '該會員配額不足，無法參加活動'
          });
        } else {
          setMemberValidation({
            isValidating: false,
            member: member,
            error: ''
          });
        }
      } else {
        setMemberValidation({
          isValidating: false,
          member: null,
          error: '找不到該會員記錄，請檢查姓名和聯絡方式是否正確'
        });
      }
    } catch (error) {
      setMemberValidation({
        isValidating: false,
        member: null,
        error: '驗證會員信息時出錯，請重試'
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // 特殊处理活动选择
    if (name === 'activityId') {
      const selectedActivity = activities.find(activity => activity._id === value);
      setFormData(prev => ({
        ...prev,
        activityId: value,
        activityName: selectedActivity?.activityName || '',
        location: selectedActivity?.location || ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // 当姓名或联系方式改变时，重新验证会员
    if (name === 'name' || name === 'contactInfo') {
      const newFormData = { ...formData, [name]: value };
      validateMember(newFormData.name, newFormData.contactInfo);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 检查会员验证状态
    if (!memberValidation.member) {
      alert('❌ 請先確認會員信息有效');
      return;
    }

    if (memberValidation.error) {
      alert(`❌ ${memberValidation.error}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedActivity = activities.find(a => a._id === formData.activityId);
      
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          contactInfo: formData.contactInfo,
          location: formData.location,
          activity: formData.activityName,
          activityId: formData.activityId,
          memberId: memberValidation.member._id // 添加会员ID用于quota扣除
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ 出席記錄已成功添加，會員配額已自動扣除！');
        router.push('/attendance');
      } else {
        alert(`❌ 添加失敗：${data.error}`);
      }
    } catch (error) {
      console.error('提交失败:', error);
      alert('❌ 提交失敗，請重試');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.name.trim() && formData.contactInfo.trim() && 
                     formData.location.trim() && formData.activityId.trim() &&
                     availableLocations.length > 0 && 
                     memberValidation.member && 
                     !memberValidation.error;

  return (
    <div>
      {/* 返回按钮和页面标题 */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => router.push('/attendance')}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors mr-4"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          返回列表
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-800">添加新的出席記錄</h1>
          <p className="text-gray-600 mt-1">填寫以下資訊來創建新的出席記錄（會自動扣除會員配額）</p>
        </div>
      </div>

      {/* 表单 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              參加者姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="請輸入參加者姓名"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="contactInfo" className="block text-sm font-medium text-gray-700 mb-2">
              聯絡方式 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="contactInfo"
              name="contactInfo"
              value={formData.contactInfo}
              onChange={handleChange}
              placeholder="請輸入聯絡方式（電話、郵箱等）"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* 会员验证状态显示 */}
          {(formData.name.trim() && formData.contactInfo.trim()) && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">會員驗證狀態</h3>
              
              {memberValidation.isValidating ? (
                <div className="flex items-center text-blue-600">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  正在驗證會員信息...
                </div>
              ) : memberValidation.error ? (
                <div className="text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {memberValidation.error}
                </div>
              ) : memberValidation.member ? (
                <div className="text-green-600">
                  <div className="flex items-center mb-2">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    會員驗證成功
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>會員姓名: {memberValidation.member.memberName}</div>
                    <div>聯絡方式: {memberValidation.member.phone}</div>
                    <div>剩餘配額: <span className="font-semibold text-blue-600">{memberValidation.member.quota}</span></div>
                    <div className="text-xs text-yellow-600 mt-2">
                      ⚠️ 提交後將自動扣除 1 個配額
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              地點 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              placeholder={formData.activityId ? "地點將根據選擇的活動自動設置" : "請先選擇活動"}
            />
            <p className="text-xs text-gray-500 mt-1">
              地點會根據選擇的活動自動設置
            </p>
          </div>

          <div>
            <label htmlFor="activity" className="block text-sm font-medium text-gray-700 mb-2">
              活動內容 <span className="text-red-500">*</span>
            </label>
            <select
              id="activityId"
              name="activityId"
              value={formData.activityId}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">請選擇活動</option>
              {activities.map((activity) => (
                <option key={activity._id} value={activity._id}>
                  {activity.activityName} - {activity.trainerName} ({new Date(activity.startTime).toLocaleDateString('zh-CN')})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.push('/attendance')}
              className="flex-1 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  提交中...
                </>
              ) : (
                '添加記錄'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 