import * as React from 'react';
import { NextAppProvider } from '@toolpad/core/nextjs';
import PersonIcon from '@mui/icons-material/Person';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import type { Navigation } from '@toolpad/core/AppProvider';
import { SessionProvider, signIn, signOut } from 'next-auth/react';
import theme from '../theme';
import { auth } from '../auth';
import SegmentOutlinedIcon from "@mui/icons-material/SegmentOutlined";
import ShowChartOutlinedIcon from "@mui/icons-material/ShowChartOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import ImportExportRoundedIcon from "@mui/icons-material/ImportExportRounded";
import LeaderboardRoundedIcon from '@mui/icons-material/LeaderboardRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import PublishRoundedIcon from '@mui/icons-material/PublishRounded';
import { PulseLogo } from './components/PulseToolBar';
import AnimatedPage from './components/AnimatedPage'; // adjust path as needed




const NAVIGATION: Navigation = [
    { kind: 'header', title: 'Main items' },
    { title: 'Dashboard', icon: <DashboardIcon /> },
    { segment: 'rules', title: 'Rules', icon: <SegmentOutlinedIcon /> },
    { segment: 'metrics', title: 'Metrics', icon: <ShowChartOutlinedIcon /> },
    {
        segment: 'notifications',
        title: 'Notifications',
        icon: <NotificationsActiveOutlinedIcon />,
    },
    {
        segment: 'reports',
        title: 'Reports',
        icon: <LeaderboardRoundedIcon />,
        children: [
            {
                segment: 'metrics',
                title: 'Metrics',
                icon: <ShowChartOutlinedIcon />,
            },
            {
                segment: 'rules',
                title: 'Rules',
                icon: <SegmentOutlinedIcon />,
            },
            {
                segment: 'notifications',
                title: 'Notifications',
                icon: <NotificationsActiveOutlinedIcon />,
            },
        ],
    },
    {
        segment: 'data',
        title: 'Export/Import',
        icon: <ImportExportRoundedIcon />,
        children: [
            { segment: 'export', title: 'Export', icon: <FileDownloadRoundedIcon /> },
            { segment: 'import', title: 'Import', icon: <PublishRoundedIcon /> },
        ],
    }


];

const AUTHENTICATION = {
    signIn,
    signOut,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const session = await auth();
    return (
        <html lang="en" data-toolpad-color-scheme="light">
        <body>
        <SessionProvider session={session}>
            <AppRouterCacheProvider options={{ enableCssLayer: true }}>
                <NextAppProvider
                    theme={theme}
                      navigation={NAVIGATION}
                    session={session}
                    branding={{
                        title: "Pulse",
                        logo: <PulseLogo />,
                        homeUrl: "/",   // optional: where to go if logo/title is clicked
                    }}
                    authentication={AUTHENTICATION}
                >
                    <AnimatedPage>
                        {children}
                    </AnimatedPage>
                </NextAppProvider>
            </AppRouterCacheProvider>
        </SessionProvider>
        </body>
        </html>
    );
}