const axios = require('axios');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

const triggerNotification = async (rule, value) => {
    const user = rule.user;

    if (!user) {
        console.warn(`No user info available for rule: ${rule.ruleName}`);
        return;
    }

    const message = rule.alertMessage || `Alert! ${rule.metric.metricName} breached threshold with value ${value}.`;

    try {
        switch (user.notificationChannel) {
            case 'email':
                if (user.email) await sendEmailNotification(user.email, message);
                break;

            case 'sms':
                if (user.phone) await sendSMSNotification(user.phone, message);
                break;

            case 'webhook':
                if (user.webhookUrl) await sendWebhookNotification(user.webhookUrl, message);
                break;

            default:
                console.warn(`Unknown notification channel: ${rule.notificationChannel}`);
        }
    } catch (err) {
        console.error(`Failed to send ${rule.notificationChannel} notification:`, err.message);
    }
};

const sendEmailNotification = async (email, message) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
    });

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Alert Notification',
        text: message,
    });

    console.log(`📧 Email sent to ${email}`);
};

const sendSMSNotification = async (phone, message) => {
    const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);
    await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE,
        to: phone,
    });

    console.log(`📱 SMS sent to ${phone}`);
};

const sendWebhookNotification = async (webhookUrl, message) => {
    await axios.post(webhookUrl, { message });
    console.log(`🌐 Webhook triggered at ${webhookUrl}`);
};

module.exports = { triggerNotification };
