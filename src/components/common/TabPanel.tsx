import React from 'react';
import { Box, Paper } from '@mui/material';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
    elevation?: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ 
  children, 
  value, 
  index, 
  elevation = 0 
}) => {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`tabpanel-${index}`}
            aria-labelledby={`tab-${index}`}
        >
            {value === index && (
                <Box 
                  sx={{
                    height: 'calc(100vh - 180px)',
                    overflow: 'auto',
                    pt: 2,
                    px: 2,
                    pb: 2
                  }}
                >
                    {children}
                </Box>
            )}
        </div>
    );
};

export default TabPanel;
