import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import axios from 'axios';
import getBaseURL from '../getBaseURL';
import {
    installSessionRefresh,
    scheduleRefresh,
    cancelScheduledRefresh,
    SESSION_EXPIRED_EVENT
} from '../services/sessionRefresh';

// Types
interface User {
    username: string;
    email: string;
    name?: string;
    groups?: string[];
    /** Seconds until the current id token expires (reported by GET /user). */
    sessionExpiresIn?: number;
}

interface AuthContextProps {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: User | null;
    logout: () => Promise<void>;
    authError: string | null;
    clearAuthError: () => void;
    initiateLogin: () => void;
}

// Create the context
const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// Provider component
interface AuthProviderProps {
    children: ReactNode;
}

// Configure axios to include credentials by default
axios.defaults.withCredentials = true;

// Refresh the Cognito cookies on 401 (once, then retry) and ahead of their expiry.
installSessionRefresh();

const KNOWN_REDIRECT_URIS: Record<string, string> = {
    'localhost': 'http://localhost:5177/',
    'dev.papertool.sodalabs.io': 'https://dev.papertool.sodalabs.io/',
    'papertool.sodalabs.io': 'https://papertool.sodalabs.io/'
};

export function getRedirectURI() {
    // Cognito validates the redirect URI against the app client's callback list, so an
    // unknown host simply fails at Cognito with a clear message instead of throwing here.
    const { hostname, origin } = window.location;
    const redirectUri = encodeURIComponent(KNOWN_REDIRECT_URIS[hostname] || `${origin}/`);
    console.log("Using redirect URI: ", redirectUri);
    return redirectUri;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [authError, setAuthError] = useState<string | null>(null);

    // Lets the session-expired handler tell "a signed-in session ended" apart from
    // "a visitor with no cookies got the usual 401".
    const wasAuthenticated = useRef(false);
    useEffect(() => {
        wasAuthenticated.current = isAuthenticated;
    }, [isAuthenticated]);

    const clearAuthError = () => setAuthError(null);

    // Function to initiate Google login
    const initiateLogin = () => {
        const redirectUri = getRedirectURI();

        // Store current page to return to after login
        sessionStorage.setItem('loginRedirectUrl', window.location.href);

        // Build authorization URL
        const authorizationUrl = `https://us-east-1iwqo8rfmn.auth.us-east-1.amazoncognito.com/oauth2/authorize?client_id=1h13aln2harskj3rja03tgq12v&response_type=code&scope=email+openid+phone&redirect_uri=${redirectUri}`;

        // Redirect to authorization URL
        window.location.href = authorizationUrl.toString();
    };

    // Logout function
    const logout = async () => {
        cancelScheduledRefresh();
        try {
            await axios.post(getBaseURL('auth/logout'), {}, { withCredentials: true });
        } catch (error) {
            console.error('Logout error:', error);
            setAuthError('Failed to log out. Please try again.');
        }
        setUser(null);
        setIsAuthenticated(false);
    };

    // Function to fetch user info
    const fetchUserInfo = async () => {
        try {
            const userResponse = await axios.get<User>(getBaseURL('user'), {
                withCredentials: true
            });
            const data = userResponse.data;
            setUser(data);
            setIsAuthenticated(true);
            if (typeof data.sessionExpiresIn === 'number') {
                scheduleRefresh(data.sessionExpiresIn);
            }
            return true;
        } catch (error) {
            console.error('Error fetching user info:', error);
            setIsAuthenticated(false);
            setUser(null);
            return false;
        }
    };

    // Drop to the signed-out state when a refresh fails (refresh token revoked/expired).
    useEffect(() => {
        const onSessionExpired = () => {
            if (wasAuthenticated.current) {
                setAuthError('Your session has expired. Please sign in again.');
            }
            setIsAuthenticated(false);
            setUser(null);
        };
        window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
        return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    }, []);

    // Check auth status on load and handle code in URL
    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                // Check for auth code in URL
                const urlParams = new URLSearchParams(window.location.search);
                const code = urlParams.get('code');

                if (code) {
                    // Clear the code from the URL
                    window.history.replaceState({}, document.title, window.location.pathname);

                    try {
                        // Exchange code for token
                        console.log("Exchanging code for token...");
                        const tokenResponse = await axios.post(
                            getBaseURL('auth/token'),
                            { code, dev: window.location.hostname === 'localhost' },
                            { withCredentials: true }
                        );
                        scheduleRefresh(Number(tokenResponse.data?.expiresIn) || 3600);

                        // Get user info after token exchange
                        await fetchUserInfo();
                    } catch (error) {
                        console.error('Authentication error:', error);
                        setAuthError('Failed to authenticate. Please try again.');
                        setIsAuthenticated(false);
                        setUser(null);
                    }
                } else {
                    // No code in URL, check if we're already authenticated. An expired id token
                    // is handled by the 401 interceptor (refresh, then retry) before this fails.
                    await fetchUserInfo();
                }
            } catch (error) {
                console.error('Error checking auth status:', error);
                setIsAuthenticated(false);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuthStatus();
    }, []);

    // Context value
    const value: AuthContextProps = {
        isAuthenticated,
        isLoading,
        user,
        logout,
        authError,
        clearAuthError,
        initiateLogin
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook for using the auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
