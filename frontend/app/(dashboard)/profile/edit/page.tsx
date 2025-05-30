'use client';

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import {
    Box,
    Button,
    TextField,
    Typography,
    FormControl,
    FormGroup,
    FormControlLabel,
    Checkbox,
    Alert,
    Avatar,
    Card,
    CardContent,
    useTheme,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';

export default function EditProfilePage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const accessToken = session?.accessToken;
    const theme = useTheme();
    const cardBgColor = theme.palette.mode === 'dark' ? '#1e1e1e' : '#f9f9f9';

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [notificationChannels, setNotificationChannels] = useState<string[]>(['email']);
    const [telephone, setTelephone] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Password dialog state
    const [passwordOpen, setPasswordOpen] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (!accessToken || status !== 'authenticated') return;

        (async () => {
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                const user = res.data;
                setName(user.name || '');
                setEmail(user.email || '');
                if (user.notificationChannel) {
                    if (Array.isArray(user.notificationChannel)) {
                        setNotificationChannels(user.notificationChannel);
                    } else if (typeof user.notificationChannel === 'string') {
                        setNotificationChannels([user.notificationChannel]);
                    }
                }
                setTelephone(user.telephone || '');
                if (user.avatarUrl) setAvatarPreview(user.avatarUrl);
            } catch {
                setError('Failed to load profile.');
            }
        })();
    }, [accessToken, status]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleChannelChange = (channel: string) => (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        if (e.target.checked) {
            setNotificationChannels((prev) => [...prev, channel]);
        } else {
            setNotificationChannels((prev) => prev.filter((ch) => ch !== channel));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);

        if (notificationChannels.includes('sms') && !telephone.trim()) {
            setError('Telephone is required for SMS notifications.');
            return;
        }

        if (!accessToken) {
            setError('Not authenticated.');
            return;
        }

        try {
            let dataToSend;
            let headers;

            if (avatarFile) {
                const formData = new FormData();
                formData.append('name', name);
                formData.append('notificationChannel', JSON.stringify(notificationChannels));
                if (notificationChannels.includes('sms')) formData.append('telephone', telephone);
                formData.append('avatar', avatarFile);
                dataToSend = formData;
                headers = {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'multipart/form-data',
                };
            } else {
                dataToSend = {
                    name,
                    notificationChannel: notificationChannels,
                    telephone: notificationChannels.includes('sms') ? telephone : undefined,
                };
                headers = {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                };
            }

            await axios.put(
                `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
                dataToSend,
                { headers }
            );

            setMessage('Profile updated successfully.');
        } catch (err: any) {
            setError(err.response?.data?.msg || 'Update failed.');
        }
    };

    // Password Change Handlers
    const handleOpenPassword = () => {
        setOldPassword('');
        setNewPassword('');
        setPasswordError(null);
        setPasswordSuccess(null);
        setPasswordOpen(true);
    };

    const handleClosePassword = () => {
        setPasswordOpen(false);
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(null);

        if (!oldPassword || !newPassword) {
            setPasswordError('Please enter both old and new passwords.');
            return;
        }
        if (!accessToken) {
            setPasswordError('Not authenticated.');
            return;
        }

        try {
            await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/auth/change-password`,
                { oldPassword, newPassword },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );
            setPasswordSuccess('Password changed successfully.');
            setTimeout(() => {
                setPasswordOpen(false);
            }, 1000);
        } catch (err: any) {
            setPasswordError(
                err.response?.data?.msg || 'Failed to change password.'
            );
        }
    };

    return (
        <Box px={4} py={4}>
            <Card sx={{ maxWidth: 600, width: '100%', background: cardBgColor, boxShadow: 3 }}>
                <CardContent>
                    <Typography variant="h5" mb={2}>
                        Profile
                    </Typography>
                    {/* Horizontal flex: Avatar left, form right */}
                    <Box display="flex" flexDirection="row" alignItems="flex-start" gap={3}>
                        {/* Left: Avatar and change button */}
                        <Box display="flex" flexDirection="column" alignItems="center" mt={1}>
                            <input
                                type="file"
                                accept="image/*"
                                hidden
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />
                            <Avatar
                                src={avatarPreview || undefined}
                                sx={{ width: 80, height: 80, cursor: 'pointer', mb: 1 }}
                                onClick={() => fileInputRef.current?.click()}
                            />
                            <Typography variant="caption" color="textSecondary">
                                Click avatar to change
                            </Typography>
                        </Box>
                        {/* Right: Form */}
                        <Box
                            component="form"
                            onSubmit={handleSubmit}
                            noValidate
                            sx={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'stretch'
                            }}
                        >
                            <TextField
                                label="Full Name"
                                required
                                margin="normal"
                                fullWidth
                                sx={{ width: 320 }}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />

                            <TextField
                                label="Email"
                                margin="normal"
                                fullWidth
                                sx={{ width: 320 }}
                                value={email}
                                disabled
                            />

                            <FormControl component="fieldset" sx={{ mb: 1, width: '100%' }}>
                                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Notification Channels</Typography>
                                <FormGroup row>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={notificationChannels.includes('email')}
                                                onChange={handleChannelChange('email')}
                                                name="email"
                                            />
                                        }
                                        label="Email"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={notificationChannels.includes('sms')}
                                                onChange={handleChannelChange('sms')}
                                                name="sms"
                                            />
                                        }
                                        label="SMS"
                                    />
                                </FormGroup>
                            </FormControl>

                            {notificationChannels.includes('sms') && (
                                <TextField
                                    label="Telephone"
                                    margin="normal"
                                    required
                                    sx={{ width: 320 }}
                                    value={telephone}
                                    onChange={(e) => setTelephone(e.target.value)}
                                />
                            )}

                            <Box mt={3} display="flex" flexDirection="row" gap={2}>
                                <Button type="submit" variant="contained" disabled={status !== 'authenticated'}>
                                    Update Profile
                                </Button>
                                <Button variant="outlined" onClick={() => router.back()}>
                                    Back
                                </Button>
                                <Button variant="text" color="secondary" onClick={handleOpenPassword}>
                                    Update Password
                                </Button>
                            </Box>

                            {error && (
                                <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                                    {error}
                                </Alert>
                            )}
                            {message && (
                                <Alert severity="success" sx={{ mt: 2, width: '100%' }}>
                                    {message}
                                </Alert>
                            )}
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            <Dialog open={passwordOpen} onClose={handleClosePassword}>
                <DialogTitle>Update Password</DialogTitle>
                <form onSubmit={handlePasswordChange}>
                    <DialogContent>
                        <TextField
                            margin="dense"
                            label="Old Password"
                            type="password"

                            required
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                        />
                        <TextField
                            margin="dense"
                            label="New Password"
                            type="password"

                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        {passwordError && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                {passwordError}
                            </Alert>
                        )}
                        {passwordSuccess && (
                            <Alert severity="success" sx={{ mt: 2 }}>
                                {passwordSuccess}
                            </Alert>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClosePassword}>Cancel</Button>
                        <Button type="submit" variant="contained">
                            Save
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
}
