import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectAllDatabases from './config/init-db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Budget Buddy API is running 🚀');
});

const startServer = async () => {
  try {
    await connectAllDatabases();

    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('💀 Fatal Error: Server failed to start');
    process.exit(1);
  }
};

startServer();
