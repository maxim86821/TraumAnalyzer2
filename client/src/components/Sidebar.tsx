import { Link, useLocation } from "wouter";
import { useAuth } from "../hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

export default function Sidebar({ className = "", onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  // Define navigation items
  const navItems = [
    {
      name: "Übersicht",
      path: "/",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      name: "Neuer Traum",
      path: "/new",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      )
    },
    {
      name: "Musteranalyse",
      path: "/patterns",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  ];

  return (
    <aside className={`flex flex-col w-64 bg-white shadow-md p-4 border-r border-gray-200 ${className}`}>
      <div className="flex items-center justify-between mb-8 mt-2">
        <Link href="/">
          <h1 className="text-2xl font-serif font-bold text-dream-primary cursor-pointer">
            <span>tRAUM</span><span className="text-gray-700">tagebuch</span>
          </h1>
        </Link>
        
        {onClose && (
          <button 
            onClick={onClose}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      <nav className="flex-grow">
        <ul>
          {navItems.map((item, index) => {
            const isActive = item.path === location;
            return (
              <li key={index} className="mb-1">
                <Link 
                  href={item.path}
                  className={`flex items-center p-3 rounded-lg ${
                    isActive 
                      ? "bg-dream-light text-dream-primary" 
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  onClick={onClose}
                >
                  {item.icon}
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {user && (
        <div className="mt-4 mb-4">
          <div className="flex items-center gap-2 mb-2 px-3">
            <User size={18} className="text-muted-foreground" />
            <span className="text-sm font-medium truncate">{user.username}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full flex items-center gap-2 text-destructive" 
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut size={16} />
            {logoutMutation.isPending ? 'Abmelden...' : 'Abmelden'}
          </Button>
        </div>
      )}
      
      <div className="mt-auto p-4 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-500 text-center">Träume mit KI-Analyse</p>
        <p className="text-xs text-gray-400 text-center mt-1">Version 1.0</p>
      </div>
    </aside>
  );
}
