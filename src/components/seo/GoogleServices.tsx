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

    if (measurementId) {
      let script = document.head.querySelector(
        `script[src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"]`
      ) as HTMLScriptElement | null;

      if (!script) {
        script = document.createElement("script");
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
        script.setAttribute("data-exshopi-google", "true");
        document.head.appendChild(script);
      }

      managedNodes.push(script);

      let inlineScript = document.head.querySelector(
        'script[data-exshopi-google-inline="true"]'
      ) as HTMLScriptElement | null;

      if (!inlineScript) {
        inlineScript = document.createElement("script");
        inlineScript.type = "text/javascript";
        inlineScript.setAttribute("data-exshopi-google", "true");
        inlineScript.setAttribute("data-exshopi-google-inline", "true");
        document.head.appendChild(inlineScript);
      }

      inlineScript.textContent = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${measurementId}', { send_page_view: true });
      `;
      managedNodes.push(inlineScript);
    }

    return () => {
      for (const node of managedNodes) {
        if (node.getAttribute("data-exshopi-google") === "true") {
          node.remove();
        }
      }
    };
  }, [measurementId, verification]);

  return null;
}
