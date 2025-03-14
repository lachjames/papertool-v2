import React from 'react';
import { Box } from '@mui/material';

interface ScrollableContentProps {
    children: React.ReactNode;
    maxHeight?: string | number;
}

const ScrollableContent: React.FC<ScrollableContentProps> = ({
    children,
    maxHeight = '100%'
}) => {
    return (
        <Box
            sx={{
                overflow: 'auto',
                maxHeight,
                '&::-webkit-scrollbar': {
                    width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                    background: '#f1f1f1',
                },
                '&::-webkit-scrollbar-thumb': {
                    background: '#c1c1c1',
                    borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                    background: '#a1a1a1',
                },
            }}
        >
            {children}
        </Box>
    );
};

export default ScrollableContent;
