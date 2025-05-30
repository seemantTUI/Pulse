'use client';
import * as React from 'react';
import {
    Box, Button, Checkbox, CssBaseline, Divider,
    FormControl, FormControlLabel, FormLabel, Link,
    MenuItem, Stack, TextField, Typography, Alert,
    IconButton, InputAdornment
} from '@mui/material';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import AppTheme from '../shared-theme/AppTheme';
import ColorModeSelect from '../shared-theme/ColorModeSelect';
import { GoogleIcon, FacebookIcon, SitemarkIcon } from '../components/CustomIcons';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const Card = styled(MuiCard)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignSelf: 'center',
    width: '100%',
    padding: theme.spacing(4),
    gap: theme.spacing(2),
    margin: 'auto',
    [theme.breakpoints.up('sm')]: { maxWidth: '450px' },
    boxShadow:
        'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
    ...theme.applyStyles('dark', {
        boxShadow:
            'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
    }),
}));

const SignUpContainer = styled(Stack)(({ theme }) => ({
    height: 'calc((1 - var(--template-frame-height, 0)) * 100dvh)',
    minHeight: '100%',
    padding: theme.spacing(2),
    [theme.breakpoints.up('sm')]: { padding: theme.spacing(4) },
    '&::before': {
        content: '""',
        display: 'block',
        position: 'absolute',
        zIndex: -1,
        inset: 0,
        backgroundImage:
            'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
        backgroundRepeat: 'no-repeat',
        ...theme.applyStyles('dark', {
            backgroundImage:
                'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
        }),
    },
}));

export default function SignUp(props: { disableCustomTheme?: boolean }) {
    const router = useRouter();

    const [name, setName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [notificationChannel, setNotificationChannel] = React.useState<'email' | 'sms' | 'webhook'>('email');
    const [telephone, setTelephone] = React.useState('');
    const [webhookUrl, setWebhookUrl] = React.useState('');
    const [error, setError] = React.useState<string | null>(null);
    const [emailError, setEmailError] = React.useState(false);
    const [passwordError, setPasswordError] = React.useState(false);
    const [nameError, setNameError] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);
    const toggleShowPassword = () => setShowPassword((prev) => !prev);

    const validateInputs = () => {
        let valid = true;
        setEmailError(!/\S+@\S+\.\S+/.test(email));
        setPasswordError(password.length < 6);
        setNameError(name.trim().length === 0);

        if (!/\S+@\S+\.\S+/.test(email)) valid = false;
        if (password.length < 6) valid = false;
        if (name.trim().length === 0) valid = false;

        return valid;
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        if (!validateInputs()) return;

        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
                name,
                email,
                password,
                notificationChannel,
                ...(notificationChannel === 'sms' && { telephone }),
                ...(notificationChannel === 'webhook' && { webhookUrl }),
            });

            if (res.data?.token) {
                setName('');
                setEmail('');
                setPassword('');
                setNotificationChannel('email');
                setTelephone('');
                setWebhookUrl('');
                router.push('/auth/signin');
            }
        } catch (err: any) {
            setError(err.response?.data?.msg || 'Registration failed');
        }
    };

    return (
        <AppTheme {...props}>
            <CssBaseline enableColorScheme />
            <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} />
            <SignUpContainer direction="column" justifyContent="center">
                <Card variant="outlined">
                    <SitemarkIcon />
                    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControl>
                            <FormLabel htmlFor="name">Full name</FormLabel>
                            <TextField
                                id="name"
                                name="name"
                                placeholder="Full Name"
                                required
                                fullWidth
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                error={nameError}
                                helperText={nameError && 'Name is required.'}
                            />
                        </FormControl>
                        <FormControl>
                            <FormLabel htmlFor="email">Email</FormLabel>
                            <TextField
                                id="email"
                                name="email"
                                placeholder="your@email.com"
                                required
                                fullWidth
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                error={emailError}
                                helperText={emailError && 'Enter a valid email.'}
                            />
                        </FormControl>
                        <FormControl>
                            <FormLabel htmlFor="password">Password</FormLabel>
                            <TextField
                                id="password"
                                name="password"
                                placeholder="••••••"
                                required
                                fullWidth
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                error={passwordError}
                                helperText={passwordError && 'Password must be at least 6 characters.'}
                            />
                        </FormControl>
                        <FormControl>
                            <FormLabel htmlFor="notificationChannel">Notification Channel</FormLabel>
                            <TextField
                                select
                                fullWidth
                                id="notificationChannel"
                                value={notificationChannel}
                                onChange={(e) => setNotificationChannel(e.target.value as any)}
                            >
                                <MenuItem value="email">Email</MenuItem>
                                <MenuItem value="sms">SMS</MenuItem>
                                <MenuItem value="webhook">Webhook</MenuItem>
                            </TextField>
                        </FormControl>
                        {notificationChannel === 'sms' && (
                            <TextField
                                label="Telephone"
                                fullWidth
                                value={telephone}
                                onChange={(e) => setTelephone(e.target.value)}
                                required
                            />
                        )}
                        {notificationChannel === 'webhook' && (
                            <TextField
                                label="Webhook URL"
                                fullWidth
                                type="url"
                                value={webhookUrl}
                                onChange={(e) => setWebhookUrl(e.target.value)}
                                required
                            />
                        )}
                        <FormControlLabel control={<Checkbox />} label="I want to receive updates via email." />
                        <Button type="submit" variant="contained" fullWidth>
                            Sign up
                        </Button>
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Button fullWidth variant="outlined" onClick={() => alert('Sign up with Google')} startIcon={<GoogleIcon />}>
                            Sign up with Google
                        </Button>
                        <Typography sx={{ textAlign: 'center' }}>
                            Already have an account?{' '}
                            <Link href="/auth/signin" underline="hover">
                                Sign in
                            </Link>
                        </Typography>
                    </Box>
                    {error && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {error}
                        </Alert>
                    )}
                </Card>
            </SignUpContainer>
        </AppTheme>
    );
}
