import React, { useEffect } from "react";

export default function GoogleServices() {
  const verification = String(import.meta.env.VITE_GOOGLE_SITE_VERIFICATION || "").trim();
  const measurementId = String(import.meta.env.VITE_GA_MEASUREMENT_ID || "").trim();

  useEffect(() => {
    if (typeof document === "undefined") return;

    const managedNodes: HTMLElement[] = [];

    if (verification) {
      let meta = document.head.querySelector(
        'meta[name="google-site-verification"]'
      ) as HTMLMetaElement | null;

      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "google-site-verification");
        meta.setAttribute("data-exshopi-google", "true");
        document.head.appendChild(meta);
      }

      meta.setAttribute("content", verification);
      managedNodes.push(meta);
    }

    let timeoutId: number | null = null;
    let idleId: number | null = null;

    const loadAnalytics = () => {
      const existingGtagScript = document.head.querySelector(
        'script[src*="https://www.googletagmanager.com/gtag/js"]'
      ) as HTMLScriptElement | null;
      const hasGlobalGtag = typeof window !== "undefined" && typeof (window as any).gtag === "function";

      if (!measurementId || existingGtagScript || hasGlobalGtag) return;

      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      script.setAttribute("data-exshopi-google", "true");
      document.head.appendChild(script);
      managedNodes.push(script);

      const inlineScript = document.createElement("script");
      inlineScript.type = "text/javascript";
      inlineScript.setAttribute("data-exshopi-google", "true");
      inlineScript.setAttribute("data-exshopi-google-inline", "true");
      inlineScript.textContent = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${measurementId}', { send_page_view: true });
      `;
      document.head.appendChild(inlineScript);
      managedNodes.push(inlineScript);
    };

    const scheduleAnalytics = () => {
      if (!measurementId) return;

      timeoutId = window.setTimeout(() => {
        if ("requestIdleCallback" in window) {
          idleId = window.requestIdleCallback(loadAnalytics, { timeout: 3000 });
        } else {
          loadAnalytics();
        }
      }, 2500);
    };

    if (measurementId) {
      if (document.readyState === "complete") {
        scheduleAnalytics();
      } else {
        window.addEventListener("load", scheduleAnalytics, { once: true });
      }
    }

    return () => {
      window.removeEventListener("load", scheduleAnalytics);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      if (idleId !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
      for (const node of managedNodes) {
        if (node.getAttribute("data-exshopi-google") === "true") {
          node.remove();
        }
      }
    };
  }, [measurementId, verification]);

  return null;
}
