const axios = require('axios');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

const triggerNotification = async (rule, value) => {
    const user = rule.user;

    if (!user) {
        console.warn(`No user info available for rule: ${rule.ruleName}`);
        return;
    }

    // If single string (old data), convert to array
    const channels = Array.isArray(user.notificationChannel)
        ? user.notificationChannel
        : [user.notificationChannel];

    const message = rule.alertMessage || `Alert! ${rule.metric.metricName} breached threshold with value ${value}.`;

    for (const channel of channels) {
        try {
            if (channel === 'email' && user.email) {
                await sendEmailNotification(user.email, message);
            }
            if (channel === 'sms' && user.telephone) {
                await sendSMSNotification(user.telephone, message);
            }
        } catch (err) {
            console.error(`Failed to send ${channel} notification:`, err.message);
        }
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

module.exports = { triggerNotification };
