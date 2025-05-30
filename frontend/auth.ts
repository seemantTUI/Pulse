import NextAuth from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { Provider } from 'next-auth/providers';

const providers: Provider[] = [
    GitHubProvider({
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
        credentials: {
            email: { label: 'Email', type: 'email' },
            password: { label: 'Password', type: 'password' },
        },
        async authorize(credentials, req) {
            try {
                const res = await fetch('http://backend:4000/api/v1/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(credentials),
                });

                const data = await res.json();

                if (!res.ok) {
                    // ✅ Instead of throw, use return null
                    console.error('Auth error:', data?.msg || 'Login failed');
                    return null; // This triggers a redirect with ?error=CredentialsSignin
                }

                return {
                    id: data.user.id,
                    name: data.user.name,
                    email: data.user.email,
                    accessToken: data.token,
                };
            } catch (err) {
                console.error('Exception in authorize:', err);
                return null;
            }
        },
    }),

];

export const providerMap = providers.map((provider) => {
    if (typeof provider === 'function') {
        const providerData = provider();
        return { id: providerData.id, name: providerData.name };
    }
    return { id: provider.id, name: provider.name };
});

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers,
    secret: process.env.AUTH_SECRET,
    pages: {
        signIn: '/auth/signin', // custom sign-in page
    },
    session: {
        strategy: 'jwt',
    },
    debug: true,
    callbacks: {
        async jwt({ token, user, account }) {
            // Access token from GitHub/Google OAuth
            if (account?.access_token && typeof account.access_token === 'string') {
                token.accessToken = account.access_token;
            }

            // Access token from credentials login
            if (user) {
                token.id = String(user.id ?? '');
                token.email = String(user.email ?? '');
                token.name = String(user.name ?? '');
                token.accessToken = (user as any).accessToken || token.accessToken || `${token.id}-token`;
            }

            return token;
        },

        async session({ session, token }) {
            session.user.id = String(token.id ?? '');
            session.user.email = String(token.email ?? '');
            session.user.name = String(token.name ?? '');
            session.accessToken = String(token.accessToken ?? '');
            return session;
        },

        authorized({ auth: session, request: { nextUrl } }) {
            const isLoggedIn = !!session?.user;
            const isPublicPage = nextUrl.pathname.startsWith('/public');
            return isPublicPage || isLoggedIn;
        },
    },
});

// Extend session & JWT types
declare module 'next-auth' {
    interface Session {
        accessToken?: string;
        user: {
            id: string;
            email: string;
            name?: string;
        };
    }

    interface JWT {
        accessToken?: string;
        id?: string;
        email?: string;
        name?: string;
    }
}
