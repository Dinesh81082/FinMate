import dotenv from 'dotenv';
dotenv.config();

console.log("Loaded DB_HOST:", process.env.DB_HOST);
console.log("Loaded DB_USER:", process.env.DB_USER);
console.log("Current directory:", process.cwd());

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import app from './backend/app.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

async function bootstrapServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Development mode: Run Vite middleware to serve frontend HMR & preview on port 3000
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve static Vite build files from dist/
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.use('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 FinMate Server successfully running on port ${PORT}`);
  });
}

bootstrapServer().catch((err) => {
  console.error('Fatal Server Bootstrap Error:', err);
  process.exit(1);
});
