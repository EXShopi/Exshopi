import React from "react";
import { Helmet } from "react-helmet-async";

export default function GoogleServices() {
  const verification = String(import.meta.env.VITE_GOOGLE_SITE_VERIFICATION || "").trim();
  const measurementId = String(import.meta.env.VITE_GA_MEASUREMENT_ID || "").trim();

  if (!verification && !measurementId) {
    return null;
  }

  return (
    <Helmet>
      {verification ? (
        <meta name="google-site-verification" content={verification} />
      ) : null}

      {measurementId ? (
        <>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} />
          <script type="text/javascript">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${measurementId}', { send_page_view: true });
            `}
          </script>
        </>
      ) : null}
    </Helmet>
  );
}
