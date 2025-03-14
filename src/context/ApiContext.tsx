import React, { createContext, useState, useContext, ReactNode } from 'react';
import { ApiConfig } from '../types';

interface ApiContextProps {
  apiConfig: ApiConfig;
  setApiKey: (key: string) => void;
}

const ApiContext = createContext<ApiContextProps | undefined>(undefined);

export const ApiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [apiConfig, setApiConfig] = useState<ApiConfig>(() => ({
    key: localStorage.getItem('apiKey') || ''
  }));

  const setApiKey = (key: string) => {
    setApiConfig({ key });
    localStorage.setItem('apiKey', key);
  };

  return (
    <ApiContext.Provider value={{ apiConfig, setApiKey }}>
      {children}
    </ApiContext.Provider>
  );
};

export const useApiContext = (): ApiContextProps => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApiContext must be used within an ApiProvider');
  }
  return context;
};
