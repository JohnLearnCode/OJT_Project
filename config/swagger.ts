import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EVCare API Documentation',
      version: '1.0.0',
      description: 'API documentation cho hệ thống quản lý lịch học EVCare',
      contact: {
        name: 'EVCare Team',
        email: 'support@evcare.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development Server'
      },
      {
        url: 'https://api.evcare.com',
        description: 'Production Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Nhập JWT token (không cần prefix "Bearer")'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './routes/*.ts',
    './controller/*.ts',
    './app.ts'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
