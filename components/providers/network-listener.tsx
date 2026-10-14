"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Toaster } from "@/components/ui/toaster";
import { dismissPersistent, toast } from "@/lib/toast";

const NetworkContext = createContext({ online: true, mounted: false });

export function useNetworkStatus() {
  return useContext(NetworkContext);
}

export function NetworkListener({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setMounted(true);

    function goOffline() {
      setOnline(false);
      document.documentElement.dataset.offline = "true";
      toast.error(
        "Connection lost. If your generation has started, it remains active. Reconnect to resume viewing it; refreshing will not abandon it.",
        { persist: true }
      );
    }

    function goOnline() {
      setOnline(true);
      delete document.documentElement.dataset.offline;
      dismissPersistent("error");
      toast.success("Network connection restored.");
    }

    if (!navigator.onLine) goOffline();

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  return (
    <NetworkContext.Provider value={{ online: !mounted || online, mounted }}>
      <Toaster />
      {children}
    </NetworkContext.Provider>
  );
}
