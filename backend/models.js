import mongoose from 'mongoose';

// User Model
const userSchema = new mongoose.Schema({
  googleId: { type: String, unique: true, required: true },
  email: { type: String, required: true },
  name: String,
  avatar: String,
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  badges: [{ id: String, name: String, icon: String, earnedAt: Date }],
  streakFreezes: { type: Number, default: 3 },
  mood: [{ date: Date, score: Number, note: String }],
  createdAt: { type: Date, default: Date.now }
});

// Habit Model
const habitSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: String,
  category: { type: String, default: 'general' },
  type: { type: String, enum: ['boolean', 'count', 'time'], default: 'boolean' },
  targetValue: { type: Number, default: 1 },
  unit: String, // e.g., "minutes", "pages", "reps"
  color: { type: String, default: '#6366f1' },
  icon: { type: String, default: '✨' },
  scheduleDays: [{ type: Number }], // 0=Sun to 6=Sat, empty = daily
  reminderTime: String, // "08:00"
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});
habitSchema.index({ userId: 1, isActive: 1, order: 1 });

// Cycle Model — each habit run in monthly cycles
const cycleSchema = new mongoose.Schema({
  habitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  label: String, // e.g. "March 2026"
  isActive: { type: Boolean, default: true },
  // Stored at cycle end:
  consistencyScore: Number, // completed / total days in cycle
  totalDays: Number,
  completedDays: Number,
  closedAt: Date
});
cycleSchema.index({ userId: 1, habitId: 1, isActive: 1, startDate: -1 });

// Daily Entry — one per habit per day
const entrySchema = new mongoose.Schema({
  habitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', required: true },
  cycleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cycle', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  completed: { type: Boolean, default: false },
  value: Number, // for count/time habits
  note: String,
  streakFreezeUsed: { type: Boolean, default: false }
});
entrySchema.index({ habitId: 1, date: 1 }, { unique: true });
entrySchema.index({ userId: 1, date: 1 });
entrySchema.index({ userId: 1, habitId: 1, date: 1 });

// One-off tasks scheduled for a specific calendar day (calendar / future planning)
const plannedTaskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  note: String,
  scheduledDate: { type: Date, required: true },
  completed: { type: Boolean, default: false },
  color: { type: String, default: '#7c6af7' },
  createdAt: { type: Date, default: Date.now }
});
plannedTaskSchema.index({ userId: 1, scheduledDate: 1 });

export const User = mongoose.model('User', userSchema);
export const Habit = mongoose.model('Habit', habitSchema);
export const Cycle = mongoose.model('Cycle', cycleSchema);
export const Entry = mongoose.model('Entry', entrySchema);
export const PlannedTask = mongoose.model('PlannedTask', plannedTaskSchema);
