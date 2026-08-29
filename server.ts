import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for Vite HMR/dev
  }));
  app.use(cors());
  app.use(express.json());

  // MongoDB Connection
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.warn('WARNING: MONGODB_URI is not defined. Database features will fail.');
  } else {
    try {
      await mongoose.connect(MONGODB_URI, {
        dbName: 'johya_fashions',
        serverSelectionTimeoutMS: 5000, // Fail fast if IP is not whitelisted
        connectTimeoutMS: 10000,
      });
      console.log('Connected to MongoDB');
    } catch (err: any) {
      console.error('MongoDB connection error:', err.message);
      console.warn('NOTE: If you see a ServerSelectionError, ensure your current IP is whitelisted in MongoDB Atlas (0.0.0.0/0 recommended for development).');
    }
  }

  // API Routes
  const customerRoutes = (await import('./server/routes/customerRoutes.js')).default;
  app.use('/api/customers', customerRoutes);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
