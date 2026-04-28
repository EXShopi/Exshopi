import { Outlet } from "react-router-dom";
import { Suspense, lazy, useEffect, useState } from "react";
import TopBar from "./TopBar";
import Navbar from "./Navbar";
import PremiumCategoryNav from "./PremiumCategoryNav";
import Footer from "./Footer";
import { useLanguageStore } from "../store/language";

const FloatingChatbot = lazy(() => import("./FloatingChatbot"));
const FirstVisitCountryModal = lazy(() => import("./FirstVisitCountryModal"));

export default function Layout() {
  const { direction, lang } = useLanguageStore();
  const [deferredUiReady, setDeferredUiReady] = useState(false);

  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = lang.toLowerCase() === "arabic" ? "ar" : "en";
  }, [direction, lang]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;
    let timeoutId: number | null = null;
    let idleId: number | null = null;

    const mountDeferredUi = () => {
      timeoutId = window.setTimeout(() => {
        if (!cancelled) {
          setDeferredUiReady(true);
        }
      }, 700);
    };

    const scheduleMount = () => {
      const rafId = window.requestAnimationFrame(() => {
        if ("requestIdleCallback" in window) {
          idleId = window.requestIdleCallback(mountDeferredUi, { timeout: 1600 });
        } else {
          mountDeferredUi();
        }
      });

      return rafId;
    };

    let rafId: number | null = null;
    const onLoad = () => {
      rafId = scheduleMount();
    };

    if (document.readyState === "complete") {
      rafId = scheduleMount();
    } else {
      window.addEventListener("load", onLoad, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", onLoad);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      if (idleId !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
    };
  }, []);

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-slate-50 text-slate-900">
      <TopBar />
      <Navbar />
      <PremiumCategoryNav />

      <main className="max-w-full overflow-x-hidden">
        <Outlet />
      </main>

      <Footer />
      {deferredUiReady ? (
        <Suspense fallback={null}>
          <FloatingChatbot />
          <FirstVisitCountryModal />
        </Suspense>
      ) : null}
    </div>
  );
}
