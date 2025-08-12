import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendance extends Document {
  name: string;              // 參加者姓名
  contactInfo: string;       // 聯絡方式
  location: string;          // 地點
  activity: string;          // 活動內容
  status: string;            // 出席狀態
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, '請提供參加者姓名'],
    trim: true,
    maxLength: [100, '姓名不能超過100個字符']
  },
  contactInfo: {
    type: String,
    required: [true, '請提供聯絡方式'],
    trim: true,
    maxLength: [200, '聯絡方式不能超過200個字符']
  },
  location: {
    type: String,
    required: [true, '請提供地點'],
    enum: ['灣仔', '黃大仙', '石門'],
    trim: true
  },
  activity: {
    type: String,
    required: [true, '請提供活動內容'],
    trim: true,
    maxLength: [1000, '活動內容不能超過1000個字符']
  },
  status: {
    type: String,
    enum: ['出席', '早退'],
    default: '出席',
    required: [true, '請提供出席狀態']
  }
}, {
  timestamps: true, // 自動添加 createdAt 和 updatedAt
  collection: 'attendance' // 明確指定 collection 名稱
});

// 創建複合索引以提高查詢性能
AttendanceSchema.index({ name: 1, createdAt: -1 });
AttendanceSchema.index({ location: 1 });
AttendanceSchema.index({ activity: 1 });

// 刪除現有模型（如果存在）並重新創建
if (mongoose.models.Attendance) {
  delete mongoose.models.Attendance;
}

export default mongoose.model<IAttendance>('Attendance', AttendanceSchema); 