import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export function RouteProgressBar() {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    setProgress(15);

    const boost = window.setTimeout(() => setProgress(72), 90);
    const finish = window.setTimeout(() => {
      setProgress(100);
      window.setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 240);
    }, 320);

    return () => {
      window.clearTimeout(boost);
      window.clearTimeout(finish);
    };
  }, [location.pathname]);

  return (
    <div className={`pointer-events-none fixed inset-x-0 top-0 z-[120] transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}>
      <div
        className="h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 shadow-[0_0_20px_rgba(59,130,246,0.45)] transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

