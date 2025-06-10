const express = require('express');
const cors = require('cors');

const rulesRoutes = require('./routes/rules');
const metricRoutes = require('./routes/metrics');
const notificationRoutes = require('./routes/notifications');
const webhooksRoutes = require('./routes/webhooks');
const authRoutes = require('./routes/auth');
const protect = require('./middleware/authMiddleware');
const googleRoutes = require('./routes/googleauth');
const metricLogsRoutes = require('./routes/metricLogs');
const ruleBreachLogRoutes = require('./routes/ruleBreachLog');
const exportRoutes = require('./routes/exportRoutes');
const importRoutes = require('./routes/importRoutes');

const app = express();

app.use(cors({
    origin: [
        'http://localhost:3000',  // for local development
        'http://frontend:3000'    // for Docker Compose
    ]
}));
app.use(express.json());

app.use((req, res, next) => {
    console.log(req.path, req.method);
    next();
});

// Route mounts
app.use('/api/v1/rules', protect, rulesRoutes);
app.use('/api/v1/metrics', protect, metricRoutes);
app.use('/api/v1/notifications', protect, notificationRoutes);
app.use('/webhooks', webhooksRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/google', googleRoutes);
app.use('/api/v1/metric-logs', protect, metricLogsRoutes);
app.use('/api/v1/rule-breach-logs', protect, ruleBreachLogRoutes);
app.use('/api/v1/export', protect, exportRoutes);
app.use('/api/v1/import', protect, importRoutes);

// Swagger docs (if needed)
require('./utils/swagger')(app);

module.exports = app;
