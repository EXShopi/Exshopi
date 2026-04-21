import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import TopBar from "./TopBar";
import Navbar from "./Navbar";
import PremiumCategoryNav from "./PremiumCategoryNav";
import Footer from "./Footer";
import FloatingChatbot from "./FloatingChatbot";
import FirstVisitCountryModal from "./FirstVisitCountryModal";
import { useLanguageStore } from "../store/language";

export default function Layout() {
  const { direction, lang } = useLanguageStore();

  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = lang.toLowerCase() === "arabic" ? "ar" : "en";
  }, [direction, lang]);

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-slate-50 text-slate-900">
      <TopBar />
      <Navbar />
      <PremiumCategoryNav />

      <main className="max-w-full overflow-x-hidden">
        <Outlet />
      </main>

      <Footer />
      <FloatingChatbot />
      <FirstVisitCountryModal />
    </div>
  );
}
