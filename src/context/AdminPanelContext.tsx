import React, { createContext, useContext, useState, ReactNode } from 'react';

export type AdminPanelView = 'createArchive' | 'editArchive';

interface AdminPanelContextValue {
  isOpen: boolean;
  view: AdminPanelView;
  openCreateArchive: () => void;
  openEditArchive: () => void;
  close: () => void;
  toggle: (view?: AdminPanelView) => void;
}

const AdminPanelContext = createContext<AdminPanelContextValue | undefined>(undefined);

export const AdminPanelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<AdminPanelView>('editArchive');

  const openCreateArchive = () => {
    setView('createArchive');
    setIsOpen(true);
  };

  const openEditArchive = () => {
    setView('editArchive');
    setIsOpen(true);
  };

  const value: AdminPanelContextValue = {
    isOpen,
    view,
    openCreateArchive,
    openEditArchive,
    close: () => setIsOpen(false),
    toggle: (nextView: AdminPanelView = 'editArchive') => {
      setIsOpen(prev => {
        if (prev) return false;
        setView(nextView);
        return true;
      });
    }
  };

  return (
    <AdminPanelContext.Provider value={value}>
      {children}
    </AdminPanelContext.Provider>
  );
};

export function useAdminPanel(): AdminPanelContextValue {
  const ctx = useContext(AdminPanelContext);
  if (!ctx) {
    throw new Error('useAdminPanel must be used within an AdminPanelProvider');
  }
  return ctx;
}
