import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get('name');
    const contact = searchParams.get('contact');

    if (!name || !contact) {
      return NextResponse.json({
        success: false,
        message: '请提供会员姓名和联系方式'
      }, { status: 400 });
    }

    // 根据姓名和联系方式查找出席记录
    const attendanceRecords = await Attendance.find({
      name: name,
      contactInfo: contact
    }).sort({ createdAt: -1 }); // 按创建时间倒序

    return NextResponse.json({
      success: true,
      data: attendanceRecords,
      message: `找到 ${attendanceRecords.length} 条出席记录`
    });

  } catch (error: any) {
    console.error('获取会员出席记录失败:', error);
    return NextResponse.json({
      success: false,
      message: '获取出席记录失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
} 