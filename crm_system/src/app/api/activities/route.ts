import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Activity from '@/models/Activity';
import Account from '@/models/Account';
import { getAuthUser } from '@/lib/auth';

// GET - 获取所有活动
export async function GET() {
  try {
    await connectDB();
    const activities = await Activity.find({ isActive: true }).sort({ startTime: -1 });
    
    return NextResponse.json({
      success: true,
      data: activities,
      message: `找到 ${activities.length} 个活动`
    });
  } catch (error: any) {
    console.error('获取活动列表失败:', error);
    return NextResponse.json({
      success: false,
      message: '获取活动列表失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// POST - 创建新活动
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // 验证用户身份
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({
        success: false,
        message: '未授权访问'
      }, { status: 401 });
    }

    // 获取用户详细信息
    const user = await Account.findById(authUser.userId);
    if (!user) {
      return NextResponse.json({
        success: false,
        message: '用户不存在'
      }, { status: 404 });
    }
    
    // 检查权限（只有管理员和教练可以创建活动）
    if (user.role !== 'admin' && user.role !== 'trainer') {
      return NextResponse.json({
        success: false,
        message: '您没有权限创建活动'
      }, { status: 403 });
    }
    
    const body = await request.json();
    const { activityName, trainerId, trainerName, startTime, endTime, location, description } = body;
    
    // 验证必需字段
    if (!activityName || !trainerId || !startTime || !endTime || !location) {
      return NextResponse.json({
        success: false,
        message: '活动名称、负责教练、开始时间、结束时间和地点都是必需的'
      }, { status: 400 });
    }
    
    // 验证教练是否存在
    const trainer = await Account.findById(trainerId);
    if (!trainer || trainer.role !== 'trainer') {
      return NextResponse.json({
        success: false,
        message: '指定的教练不存在或不是教练角色'
      }, { status: 400 });
    }
    
    // 验证时间
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (end <= start) {
      return NextResponse.json({
        success: false,
        message: '结束时间必须晚于开始时间'
      }, { status: 400 });
    }
    
    if (start < new Date()) {
      return NextResponse.json({
        success: false,
        message: '开始时间不能早于当前时间'
      }, { status: 400 });
    }
    
    // 创建新活动
    const newActivity = new Activity({
      activityName: activityName.trim(),
      trainerId,
      trainerName: trainerName || trainer.username,
      startTime: start,
      endTime: end,
      location: location.trim(),
      description: description?.trim() || '',
      participants: [],
      isActive: true
    });
    
    const savedActivity = await newActivity.save();
    
    return NextResponse.json({
      success: true,
      data: savedActivity,
      message: '活动创建成功'
    }, { status: 201 });
  } catch (error: any) {
    console.error('创建活动失败:', error);
    return NextResponse.json({
      success: false,
      message: '创建活动失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
} 