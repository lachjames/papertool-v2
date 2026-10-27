import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from './AuthContext';
import Login from './LoginComponent';
import MainLayout from '../components/layout/MainLayout';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    // Show loading spinner while checking authentication (inside the normal layout so the
    // header does not flash in and out).
    if (isLoading) {
        return (
            <MainLayout>
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flex: 1
                }}>
                    <CircularProgress size={50} sx={{ mb: 3 }} />
                    <Typography>Checking authentication...</Typography>
                </Box>
            </MainLayout>
        );
    }

    // If not authenticated, show login component
    if (!isAuthenticated) {
        return (
            <MainLayout>
                <Login />
            </MainLayout>
        );
    }

    // If authenticated, render the children
    return <>{children}</>;
};

export default ProtectedRoute;
