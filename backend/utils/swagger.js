const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Pulse API',
            version: '1.0.0',
            description: 'API documentation for Pulse Alert System',
        },
        servers: [
            {
                url: `${process.env.APP_URL}/api/v1`,
                description: 'Main API Server',
            },
            {
                url: `${process.env.APP_URL}`,
                // ...
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: [
        './routes/auth.js',
        './routes/rules.js',
        './routes/metrics.js',
        './routes/notifications.js',
        './routes/webhooks.js',
        './routes/googleauth.js',
        './routes/metricLogs.js',
        './routes/RuleBreachLog.js',
        './routes/exportRoutes.js',
        './routes/importRoutes.js'
    ],
};

const swaggerSpec = swaggerJsDoc(options);

// Register Swagger UI route
module.exports = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
