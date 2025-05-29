'use client';
import * as React from 'react';
import {
    Box, Button, Checkbox, CssBaseline, Divider, FormControl,
    FormControlLabel, FormLabel, Link, TextField, Typography, Stack,
    Card as MuiCard, IconButton, InputAdornment, Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ForgotPassword from '../../components/ForgotPassword';
import AppTheme from '../../shared-theme/AppTheme';
import { GoogleIcon, FacebookIcon, SitemarkIcon } from '../../components/CustomIcons';
import { signIn } from 'next-auth/react';
import ColorModeSelect from '../../shared-theme/ColorModeSelect';
import NextLink from 'next/link';


const Card = styled(MuiCard)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignSelf: 'center',
    width: '100%',
    padding: theme.spacing(4),
    gap: theme.spacing(2),
    margin: 'auto',
    [theme.breakpoints.up('sm')]: {
        maxWidth: '450px',
    },
    boxShadow:
        'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
    ...theme.applyStyles('dark', {
        boxShadow:
            'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
    }),
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
    height: 'calc((1 - var(--template-frame-height, 0)) * 100dvh)',
    minHeight: '100%',
    padding: theme.spacing(2),
    [theme.breakpoints.up('sm')]: {
        padding: theme.spacing(4),
    },
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

export default function LoginForm(props: { disableCustomTheme?: boolean }) {
    const [emailError, setEmailError] = React.useState(false);
    const [passwordError, setPasswordError] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);
    const [open, setOpen] = React.useState(false);
    const [error, setError] = React.useState('');

    const toggleShowPassword = () => setShowPassword((prev) => !prev);
    const handleClickOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const validateInputs = () => {
        const emailInput = document.getElementById('email') as HTMLInputElement;
        const passwordInput = document.getElementById('password') as HTMLInputElement;
        let valid = true;

        if (!emailInput.value || !/\S+@\S+\.\S+/.test(emailInput.value)) {
            setEmailError(true);
            valid = false;
        } else {
            setEmailError(false);
        }

        if (!passwordInput.value || passwordInput.value.length < 6) {
            setPasswordError(true);
            valid = false;
        } else {
            setPasswordError(false);
        }

        return valid;
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');

        if (!validateInputs()) return;

        const form = new FormData(event.currentTarget);
        const email = form.get('email') as string;
        const password = form.get('password') as string;

        try {
            const result = await signIn('credentials', {
                redirect: false,
                email,
                password,
            });

            if (!result) {
                setError('No response from server.');
                return;
            }

            if (result.ok && !result.error) {
                window.location.href = '/';
            } else if (result.error === 'CredentialsSignin') {
                setError('Invalid email or password.');
            } else {
                setError(result.error || 'Login failed. Please try again.');
            }
        } catch (err: any) {
            setError(err.message || 'Unexpected error occurred.');
        }
    };

    return (
        <AppTheme {...props}>
            <CssBaseline enableColorScheme />
            <SignInContainer direction="column" justifyContent="space-between">
                <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} />
                <Card variant="outlined">
                    <SitemarkIcon />
                    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControl>
                            <FormLabel htmlFor="email">Email</FormLabel>
                            <TextField
                                id="email"
                                name="email"
                                type="email"
                                fullWidth
                                placeholder="your@email.com"
                                error={emailError}
                                helperText={emailError ? 'Please enter a valid email address.' : ''}
                            />
                        </FormControl>
                        <FormControl>
                            <FormLabel htmlFor="password">Password</FormLabel>
                            <TextField
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                fullWidth
                                placeholder="••••••"
                                error={passwordError}
                                helperText={passwordError ? 'Password must be at least 6 characters.' : ''}
                            />
                        </FormControl>

                        <FormControlLabel control={<Checkbox value="remember" color="primary" />} label="Remember me" />
                        <ForgotPassword open={open} handleClose={handleClose} />
                        <Button type="submit" fullWidth variant="contained">
                            Sign in
                        </Button>
                        <Link component="button" type="button" onClick={handleClickOpen} variant="body2" sx={{ alignSelf: 'center' }}>
                            Forgot your password?
                        </Link>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mt: 2, textAlign: 'center' }}>
                            {error}
                        </Alert>
                    )}

                    <Divider>or</Divider>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Button fullWidth variant="outlined" onClick={() => alert('Sign in with Google')} startIcon={<GoogleIcon />}>
                            Sign in with Google
                        </Button>
                        <Typography sx={{ textAlign: 'center' }}>
                            Don&apos;t have an account?{' '}
                            <Link href="/signup" component={NextLink} variant="body2">
                                Sign up
                            </Link>
                        </Typography>
                    </Box>
                </Card>
            </SignInContainer>
        </AppTheme>
    );
}
