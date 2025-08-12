import mongoose, { Schema, Document } from 'mongoose';

export interface IFinancialRecord extends Document {
  recordType: 'income' | 'expense';    // 記錄類型：收入或支出
  memberName: string;                  // 成員姓名
  item: string;                        // 項目名稱
  details?: string;                    // 詳細描述
  location: string;                    // 地點
  unitPrice: number;                   // 單價
  quantity: number;                    // 數量
  totalAmount: number;                 // 總額
  recordDate: Date;                    // 記錄日期
  createdBy: mongoose.Types.ObjectId;  // 創建者ID
  createdAt: Date;
  updatedAt: Date;
}

const FinancialRecordSchema: Schema = new Schema({
  recordType: {
    type: String,
    enum: ['income', 'expense'],
    required: [true, '請選擇記錄類型'],
    default: 'income'
  },
  memberName: {
    type: String,
    required: [true, '請提供成員姓名'],
    trim: true,
    maxLength: [100, '成員姓名不能超過100個字符']
  },
  item: {
    type: String,
    required: [true, '請提供項目名稱'],
    trim: true,
    maxLength: [200, '項目名稱不能超過200個字符']
  },
  details: {
    type: String,
    trim: true,
    maxLength: [1000, '詳細描述不能超過1000個字符']
  },
  location: {
    type: String,
    required: [true, '請提供地點'],
    enum: ['灣仔', '黃大仙', '石門'],
    trim: true
  },
  unitPrice: {
    type: Number,
    required: [true, '請提供單價'],
    min: [0, '單價不能為負數']
  },
  quantity: {
    type: Number,
    required: [true, '請提供數量'],
    min: [1, '數量至少為1'],
    default: 1
  },
  totalAmount: {
    type: Number,
    required: false, // 改為非必填，因為會自動計算
    min: [0, '總額不能為負數']
  },
  recordDate: {
    type: Date,
    required: [true, '請提供記錄日期'],
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: [true, '請指定創建者']
  }
}, {
  timestamps: true,
  collection: 'financial_records'
});

// 自動計算總額
FinancialRecordSchema.pre<IFinancialRecord>('save', function(next) {
  // 總是計算總額，確保數據一致性
  this.totalAmount = this.unitPrice * this.quantity;
  next();
});

// 創建索引
FinancialRecordSchema.index({ recordType: 1 });
FinancialRecordSchema.index({ memberName: 1 });
FinancialRecordSchema.index({ recordDate: -1 });
FinancialRecordSchema.index({ location: 1 });
FinancialRecordSchema.index({ createdBy: 1 });

// 刪除現有模型（如果存在）並重新創建
if (mongoose.models.FinancialRecord) {
  delete mongoose.models.FinancialRecord;
}

// 創建模型
const FinancialRecordModel = mongoose.model<IFinancialRecord>('FinancialRecord', FinancialRecordSchema);

export default FinancialRecordModel; 