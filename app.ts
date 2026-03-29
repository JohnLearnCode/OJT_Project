import dotenv from 'dotenv';
dotenv.config();

import express, { Express } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

// Import configurations
import { connectDB, closeDB } from './config/database';
import swaggerSpec from './config/swagger';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import courseRoutes from './routes/course';
import locationRoutes from './routes/location';
import sessionRoutes from './routes/session';


// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { ResponseHelper } from './utils/response';

/**
 * Express Application 
 */

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan('dev'));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is running
 */
app.get('/health', (req, res) => {
  return ResponseHelper.success(res, 'Server is running', {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/ping', (req, res) => {
  return ResponseHelper.success(res, 'pong');
});


// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/sessions', sessionRoutes);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'API Docs'
}));

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);


// Khởi động server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Start listening
    app.listen(PORT, () => {
      console.log('\n🚀 Server is running!');
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Server URL: http://localhost:${PORT}`);
      console.log(`📚 Swagger Docs: http://localhost:${PORT}/api-docs`);
      console.log(`💚 Health Check: http://localhost:${PORT}/health\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start server automatically
startServer();

export default app;
