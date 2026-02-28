import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import connectAllDatabases from './config/init-db.js';
import authRoutes from './routes/auth-routes.js';
import userRoutes from './routes/token-update-route.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

app.get('/', (req, res) => {
  res.send('Budget Buddy API is running');
});

const startServer = async () => {
  try {
    await connectAllDatabases();

    app.listen(PORT, () => {
      console.log(`\nServer running on http://localhost:${PORT}`);
      console.log(`Accepting requests from: ${CLIENT_URL}`);
    });
  } catch (error) {
    console.error('Fatal Error: Server failed to start', error);
    process.exit(1);
  }
};

startServer();
