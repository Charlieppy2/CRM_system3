import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Activity from '@/models/Activity';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const trainerId = searchParams.get('trainerId');

    if (!trainerId) {
      return NextResponse.json({
        success: false,
        message: '请提供教练ID'
      }, { status: 400 });
    }

    // 根据教练ID查找活动记录
    const activities = await Activity.find({
      trainerId: trainerId,
      isActive: true
    }).sort({ startTime: -1 }); // 按开始时间倒序

    return NextResponse.json({
      success: true,
      data: activities,
      message: `找到 ${activities.length} 条活动记录`
    });

  } catch (error: any) {
    console.error('获取教练活动记录失败:', error);
    return NextResponse.json({
      success: false,
      message: '获取活动记录失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
} 