
import express from 'express';
import cors from 'cors';
import config from './config/index.js';
import { initDatabase } from './database/schema.js';
import usersRouter from './routes/users.js';
import worldsRouter from './routes/worlds.js';
import eventsRouter from './routes/events.js';
import postsRouter from './routes/posts.js';

// Initialize database tables
initDatabase();

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.use('/api/users', usersRouter);
app.use('/api/worlds', worldsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/posts', postsRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(config.port, () => {
  console.log(`LACEBO server running on http://localhost:${config.port}`); // temporary setup DB
});
