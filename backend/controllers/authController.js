const User = require('../models/userModel');
const mongoose = require('mongoose');
const generateToken = require('../utils/generateToken');

// --- Register new user (NO AVATAR, NO WEBHOOK) ---
exports.register = async (req, res) => {
    let { name, email, password, notificationChannel, telephone } = req.body;
    try {
        if (!name) return res.status(400).json({ msg: "Please enter a name" });
        if (!email) return res.status(400).json({ msg: "Please enter an email" });
        if (!password) return res.status(400).json({ msg: "Please enter a password" });

        const normalizedEmail = email.toLowerCase();
        let user = await User.findOne({ email: normalizedEmail });
        if (user) return res.status(400).json({ msg: "A user with this email already exists" });

        // Normalize notificationChannel to array
        if (!notificationChannel) notificationChannel = ['email'];
        if (typeof notificationChannel === 'string') {
            notificationChannel = [notificationChannel];
        }
        if (!Array.isArray(notificationChannel)) notificationChannel = ['email'];

        // Only allow 'email' or 'sms'
        notificationChannel = notificationChannel.filter((x) => ['email', 'sms'].includes(x));

        user = new User({
            name,
            email: normalizedEmail,
            password,
            notificationChannel,
            ...(telephone && notificationChannel.includes('sms') && { telephone }),
        });

        await user.save();

        const token = generateToken(user);
        res.status(201).json({
            token,
            user: {
                id: user._id,
                name,
                email: normalizedEmail,
                notificationChannel: user.notificationChannel
            }
        });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// --- Login ---
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email) return res.status(400).json({ msg: "Please enter an email" });
        if (!password) return res.status(400).json({ msg: "Please enter a password" });

        const normalizedEmail = email.toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) return res.status(400).json({ msg: "Invalid Email" });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ msg: "Invalid password" });

        const token = generateToken(user);
        res.status(200).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: normalizedEmail,
                notificationChannel: user.notificationChannel,
                telephone: user.telephone,
                avatar: user.avatar,
            }
        });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// --- Get Current User ---
exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ msg: 'Failed to load user' });
    }
};

// --- Update Profile (handles avatar and notificationChannel as array) ---
exports.updateProfile = async (req, res) => {
    let { name, notificationChannel, telephone } = req.body;
    let avatar;

    // Handle avatar if sent (file upload middleware must set req.file or req.body.avatar)
    if (req.file) {
        avatar = req.file.filename || req.file.path;
    } else if (req.body.avatar) {
        avatar = req.body.avatar;
    }

    // Normalize notificationChannel to array (JSON or string)
    if (notificationChannel) {
        try {
            // If sent as stringified array (from FormData), parse it
            if (typeof notificationChannel === 'string' && notificationChannel.startsWith('[')) {
                notificationChannel = JSON.parse(notificationChannel);
            }
            if (typeof notificationChannel === 'string') notificationChannel = [notificationChannel];
        } catch {
            notificationChannel = ['email'];
        }
        // Only allow 'email' or 'sms'
        notificationChannel = notificationChannel.filter((x) => ['email', 'sms'].includes(x));
    }

    // Build update object
    const updateData = {};
    if (name) updateData.name = name;
    if (notificationChannel) updateData.notificationChannel = notificationChannel;
    if (notificationChannel && notificationChannel.includes('sms')) {
        if (telephone) updateData.telephone = telephone;
    } else {
        updateData.telephone = undefined;
    }
    if (avatar) updateData.avatar = avatar;

    try {
        const updated = await User.findByIdAndUpdate(
            req.user.id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');
        res.status(200).json(updated);
    } catch (err) {
        res.status(400).json({ msg: 'Update failed', error: err.message });
    }
};

// --- Change Password ---
exports.changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ msg: "Old and new password are required" });
    }

    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: "User not found" });

        const isMatch = await user.comparePassword(oldPassword);
        if (!isMatch) return res.status(400).json({ msg: "Old password is incorrect" });

        user.password = newPassword;
        await user.save();

        res.status(200).json({ msg: "Password changed successfully" });
    } catch (err) {
        res.status(500).json({ msg: 'Password change failed', error: err.message });
    }
};
