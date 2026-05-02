import express from 'express';
import cors from 'cors';
import usersRouter from './routes/users.js';
import worldsRouter from './routes/worlds.js';
import eventsRouter from './routes/events.js';
import postsRouter from './routes/posts.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/users', usersRouter);
app.use('/api/worlds', worldsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/posts', postsRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`LACEBO server running on http://localhost:${PORT}`);
});
