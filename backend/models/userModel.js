const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    notificationChannel: {
        type: [String], // now an array
        enum: ['email', 'sms'],
        default: ['email'],
        validate: {
            validator: function (channels) {
                // Must not be empty; only email and sms allowed
                return Array.isArray(channels) && channels.length > 0;
            },
            message: 'At least one notification channel is required.'
        }
    },
    telephone: {
        type: String,
        validate: {
            validator: function (value) {
                // If 'sms' is included in notificationChannel, telephone must be present
                if (Array.isArray(this.notificationChannel) && this.notificationChannel.includes('sms')) {
                    return !!value;
                }
                return true;
            },
            message: 'Telephone number is required when notification channel includes SMS.'
        }
    },
    avatar: {
        type: String // URL or file name
        // You can add validation for URL/file if desired
    }
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

UserSchema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
