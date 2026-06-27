import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes/index.ts';
import { errorHandler } from './middleware/errorHandler.ts';

const app = express();

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for iframe preview compatibility
  crossOriginEmbedderPolicy: false
}));

// CORS Setup
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logger Middleware
app.use(morgan('dev'));

// JSON Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Attach MVC API Routes
app.use(routes);

// Global Error Handler Middleware
app.use(errorHandler);

export default app;
