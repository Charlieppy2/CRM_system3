import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import Account from '@/models/Account';
import { getAuthUser } from '@/lib/auth';

// 获取用户有权限访问的出席记录
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // 验证用户身份
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: '未授权访问' },
        { status: 401 }
      );
    }

    // 获取用户详细信息
    const user = await Account.findById(authUser.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }

    let attendanceQuery: any = {};

    // 根据用户角色设置查询条件
    if (user.role === 'admin') {
      // 管理员可以看到所有出席记录
      // 不设置任何过滤条件
    } else if (user.role === 'trainer') {
      // 教练只能看到他们有权限的地区的出席记录
      if (!user.locations || user.locations.length === 0) {
        // 如果教练没有任何地区权限，返回空数组
        return NextResponse.json({
          success: true,
          data: [],
          message: '您目前没有任何地区权限，无法查看出席记录'
        });
      }
      
      // 过滤出席记录，只显示教练有权限的地区
      attendanceQuery.location = { $in: user.locations };
    } else {
      // 其他角色暂时不允许访问出席记录
      return NextResponse.json(
        { success: false, message: '您没有权限查看出席记录' },
        { status: 403 }
      );
    }

    // 获取URL参数
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const date = searchParams.get('date');
    const location = searchParams.get('location');

    // 添加额外的过滤条件
    if (name) {
      attendanceQuery.name = { $regex: name, $options: 'i' };
    }

    if (date) {
      const targetDate = new Date(date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      attendanceQuery.createdAt = {
        $gte: targetDate,
        $lt: nextDay
      };
    }

    if (location) {
      // 如果指定了地区，还需要确保用户有权限查看该地区
      if (user.role === 'trainer' && !user.locations.includes(location)) {
        return NextResponse.json(
          { success: false, message: '您没有权限查看该地区的出席记录' },
          { status: 403 }
        );
      }
      attendanceQuery.location = location;
    }

    // 查询出席记录
    const attendances = await Attendance.find(attendanceQuery)
      .sort({ createdAt: -1 })
      .limit(100); // 限制返回数量

    return NextResponse.json({
      success: true,
      data: attendances,
      userRole: user.role,
      userLocations: user.locations || []
    });

  } catch (error) {
    console.error('获取出席记录失败:', error);
    return NextResponse.json(
      { success: false, message: '获取出席记录失败' },
      { status: 500 }
    );
  }
} 