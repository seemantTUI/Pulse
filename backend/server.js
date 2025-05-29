require('dotenv').config();

const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors');
const rulesRoutes = require('./routes/rules'); 
const metricRoutes = require('./routes/metrics'); 
const notificationRoutes = require('./routes/notifications');
const { evaluateRules } = require('./services/alertEngine');
const webhooksRoutes = require('./routes/webhooks');
const fetchWeatherData  = require('./services/fetchMetricService');
const authRoutes = require('./routes/auth');
const protect = require('./middleware/authMiddleware');
const googleRoutes = require('./routes/googleauth');
const metricLogsRoutes = require('./routes/metricLogs')
const ruleBreachLogRoutes = require('./routes/ruleBreachLog');
const exportRoutes = require('./routes/exportRoutes');
const importRoutes = require('./routes/importRoutes');


const app = express()
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json())

app.use((req, res, next) => {
    console.log(req.path, req.method)
    next()
  })

app.use('/api/v1/rules', protect, rulesRoutes);
app.use('/api/v1/metrics', protect, metricRoutes);
app.use('/api/v1/notifications', protect, notificationRoutes);
app.use('/webhooks', protect, webhooksRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/google', googleRoutes);
app.use('/api/v1/metric-logs',protect, metricLogsRoutes);
app.use('/api/v1/rule-breach-logs', protect, ruleBreachLogRoutes);
app.use('/api/v1/export', protect, exportRoutes);
app.use('/api/v1/import', protect, importRoutes);


require('./utils/swagger')(app);

setInterval(() => {
  fetchWeatherData();
    evaluateRules();
  }, process.env.EVALUATION_INTERVAL || 60000);
  

mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true})
    .then(() => {
        console.log("Connected to database")
        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`)
        })
    })

