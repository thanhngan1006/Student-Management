const mongoose = require('mongoose');

// Định nghĩa schema cho một tiết học
const periodSchema = new mongoose.Schema(
    {
        period: { type: Number, required: true,  min: 1, max: 5 },
        subject: { type: String, required: true, trim: true },
        teacher_id: { type: String, required: true,  trim: true}
    }
);

// Định nghĩa schema cho một ngày
const daySchema = new mongoose.Schema(
    {
        day: { type: String, required: true, enum: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6'] },
        periods: [periodSchema] // Mảng các tiết học trong ngày
    }
);

// Định nghĩa schema chính cho thời khóa biểu của một lớp
const scheduleSchema = new mongoose.Schema(
    {
        className: { type: String, required: true, trim: true },
        schoolYear: { type: String, required: true, trim: true, default: '2024-2025' },
        semester: { type: Number,  required: true, enum: [1, 2], default: 1 },
        schedule: [daySchema],
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date,
            default: Date.now
        },
        version: {
            type: Number,
            default: 1
        },
        isApproved: { type: Boolean, default: false },
    }
);

// Middleware để tự động cập nhật thời gian updatedAt khi document được cập nhật
scheduleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

scheduleSchema.statics.createNewSchedule = async function(className, schoolYear, semester, scheduleData) {
    const latestSchedule = await this.findOne({ className, schoolYear, semester })
      .sort({ createdAt: -1 }) // Sắp xếp theo createdAt giảm dần
      .exec();
  
    const newVersion = latestSchedule ? latestSchedule.version + 1 : 1;
  
    const newSchedule = new this({
      className,
      schoolYear,
      semester,
      schedule: scheduleData,
      version: newVersion
    });
  
    return newSchedule.save();
};

module.exports = mongoose.model('schedules', scheduleSchema);
