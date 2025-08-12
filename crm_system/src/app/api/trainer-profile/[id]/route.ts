import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TrainerProfile from '@/models/TrainerProfile';
import Account from '@/models/Account';

interface Params {
  id: string;
}

// GET - 获取教练详细信息
export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    await connectDB();
    
    const { id } = await params;

    // 查找教练档案
    const profile = await TrainerProfile.findOne({ trainerId: id });

    if (!profile) {
      return NextResponse.json({
        success: false,
        message: '教练档案不存在'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: profile,
      message: '获取教练档案成功'
    });

  } catch (error: any) {
    console.error('获取教练档案失败:', error);
    return NextResponse.json({
      success: false,
      message: '获取教练档案失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// PUT - 更新或创建教练档案
export async function PUT(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    await connectDB();
    
    const { id } = await params;
    const { otherWorkHours, notes, trainerUsername } = await request.json();

    // 验证输入
    if (typeof otherWorkHours !== 'number' || otherWorkHours < 0) {
      return NextResponse.json({
        success: false,
        message: '工作时间必须是非负数'
      }, { status: 400 });
    }

    // 验证教练是否存在
    const trainer = await Account.findById(id);
    if (!trainer || trainer.role !== 'trainer') {
      return NextResponse.json({
        success: false,
        message: '教练不存在'
      }, { status: 404 });
    }

    // 更新或创建教练档案
    const profile = await TrainerProfile.findOneAndUpdate(
      { trainerId: id },
      {
        trainerId: id,
        trainerUsername: trainerUsername || trainer.username,
        otherWorkHours,
        notes: notes || ''
      },
      { 
        new: true, 
        upsert: true // 如果不存在则创建
      }
    );

    return NextResponse.json({
      success: true,
      data: profile,
      message: '教练档案更新成功'
    });

  } catch (error: any) {
    console.error('更新教练档案失败:', error);
    return NextResponse.json({
      success: false,
      message: '更新教练档案失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
} 