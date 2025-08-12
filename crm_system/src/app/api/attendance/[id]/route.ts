import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import mongoose from 'mongoose';

// PATCH - 更新出席记录
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    
    // 验证ID格式
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: '无效的记录ID' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { name, contactInfo, location, activity, status } = body;
    
    // 构建更新对象
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (contactInfo !== undefined) updateData.contactInfo = contactInfo.trim();
    if (location !== undefined) updateData.location = location.trim();
    if (activity !== undefined) updateData.activity = activity.trim();
    if (status !== undefined) updateData.status = status;
    
    // 检查是否有要更新的数据
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '没有提供要更新的数据' },
        { status: 400 }
      );
    }
    
    const updatedAttendance = await Attendance.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedAttendance) {
      return NextResponse.json(
        { error: '未找到指定的出席记录' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedAttendance, { status: 200 });
  } catch (error) {
    console.error('更新出席记录失败:', error);
    return NextResponse.json(
      { error: '更新出席记录失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// DELETE - 删除指定ID的出席记录
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    // 验证ID格式
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: '无效的记录ID' },
        { status: 400 }
      );
    }
    
    const deletedAttendance = await Attendance.findByIdAndDelete(id);
    
    if (!deletedAttendance) {
      return NextResponse.json(
        { error: '未找到指定的出席记录' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { message: '出席记录已成功删除', deletedRecord: deletedAttendance },
      { status: 200 }
    );
  } catch (error) {
    console.error('删除出席记录失败:', error);
    return NextResponse.json(
      { error: '删除出席记录失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
} 