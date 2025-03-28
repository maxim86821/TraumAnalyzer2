import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import { useMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const isMobile = useMobile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when screen size changes to desktop
  useEffect(() => {
    if (!isMobile && isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [isMobile, isMobileMenuOpen]);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-dream-gradient">
      {/* Sidebar - Only visible on desktop */}
      <Sidebar className="hidden lg:flex" />

      {/* Mobile sidebar - Only visible when toggled on mobile */}
      {isMobile && isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black opacity-50"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <Sidebar
            className="fixed top-0 left-0 h-full z-50"
            onClose={() => setIsMobileMenuOpen(false)}
          />
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-grow overflow-hidden flex flex-col">
        {/* Mobile header */}
        {isMobile && (
          <header className="bg-white shadow-sm p-4 flex items-center justify-between">
            <h1 className="text-xl font-serif font-bold text-dream-primary">
              <span>tRAUM</span>
              <span className="text-gray-700">tagebuch</span>
            </h1>
            <button
              className="text-gray-500 focus:outline-none"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </header>
        )}

        <div className="flex-grow overflow-auto p-4 lg:p-8">{children}</div>
      </main>

      {/* Mobile Navigation */}
      {isMobile && <MobileNav />}
    </div>
  );
}
