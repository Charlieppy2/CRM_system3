import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import Account from '@/models/Account';
import { getAuthUser } from '@/lib/auth';

// GET - 获取所有出席记录
export async function GET() {
  try {
    await connectDB();
    const attendances = await Attendance.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json(attendances, { status: 200 });
  } catch (error) {
    console.error('获取出席记录失败:', error);
    return NextResponse.json(
      { error: '获取出席记录失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// POST - 创建新的出席记录
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // 验证用户身份
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    // 获取用户详细信息
    const user = await Account.findById(authUser.userId);
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }
    
    const body = await request.json();
    const { name, contactInfo, location, activity, activityId, memberId } = body;
    
    // 验证必需字段
    if (!name || !contactInfo || !location || !activity) {
      return NextResponse.json(
        { error: '所有字段都是必需的：姓名、联系方式、地点、活动内容' },
        { status: 400 }
      );
    }
    
    // 检查用户是否有权限在该地区创建记录
    if (user.role === 'trainer') {
      // 教练只能在他们有权限的地区创建记录
      if (!user.locations || user.locations.length === 0) {
        return NextResponse.json(
          { error: '您没有任何地区权限，无法创建出席记录' },
          { status: 403 }
        );
      }
      
      if (!user.locations.includes(location)) {
        return NextResponse.json(
          { error: `您没有在 ${location} 创建出席记录的权限` },
          { status: 403 }
        );
      }
    } else if (user.role !== 'admin') {
      // 非管理员和教练暂时不允许创建记录
      return NextResponse.json(
        { error: '您没有权限创建出席记录' },
        { status: 403 }
      );
    }

    // 如果提供了memberId，验证会员并扣除quota
    if (memberId) {
      const member = await Account.findById(memberId);
      
      if (!member || member.role !== 'member') {
        return NextResponse.json(
          { error: '无效的会员ID' },
          { status: 400 }
        );
      }

      if (!member.isActive) {
        return NextResponse.json(
          { error: '该会员账户已被禁用' },
          { status: 400 }
        );
      }

      if (!member.quota || member.quota <= 0) {
        return NextResponse.json(
          { error: '该会员配额不足，无法参加活动' },
          { status: 400 }
        );
      }

      // 验证会员信息是否匹配
      const isNameMatch = member.memberName === name.trim();
      const isContactMatch = member.phone === contactInfo.trim() || member.email === contactInfo.trim();

      if (!isNameMatch || !isContactMatch) {
        return NextResponse.json(
          { error: '提供的姓名和联系方式与会员记录不匹配' },
          { status: 400 }
        );
      }

      // 扣除配额（减1）
      member.quota = (member.quota || 0) - 1;
      await member.save();
    }
    
    const newAttendance = new Attendance({
      name: name.trim(),
      contactInfo: contactInfo.trim(),
      location: location.trim(),
      activity: activity.trim()
    });
    
    const savedAttendance = await newAttendance.save();
    
    // 如果指定了活动ID，将参与者添加到活动中
    if (activityId) {
      try {
        const Activity = require('@/models/Activity').default;
        await Activity.findByIdAndUpdate(
          activityId,
          { $addToSet: { participants: name.trim() } }, // 使用$addToSet避免重复
          { new: true }
        );
      } catch (error) {
        console.error('添加参与者到活动失败:', error);
        // 不影响出席记录的创建，只记录错误
      }
    }
    
    return NextResponse.json({
      ...savedAttendance.toObject(),
      quotaDeducted: !!memberId,
      activityUpdated: !!activityId
    }, { status: 201 });
  } catch (error) {
    console.error('创建出席记录失败:', error);
    return NextResponse.json(
      { error: '创建出席记录失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
} 