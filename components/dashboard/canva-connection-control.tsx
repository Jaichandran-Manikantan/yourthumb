"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Link2, Loader2, Unplug } from "lucide-react";

type CanvaConnectionState = {
  connected: boolean;
  displayName?: string | null;
  requiresReauth?: boolean;
};

export function CanvaConnectionControl() {
  const [connection, setConnection] = useState<CanvaConnectionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadConnection = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/canva/connection", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as CanvaConnectionState & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not check Canva connection.");
      setConnection(data);
    } catch (error) {
      setConnection(null);
      setMessage(error instanceof Error ? error.message : "Could not check Canva connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    const oauthError = url.searchParams.get("canva_error");
    if (oauthError) {
      const message = oauthError === "missing_oauth_state"
        ? "Canva connection expired. Please try again."
        : oauthError === "token_exchange_failed"
          ? "Canva could not authorize YourThumb. Please try again."
          : "Canva connection was not completed.";
      setMessage(message);
      url.searchParams.delete("canva_error");
    }
    url.searchParams.delete("canva_connected");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);

    const handleOAuthPopupMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (
        event.data &&
        typeof event.data === "object" &&
        "type" in event.data &&
        event.data.type === "yourthumb:canva-connected"
      ) {
        void loadConnection();
      }
    };
    window.addEventListener("message", handleOAuthPopupMessage);
    void loadConnection();
    return () => window.removeEventListener("message", handleOAuthPopupMessage);
  }, [loadConnection]);

  async function disconnectCanva() {
    if (disconnecting) return;
    setDisconnecting(true);
    setMessage(null);
    try {
      const response = await fetch("/api/canva/connection", { method: "DELETE" });
      const data = (await response.json().catch(() => ({}))) as {
        connected?: boolean;
        revocationSucceeded?: boolean;
        warning?: string;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error ?? "Could not disconnect Canva.");

      setConnection({ connected: false });
      setMessage(data.revocationSucceeded === false
        ? data.warning ?? "YourThumb disconnected, but Canva could not confirm revocation."
        : "Canva disconnected.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not disconnect Canva.");
      await loadConnection();
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="studio-canva-connection" aria-live="polite">
      <style jsx>{`
        .studio-canva-connection { display: flex; max-width: 100%; flex-direction: column; align-items: flex-end; gap: 5px; }
        .studio-canva-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 9px; }
        .studio-canva-status { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; color: #c8beb1; font-size: 10px; line-height: 1.35; }
        .studio-canva-status strong { color: #f6f1e8; font-size: 11px; font-weight: 650; }
        .studio-canva-status span { max-width: 220px; overflow-wrap: anywhere; color: #a9cbb1; }
        .studio-canva-button { display: inline-flex; min-height: 36px; align-items: center; justify-content: center; gap: 8px; border: 1px solid rgba(255,244,228,.18); border-radius: 999px; background: rgba(255,255,255,.035); padding: 0 13px; color: #f6f1e8; font-size: 11px; font-weight: 650; letter-spacing: .015em; text-decoration: none; white-space: nowrap; transition: background .16s ease, border-color .16s ease; }
        .studio-canva-button:hover:not(:disabled) { border-color: rgba(255,116,136,.48); background: rgba(255,82,107,.08); }
        .studio-canva-button:focus-visible { outline: 2px solid #ff7488; outline-offset: 3px; }
        .studio-canva-button:disabled { cursor: wait; opacity: .65; }
        .studio-canva-button img { width: 20px; height: 20px; border-radius: 50%; object-fit: cover; }
        .studio-canva-message { max-width: 330px; color: #d3bda2; font-size: 10px; line-height: 1.45; text-align: right; }
        .studio-canva-reconnect { color: #ffc4cd; font-size: 10px; text-decoration: underline; text-underline-offset: 3px; }
        @media (max-width: 860px) { .studio-canva-connection { align-items: flex-start; margin-top: 10px; } .studio-canva-row { justify-content: flex-start; } .studio-canva-status { align-items: flex-start; } .studio-canva-message { text-align: left; } }
      `}</style>

      {loading ? (
        <div className="studio-canva-row">
          <button type="button" className="studio-canva-button" disabled>
            <Loader2 size={13} className="animate-spin" aria-hidden="true" />
            Checking Canva…
          </button>
        </div>
      ) : connection?.connected ? (
        <>
          <div className="studio-canva-row">
            <div className="studio-canva-status">
              <strong><CheckCircle2 size={12} className="mr-1 inline-block text-emerald-300" aria-hidden="true" />Canva connected</strong>
              {connection.displayName ? (
                <span>{connection.displayName}</span>
              ) : (
                <span>{connection.requiresReauth ? "Reconnect to verify account details" : "Account details temporarily unavailable"}</span>
              )}
            </div>
            {connection.requiresReauth && (
              <a href="/api/auth/canva" className="studio-canva-reconnect">Reconnect</a>
            )}
            <button
              type="button"
              className="studio-canva-button"
              onClick={disconnectCanva}
              disabled={disconnecting}
            >
              {disconnecting ? <Loader2 size={13} className="animate-spin" aria-hidden="true" /> : <Unplug size={13} aria-hidden="true" />}
              {disconnecting ? "Disconnecting…" : "Disconnect Canva"}
            </button>
          </div>
        </>
      ) : (
        <div className="studio-canva-row">
          <a href="/api/auth/canva" className="studio-canva-button">
            <img src="/canva-logo-exact.png" alt="" aria-hidden="true" />
            <Link2 size={13} aria-hidden="true" />
            Connect Canva
          </a>
        </div>
      )}
      {message && <p className="studio-canva-message" role="status">{message}</p>}
    </div>
  );
}
