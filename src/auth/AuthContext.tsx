import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import getBaseURL from '../getBaseURL';

// Types
interface User {
    username: string;
    email: string;
    name?: string;
    groups?: string[];
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

export function getRedirectURI() {
    let redirectUri = "";
    switch (window.location.hostname) {
        case "localhost":
            redirectUri = "http%3A%2F%2Flocalhost:5173%2F";
            break;
        case "dev.papertool.sodalabs.io":
            redirectUri = "https%3A%2F%2Fdev.papertool.sodalabs.io%2F";
            break;
        case "papertool.sodalabs.io":
            redirectUri = "https%3A%2F%2Fpapertool.sodalabs.io%2F";
            break;
        default:
            throw new Error("Unknown hostname: " + window.location.hostname);
    }
    console.log("Using redirect URI: ", redirectUri);
    return redirectUri;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [authError, setAuthError] = useState<string | null>(null);

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
            const userResponse = await axios.get(getBaseURL('user'), {
                withCredentials: true
            });
            console.log("User data received:", userResponse.data);
            setUser(userResponse.data);
            setIsAuthenticated(true);
            return true;
        } catch (error) {
            console.error('Error fetching user info:', error);
            setIsAuthenticated(false);
            setUser(null);
            return false;
        }
    };

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
                        await axios.post(
                            getBaseURL('auth/token'), 
                            { code, dev: window.location.hostname === 'localhost' },
                            { withCredentials: true }
                        );

                        // Get user info after token exchange
                        await fetchUserInfo();
                    } catch (error) {
                        console.error('Authentication error:', error);
                        setAuthError('Failed to authenticate. Please try again.');
                        setIsAuthenticated(false);
                        setUser(null);
                    }
                } else {
                    // No code in URL, check if we're already authenticated
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
