import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { User, Habit, Cycle, Entry } from './models.js';
import { auth } from './middleware.js';
import { startOfDay, endOfDay, differenceInDays, format, addMonths, startOfMonth, endOfMonth } from 'date-fns';

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── AUTH ────────────────────────────────────────────────────────────────────
router.post('/auth/google', async (req, res) => {
  try {
    const { credential } = req.body;
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    let user = await User.findOne({ googleId: payload.sub });
    if (!user) {
      user = await User.create({
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        avatar: payload.picture
      });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.get('/auth/me', auth, (req, res) => res.json(req.user));

// ─── HABITS ──────────────────────────────────────────────────────────────────
router.get('/habits', auth, async (req, res) => {
  const habits = await Habit.find({ userId: req.user._id, isActive: true }).sort('order').lean();
  res.json(habits);
});

// ─── TODAY AGGREGATE ──────────────────────────────────────────────────────────
router.get('/today', auth, async (req, res) => {
  const { date } = req.query;
  const d = startOfDay(new Date(date || new Date()));
  const from = startOfDay(d);
  const to = endOfDay(d);

  const [habits, entries, user] = await Promise.all([
    Habit.find({ userId: req.user._id, isActive: true }).sort('order').lean(),
    Entry.find({ userId: req.user._id, date: { $gte: from, $lte: to } }).sort('date').lean(),
    User.findById(req.user._id, { mood: 1 }).lean()
  ]);

  const mood = (user?.mood || []).find(m => startOfDay(new Date(m.date)).getTime() === from.getTime()) || null;
  res.json({ habits, entries, mood });
});

router.post('/habits', auth, async (req, res) => {
  const habit = await Habit.create({ ...req.body, userId: req.user._id });
  // Auto-create first cycle: current month
  const now = new Date();
  await Cycle.create({
    habitId: habit._id,
    userId: req.user._id,
    startDate: startOfMonth(now),
    endDate: endOfMonth(now),
    label: format(now, 'MMMM yyyy'),
    isActive: true
  });
  res.json(habit);
});

router.patch('/habits/:id', auth, async (req, res) => {
  const habit = await Habit.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    req.body,
    { new: true }
  );
  res.json(habit);
});

router.delete('/habits/:id', auth, async (req, res) => {
  await Habit.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { isActive: false });
  res.json({ success: true });
});

// ─── CYCLES ──────────────────────────────────────────────────────────────────
router.get('/cycles/:habitId', auth, async (req, res) => {
  const cycles = await Cycle.find({ habitId: req.params.habitId, userId: req.user._id }).sort('-startDate').lean();
  res.json(cycles);
});

router.post('/cycles/:habitId/new', auth, async (req, res) => {
  // Close current active cycle if exists
  const habit = await Habit.findOne({ _id: req.params.habitId, userId: req.user._id });
  if (!habit) return res.status(404).json({ error: 'Not found' });

  const activeCycle = await Cycle.findOne({ habitId: habit._id, isActive: true });
  if (activeCycle) {
    const entries = await Entry.find({ cycleId: activeCycle._id });
    const totalDays = differenceInDays(activeCycle.endDate, activeCycle.startDate) + 1;
    const completedDays = entries.filter(e => e.completed).length;
    await Cycle.findByIdAndUpdate(activeCycle._id, {
      isActive: false,
      consistencyScore: totalDays > 0 ? completedDays / totalDays : 0,
      totalDays,
      completedDays,
      closedAt: new Date()
    });
  }

  const { startDate, endDate, label } = req.body;
  const cycle = await Cycle.create({
    habitId: habit._id,
    userId: req.user._id,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    label: label || format(new Date(startDate), 'MMMM yyyy'),
    isActive: true
  });
  res.json(cycle);
});

// ─── ENTRIES ─────────────────────────────────────────────────────────────────
router.get('/entries', auth, async (req, res) => {
  const { from, to, habitId } = req.query;
  const filter = { userId: req.user._id };
  if (habitId) filter.habitId = habitId;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = startOfDay(new Date(from));
    if (to) filter.date.$lte = endOfDay(new Date(to));
  }
  const entries = await Entry.find(filter).sort('date').lean();
  res.json(entries);
});

router.post('/entries/toggle', auth, async (req, res) => {
  const { habitId, date, value, note } = req.body;
  const d = startOfDay(new Date(date));

  const cycle = await Cycle.findOne({
    habitId,
    userId: req.user._id,
    isActive: true,
    startDate: { $lte: d },
    endDate: { $gte: d }
  });
  if (!cycle) return res.status(400).json({ error: 'No active cycle for this date' });

  let entry = await Entry.findOne({ habitId, userId: req.user._id, date: d });
  if (entry) {
    entry.completed = !entry.completed;
    if (value !== undefined) entry.value = value;
    if (note !== undefined) entry.note = note;
    await entry.save();
  } else {
    entry = await Entry.create({
      habitId,
      cycleId: cycle._id,
      userId: req.user._id,
      date: d,
      completed: true,
      value,
      note
    });
  }

  // Award XP
  if (entry.completed) {
    await User.findByIdAndUpdate(req.user._id, { $inc: { xp: 10 } });
    await checkLevelUp(req.user._id);
    await checkBadges(req.user._id);
  }

  res.json(entry);
});

// ─── ANALYTICS ───────────────────────────────────────────────────────────────
router.get('/analytics/overview', auth, async (req, res) => {
  const habits = await Habit.find({ userId: req.user._id, isActive: true });
  const now = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 86400000);

  const results = await Promise.all(habits.map(async (h) => {
    const entries = await Entry.find({
      habitId: h._id,
      userId: req.user._id,
      date: { $gte: thirtyDaysAgo },
      completed: true
    });
    const streak = await calcStreak(h._id, req.user._id);
    const cycles = await Cycle.find({ habitId: h._id, isActive: false }).sort('-closedAt').limit(6);
    return {
      habit: h,
      completedLast30: entries.length,
      streak,
      cycleHistory: cycles
    };
  }));

  const user = await User.findById(req.user._id);
  res.json({ habits: results, user });
});

router.get('/analytics/heatmap', auth, async (req, res) => {
  const { year } = req.query;
  const y = parseInt(year || new Date().getFullYear());
  const entries = await Entry.find({
    userId: req.user._id,
    date: { $gte: new Date(`${y}-01-01`), $lte: new Date(`${y}-12-31`) },
    completed: true
  });
  // Group by date
  const map = {};
  entries.forEach(e => {
    const key = format(e.date, 'yyyy-MM-dd');
    map[key] = (map[key] || 0) + 1;
  });
  res.json(map);
});

router.get('/analytics/insights', auth, async (req, res) => {
  const habits = await Habit.find({ userId: req.user._id, isActive: true });
  const entries = await Entry.find({ userId: req.user._id, completed: true })
    .sort('date').limit(500);

  // Best day of week
  const dayCount = [0, 0, 0, 0, 0, 0, 0];
  entries.forEach(e => { dayCount[new Date(e.date).getDay()]++; });
  const bestDay = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][dayCount.indexOf(Math.max(...dayCount))];

  // Consistency last 4 weeks
  const weeklyConsistency = [];
  for (let i = 3; i >= 0; i--) {
    const wStart = new Date(Date.now() - (i + 1) * 7 * 86400000);
    const wEnd = new Date(Date.now() - i * 7 * 86400000);
    const count = entries.filter(e => e.date >= wStart && e.date <= wEnd).length;
    weeklyConsistency.push({ week: `W-${i}`, count });
  }

  const user = await User.findById(req.user._id);
  const mood = user.mood?.slice(-30) || [];

  res.json({ bestDay, weeklyConsistency, habitCount: habits.length, mood });
});

// ─── MOOD ─────────────────────────────────────────────────────────────────────
router.post('/mood', auth, async (req, res) => {
  const { score, note } = req.body;
  const today = startOfDay(new Date());
  const user = req.user;
  // Remove today's entry if exists
  user.mood = (user.mood || []).filter(m => !startOfDay(new Date(m.date)).getTime() === today.getTime());
  user.mood.push({ date: today, score, note });
  await user.save();
  res.json({ success: true });
});

// ─── FREEZE ──────────────────────────────────────────────────────────────────
router.post('/entries/freeze', auth, async (req, res) => {
  const { habitId, date } = req.body;
  const d = startOfDay(new Date(date));
  const user = await User.findById(req.user._id);
  if (user.streakFreezes <= 0) return res.status(400).json({ error: 'No freezes left' });

  const cycle = await Cycle.findOne({ habitId, userId: req.user._id, isActive: true });
  if (!cycle) return res.status(400).json({ error: 'No active cycle' });

  const entry = await Entry.findOneAndUpdate(
    { habitId, userId: req.user._id, date: d },
    { habitId, cycleId: cycle._id, userId: req.user._id, date: d, completed: true, streakFreezeUsed: true },
    { upsert: true, new: true }
  );
  await User.findByIdAndUpdate(req.user._id, { $inc: { streakFreezes: -1 } });
  res.json(entry);
});

// ─── AI SUGGESTIONS ──────────────────────────────────────────────────────────
router.get('/ai/suggestions', auth, async (req, res) => {
  const habits = await Habit.find({ userId: req.user._id, isActive: true });
  const entries = await Entry.find({ userId: req.user._id }).sort('-date').limit(200);

  // Simple heuristic-based suggestions (no external AI API key needed)
  const completionRates = await Promise.all(habits.map(async h => {
    const last14 = entries.filter(e => e.habitId.toString() === h._id.toString()).slice(0, 14);
    const rate = last14.length ? last14.filter(e => e.completed).length / last14.length : 0;
    return { habit: h, rate };
  }));

  const atRisk = completionRates.filter(x => x.rate < 0.4).map(x => ({
    type: 'warning',
    habitId: x.habit._id,
    habitName: x.habit.name,
    message: `You're completing "${x.habit.name}" only ${Math.round(x.rate * 100)}% of the time. Try scheduling it at a specific time.`
  }));

  const strong = completionRates.filter(x => x.rate >= 0.8).map(x => ({
    type: 'praise',
    habitId: x.habit._id,
    habitName: x.habit.name,
    message: `"${x.habit.name}" is going great at ${Math.round(x.rate * 100)}%! Consider adding a stretch goal.`
  }));

  res.json([...atRisk, ...strong]);
});

// ─── AI CHAT ─────────────────────────────────────────────────────────────────
router.post('/ai/chat', auth, async (req, res) => {
  const { messages, context } = req.body;
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 600,
        system: `You are a compassionate, science-backed habit coach. Be concise (2-3 sentences). The user's current habit data:\n${context}`,
        messages: messages.slice(-10) // keep last 10 for context window
      })
    });
    const data = await response.json();
    const reply = data.content?.[0]?.text || "I couldn't generate a response.";
    res.json({ reply });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── HELPERS ─────────────────────────────────────────────────────────────────
async function calcStreak(habitId, userId) {
  const entries = await Entry.find({ habitId, userId, completed: true }).sort('-date');
  if (!entries.length) return 0;
  let streak = 0;
  let d = startOfDay(new Date());
  for (const e of entries) {
    const entryDay = startOfDay(new Date(e.date));
    if (Math.abs(differenceInDays(d, entryDay)) <= 1) {
      streak++;
      d = entryDay;
    } else break;
  }
  return streak;
}

async function checkLevelUp(userId) {
  const user = await User.findById(userId);
  const newLevel = Math.floor(user.xp / 500) + 1;
  if (newLevel > user.level) await User.findByIdAndUpdate(userId, { level: newLevel });
}

async function checkBadges(userId) {
  const user = await User.findById(userId);
  const entries = await Entry.find({ userId, completed: true });
  const badgeIds = user.badges.map(b => b.id);
  const newBadges = [];

  if (entries.length >= 1 && !badgeIds.includes('first_complete'))
    newBadges.push({ id: 'first_complete', name: 'First Step', icon: '👣' });
  if (entries.length >= 50 && !badgeIds.includes('fifty_done'))
    newBadges.push({ id: 'fifty_done', name: 'On a Roll', icon: '🔥' });
  if (entries.length >= 100 && !badgeIds.includes('century'))
    newBadges.push({ id: 'century', name: 'Century', icon: '💯' });

  if (newBadges.length) {
    await User.findByIdAndUpdate(userId, {
      $push: { badges: { $each: newBadges.map(b => ({ ...b, earnedAt: new Date() })) } }
    });
  }
}

export default router;
