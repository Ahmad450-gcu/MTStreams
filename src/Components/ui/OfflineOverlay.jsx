import { useEffect, useState } from "react";

const OfflineOverlay = () => {
      const [visible, setVisible] = useState(
            () => typeof navigator !== "undefined" && !navigator.onLine
      );
      const [isOnline, setIsOnline] = useState(
            () => typeof navigator === "undefined" || navigator.onLine
      );
      // True when the device has internet but MTStreams' servers could not be
      // reached (for example on a network that blocks them).
      const [unreachable, setUnreachable] = useState(false);

      useEffect(() => {
            const handleOffline = () => {
                  setIsOnline(false);
                  setUnreachable(false);
                  setVisible(true);
            };

            const handleOnline = () => {
                  setIsOnline(true);
            };

            const handleNetworkError = () => {
                  setIsOnline(navigator.onLine);
                  setUnreachable(navigator.onLine);
                  setVisible(true);
            };

            window.addEventListener("offline", handleOffline);
            window.addEventListener("online", handleOnline);
            window.addEventListener("mtstreams:network-error", handleNetworkError);

            return () => {
                  window.removeEventListener("offline", handleOffline);
                  window.removeEventListener("online", handleOnline);
                  window.removeEventListener("mtstreams:network-error", handleNetworkError);
            };
      }, []);

      if (!visible) return null;

      return (
            <div
                  className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#151618]/95 px-5 py-8 backdrop-blur-md"
                  role="alertdialog"
                  aria-modal="true"
                  aria-labelledby="offline-title"
                  aria-describedby="offline-description"
            >
                  <div className="w-full max-w-md rounded-3xl border border-[#37383a] bg-[#1f2022] px-7 py-10 text-center shadow-2xl sm:px-10">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#27282a]">
                              <img
                                    src="/logo-192.png"
                                    alt="MTStreams"
                                    className="h-full w-full object-cover"
                              />
                        </div>

                        <p className="mt-7 text-xs font-semibold uppercase tracking-[0.3em] text-[#e6e8ea]">
                              MTStreams
                        </p>

                        <h1 id="offline-title" className="mt-3 text-3xl font-bold tracking-tight text-white">
                              {unreachable ? "Can't load titles right now" : isOnline ? "You're back online" : "You're offline"}
                        </h1>

                        <p id="offline-description" className="mt-4 text-sm leading-7 text-[#b5b7ba]">
                              {unreachable
                                    ? "You're connected to the internet, but MTStreams couldn't reach its movie and series service. Try again in a moment. If it keeps happening, your network may be blocking the service."
                                    : isOnline
                                    ? "Your connection is back. Retry to reload this page and continue exploring movies and series."
                                    : "It looks like your internet connection has been interrupted. Movie details, search and streaming need an active connection."}
                        </p>

                        <div className="mt-8">
                              <button
                                    type="button"
                                    onClick={() => window.location.reload()}
                                    disabled={!isOnline}
                                    className="w-full rounded-xl bg-[#e6e8ea] px-6 py-3.5 text-sm font-bold text-[#212224] transition hover:bg-[#e6e8ea] disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                    {unreachable ? "Try again" : isOnline ? "Retry connection" : "Waiting for connection"}
                              </button>
                        </div>

                        <p className="mt-5 text-xs text-[#808184]">
                              Your current page will be restored when you retry.
                        </p>
                  </div>
            </div>
      );
};

export default OfflineOverlay;
