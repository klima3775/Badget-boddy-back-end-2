import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const monoClient = axios.create({
  baseURL: process.env.MONO_BASE_URL,
  headers: {
    Authorization: `Bearer ${process.env.MONO_API_KEY}`,
  },
  timeout: 5000,
});

export default monoClient;
