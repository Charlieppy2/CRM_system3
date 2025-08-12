import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import Account from '@/models/Account';
import { getAuthUser } from '@/lib/auth';

// GET - 按日期获取出席记录
export async function GET(request: NextRequest) {
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
    
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    
    if (!date) {
      return NextResponse.json(
        { error: '請提供日期參數' },
        { status: 400 }
      );
    }
    
    // 解析日期并设置当天的开始和结束时间
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    // 构建查询条件
    let query: any = {
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    };

    // 根据用户角色设置查询条件
    if (user.role === 'admin') {
      // 管理员可以看到所有出席记录
    } else if (user.role === 'trainer') {
      // 教练只能看到他们有权限的地区的出席记录
      if (!user.locations || user.locations.length === 0) {
        // 如果教练没有任何地区权限，返回空数组
        return NextResponse.json([], { status: 200 });
      }
      query.location = { $in: user.locations };
    } else {
      // 其他角色暂时不允许访问出席记录
      return NextResponse.json(
        { error: '您没有权限查看出席记录' },
        { status: 403 }
      );
    }
    
    // 查询指定日期范围内的记录
    const attendances = await Attendance.find(query).sort({ createdAt: -1 });
    
    return NextResponse.json(attendances, { status: 200 });
  } catch (error) {
    console.error('按日期获取出席记录失败:', error);
    return NextResponse.json(
      { error: '获取出席记录失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
} 