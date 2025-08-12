import mongoose, { Schema, Document } from 'mongoose';

export interface ITrainerProfile extends Document {
  trainerId: mongoose.Types.ObjectId;    // 教练ID
  trainerUsername: string;               // 教练用户名
  otherWorkHours: number;                // 其他工作时间（小时）
  notes?: string;                        // 备注
  createdAt: Date;
  updatedAt: Date;
}

const TrainerProfileSchema: Schema = new Schema({
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: [true, '请指定教练ID'],
    unique: true
  },
  trainerUsername: {
    type: String,
    required: [true, '请提供教练用户名'],
    trim: true
  },
  otherWorkHours: {
    type: Number,
    default: 0,
    min: [0, '其他工作时间不能为负数']
  },
  notes: {
    type: String,
    trim: true,
    maxLength: [500, '备注不能超过500个字符']
  }
}, {
  timestamps: true,
  collection: 'trainer_profiles'
});

// 创建索引
TrainerProfileSchema.index({ trainerId: 1 });

// 删除现有模型（如果存在）并重新创建
if (mongoose.models.TrainerProfile) {
  delete mongoose.models.TrainerProfile;
}

export default mongoose.model<ITrainerProfile>('TrainerProfile', TrainerProfileSchema); 