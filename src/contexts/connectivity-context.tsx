import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { syncAll } from '../services/sync-engine';

interface ConnectivityContextType {
  isConnected: boolean;
  isInternetReachable: boolean | null;
}

const ConnectivityContext = createContext<ConnectivityContextType>({
  isConnected: true,
  isInternetReachable: true,
});

export function ConnectivityProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);
  const wasOffline = useRef(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const connected = state.isConnected ?? true;
      setIsConnected(connected);
      setIsInternetReachable(state.isInternetReachable);

      if (wasOffline.current && connected) {
        syncAll();
      }

      wasOffline.current = !connected;
    });

    return () => unsubscribe();
  }, []);

  return (
    <ConnectivityContext.Provider value={{ isConnected, isInternetReachable }}>
      {children}
    </ConnectivityContext.Provider>
  );
}

export function useConnectivity() {
  return useContext(ConnectivityContext);
}
