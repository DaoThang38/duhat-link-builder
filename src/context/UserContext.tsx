'use client';

import React, { createContext, useContext } from 'react';
import { User } from '@/types';

interface UserContextType {
  user: User | null;
}

const UserContext = createContext<UserContextType>({ user: null });

export function UserProvider({ user, children }: { user: User | null; children: React.ReactNode }) {
  return <UserContext.Provider value={{ user }}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
