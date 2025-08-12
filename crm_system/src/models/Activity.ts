import mongoose, { Schema, Document } from 'mongoose';

export interface IActivity extends Document {
  activityName: string;          // 活动名称
  trainerId: mongoose.Types.ObjectId;    // 负责教练ID
  trainerName: string;           // 负责教练姓名（冗余存储，便于查询）
  startTime: Date;               // 开始时间
  endTime: Date;                 // 结束时间
  duration: number;              // 持续时间（小时）
  participants: string[];        // 参加成员列表（姓名）
  location: string;              // 活动地点
  description?: string;          // 活动描述
  isActive: boolean;             // 活动是否有效
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema: Schema = new Schema({
  activityName: {
    type: String,
    required: [true, '请提供活动名称'],
    trim: true,
    maxLength: [200, '活动名称不能超过200个字符']
  },
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: [true, '请指定负责教练']
  },
  trainerName: {
    type: String,
    required: [true, '请提供教练姓名'],
    trim: true
  },
  startTime: {
    type: Date,
    required: [true, '请提供开始时间']
  },
  endTime: {
    type: Date,
    required: [true, '请提供结束时间'],
    validate: {
      validator: function(this: IActivity, value: Date) {
        return value > this.startTime;
      },
      message: '结束时间必须晚于开始时间'
    }
  },
  duration: {
    type: Number,
    required: false,
    min: [0, '持续时间不能为负数']
  },
  participants: {
    type: [String],
    default: []
  },
  location: {
    type: String,
    required: [true, '请提供活动地点'],
    enum: ['灣仔', '黃大仙', '石門'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxLength: [1000, '活动描述不能超过1000个字符']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'activities'
});

// 自动计算持续时间
ActivitySchema.pre<IActivity>('save', function(next) {
  if (this.isModified('startTime') || this.isModified('endTime')) {
    const diffMs = this.endTime.getTime() - this.startTime.getTime();
    this.duration = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // 保留两位小数
  }
  next();
});

// 创建索引
ActivitySchema.index({ trainerId: 1 });
ActivitySchema.index({ startTime: -1 });
ActivitySchema.index({ isActive: 1 });
ActivitySchema.index({ location: 1 });

// 删除现有模型（如果存在）并重新创建
if (mongoose.models.Activity) {
  delete mongoose.models.Activity;
}

export default mongoose.model<IActivity>('Activity', ActivitySchema); 