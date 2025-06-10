require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app'); // Import your now-complete app
const { evaluateRules } = require('./services/alertEngine');
const fetchWeatherData  = require('./services/fetchMetricService');
const appEvents = require('./events');

// Start recurring jobs (weather/rule eval)
setInterval(() => {
    fetchWeatherData();
    evaluateRules();
}, process.env.EVALUATION_INTERVAL || 60000);

appEvents.on('dataChanged', () => {
    console.log('📢 Data changed (rule/metric). Evaluating rules immediately...');
    evaluateRules();
});

// Connect to MongoDB and start the server
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("Connected to database");
        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        });
    })
    .catch(err => {
        console.error('DB connection failed', err);
        process.exit(1);
    });
