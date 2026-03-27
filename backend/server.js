import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import cron from 'node-cron';
import rateLimit from 'express-rate-limit';
import routes from './routes.js';
import { Cycle, Habit, Entry } from './models.js';
import { differenceInDays, endOfMonth, startOfMonth, format, addMonths } from 'date-fns';

dotenv.config();

const app = express();
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({ origin: clientUrl }));
app.use(compression());
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));
app.use('/api', routes);

// ─── CRON: Close cycles at month end & open new ones ─────────────────────────
cron.schedule('0 0 1 * *', async () => {
  const activeCycles = await Cycle.find({ isActive: true });
  for (const cycle of activeCycles) {
    const entries = await Entry.find({ cycleId: cycle._id });
    const totalDays = differenceInDays(cycle.endDate, cycle.startDate) + 1;
    const completedDays = entries.filter(e => e.completed).length;
    await Cycle.findByIdAndUpdate(cycle._id, {
      isActive: false,
      consistencyScore: totalDays > 0 ? completedDays / totalDays : 0,
      totalDays,
      completedDays,
      closedAt: new Date()
    });

    // Open next month cycle
    const nextStart = startOfMonth(addMonths(new Date(), 0));
    const nextEnd = endOfMonth(nextStart);
    await Cycle.create({
      habitId: cycle.habitId,
      userId: cycle.userId,
      startDate: nextStart,
      endDate: nextEnd,
      label: format(nextStart, 'MMMM yyyy'),
      isActive: true
    });
  }
  console.log('[CRON] Cycles rolled over at', new Date().toISOString());
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(process.env.PORT || 5000, () =>
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`)
    );
  })
  .catch(err => console.error('MongoDB error:', err));
