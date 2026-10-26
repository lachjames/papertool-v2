import React, { ReactNode } from 'react';
import { Container, Box } from '@mui/material';
import Header from './Header';

interface MainLayoutProps {
    children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
                overflow: 'hidden',
                bgcolor: 'background.default'
            }}
        >
            <Header />
            <Container
                maxWidth="xl"
                sx={{
                    flex: 1,
                    py: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}
            >
                {children}
            </Container>
        </Box>
    );
};

export default MainLayout;
