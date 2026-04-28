import { Outlet } from "react-router-dom";
import { Suspense, lazy, useEffect, useState } from "react";
import TopBar from "./TopBar";
import Navbar from "./Navbar";
import PremiumCategoryNav from "./PremiumCategoryNav";
import Footer from "./Footer";
import { useLanguageStore } from "../store/language";
import LazyComponent from "./LazyComponent";

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
    let loadTimeoutId: number | null = null;
    let interactionTimer: number | null = null;
    let mounted = false;

    const revealDeferredUi = () => {
      if (cancelled || mounted) return;
      mounted = true;
      setDeferredUiReady(true);
    };

    const clearInteractionListeners = () => {
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
      window.removeEventListener("touchstart", onFirstInteraction);
      window.removeEventListener("scroll", onFirstInteraction);
    };

    const mountDeferredUi = () => {
      timeoutId = window.setTimeout(revealDeferredUi, 450);
    };

    const onFirstInteraction = () => {
      clearInteractionListeners();
      if (interactionTimer !== null) window.clearTimeout(interactionTimer);
      interactionTimer = window.setTimeout(mountDeferredUi, 250);
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
      loadTimeoutId = window.setTimeout(() => {
        rafId = scheduleMount();
      }, 6000);
    };

    window.addEventListener("pointerdown", onFirstInteraction, { passive: true });
    window.addEventListener("keydown", onFirstInteraction, { passive: true });
    window.addEventListener("touchstart", onFirstInteraction, { passive: true });
    window.addEventListener("scroll", onFirstInteraction, { passive: true, once: true });

    if (document.readyState === "complete") {
      rafId = scheduleMount();
    } else {
      window.addEventListener("load", onLoad, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", onLoad);
      clearInteractionListeners();
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      if (loadTimeoutId !== null) window.clearTimeout(loadTimeoutId);
      if (interactionTimer !== null) window.clearTimeout(interactionTimer);
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

      <LazyComponent
        deferUntilVisible={false}
        delayMs={1400}
        placeholder={<div className="mt-8 min-h-[360px] bg-[#06101f] md:mt-16 md:min-h-[420px]" aria-hidden="true" />}
      >
        <Footer />
      </LazyComponent>
      {deferredUiReady ? (
        <Suspense fallback={null}>
          <FloatingChatbot />
          <FirstVisitCountryModal />
        </Suspense>
      ) : null}
    </div>
  );
}
