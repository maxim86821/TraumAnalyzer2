import { Link, useLocation } from "wouter";
import { BookOpen, BookMarked } from "lucide-react";

export default function MobileNav() {
  const [location] = useLocation();

  // Define navigation items
  const navItems = [
    {
      name: "Übersicht",
      path: "/",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      name: "Neu",
      path: "/new",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      )
    },
    {
      name: "Journal",
      path: "/journal",
      icon: (
        <BookOpen className="h-6 w-6" />
      )
    },
    {
      name: "Symbole",
      path: "/symbols",
      icon: (
        <BookMarked className="h-6 w-6" />
      )
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-30">
      <div className="flex justify-around">
        {navItems.map((item, index) => {
          const isActive = item.path === location;
          return (
            <Link 
              key={index} 
              href={item.path}
              className={`flex flex-col items-center py-3 px-4 ${isActive ? 'text-dream-primary' : 'text-gray-600'}`}
            >
              {item.icon}
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
