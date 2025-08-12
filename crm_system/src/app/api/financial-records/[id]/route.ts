import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FinancialRecord from '@/models/FinancialRecord';

// 修改財務記錄
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('開始修改財務記錄...', params.id);
    
    await connectDB();
    console.log('數據庫連接成功');
    
    const body = await request.json();
    console.log('接收到的修改數據:', body);
    
    const {
      recordType,
      memberName,
      item,
      details,
      location,
      unitPrice,
      quantity,
      recordDate
    } = body;
    
    // 驗證必填字段
    if (!recordType || !memberName || !item || !location || unitPrice === undefined || !quantity) {
      console.log('必填字段驗證失敗');
      return NextResponse.json(
        { success: false, message: '請填寫所有必填字段' },
        { status: 400 }
      );
    }
    
    // 驗證數值
    if (unitPrice < 0 || quantity < 1) {
      console.log('數值驗證失敗:', { unitPrice, quantity });
      return NextResponse.json(
        { success: false, message: '單價和數量必須為正數' },
        { status: 400 }
      );
    }
    
    // 查找並更新記錄
    const updatedRecord = await FinancialRecord.findByIdAndUpdate(
      params.id,
      {
        recordType,
        memberName,
        item,
        details,
        location,
        unitPrice,
        quantity,
        recordDate: recordDate ? new Date(recordDate) : new Date()
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedRecord) {
      return NextResponse.json(
        { success: false, message: '財務記錄不存在' },
        { status: 404 }
      );
    }
    
    console.log('記錄更新成功:', updatedRecord._id);
    
    return NextResponse.json({
      success: true,
      message: '財務記錄修改成功',
      data: updatedRecord
    });
  } catch (error) {
    console.error('修改財務記錄失敗:', error);
    return NextResponse.json(
      { success: false, message: `修改財務記錄失敗: ${error.message}` },
      { status: 500 }
    );
  }
}

// 刪除財務記錄
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('開始刪除財務記錄...', params.id);
    
    await connectDB();
    console.log('數據庫連接成功');
    
    // 查找並刪除記錄
    const deletedRecord = await FinancialRecord.findByIdAndDelete(params.id);
    
    if (!deletedRecord) {
      return NextResponse.json(
        { success: false, message: '財務記錄不存在' },
        { status: 404 }
      );
    }
    
    console.log('記錄刪除成功:', deletedRecord._id);
    
    return NextResponse.json({
      success: true,
      message: '財務記錄刪除成功'
    });
  } catch (error) {
    console.error('刪除財務記錄失敗:', error);
    return NextResponse.json(
      { success: false, message: `刪除財務記錄失敗: ${error.message}` },
      { status: 500 }
    );
  }
} 