import { History, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";

interface NavbarProps {
  variant: "landing" | "client" | "admin";
  activeTab?: "form" | "history";
  onForm?: () => void;
  onHistory?: () => void;
  onLogout?: () => void;
  onLogin?: () => void;
  userName?: string; // Add userName prop
}

const Navbar = ({ variant, activeTab, onForm, onHistory, onLogout, onLogin, userName }: NavbarProps) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  return (
    <header className="bg-white border-b fixed top-0 left-0 w-full z-50 shadow-sm font-sans text-[14px] font-normal text-[rgb(38,38,38)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 font-sans text-[14px] font-normal text-[rgb(38,38,38)]">
        <div className="flex justify-between items-center py-1 min-h-[56px] font-sans text-[14px] font-normal text-[rgb(38,38,38)]">
          <div className="flex items-center space-x-2 font-sans text-[14px] font-normal text-[rgb(38,38,38)]">
            <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain rounded bg-white" />
            <h1 className="text-xl font-sans text-[14px] font-normal text-[rgb(38,38,38)]">EMESA DIGITAL</h1>
          </div>
          <div className="flex items-center space-x-2 font-sans text-[14px] font-normal text-[rgb(38,38,38)]">
            {variant === "landing" && (
              <Button onClick={onLogin} className="flex bg-transparent border border-gray-300 hover:bg-gray-100 font-sans text-[14px] font-normal text-[rgb(38,38,38)]">
                Login / Sign Up
              </Button>
            )}
            {variant === "client" && (
              <>
                <Button
                  variant="outline"
                  onClick={onForm}
                  className={`flex items-center space-x-2 bg-transparent border border-gray-300 hover:bg-gray-100 px-3 py-1 font-sans text-[14px] font-normal text-[rgb(38,38,38)] ${activeTab === 'form' ? 'bg-gray-100 border-gray-400' : ''}`}
                >
                  <span className="font-sans text-[14px] font-normal text-[rgb(38,38,38)]">Form submission</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={onHistory}
                  className={`flex items-center space-x-2 bg-transparent border border-gray-300 hover:bg-gray-100 px-3 py-1 font-sans text-[14px] font-normal text-[rgb(38,38,38)] ${activeTab === 'history' ? 'bg-gray-100 border-gray-400' : ''}`}
                >
                  <History className="h-4 w-4" />
                  <span className="font-sans text-[14px] font-normal text-[rgb(38,38,38)]">Order history</span>
                </Button>
                {/* User dropdown menu */}
                <div className="relative font-sans text-[14px] font-normal text-[rgb(38,38,38)]" ref={userMenuRef}>
                  <button
                    className="flex items-center space-x-1 px-3 py-1 bg-transparent border border-gray-300 rounded hover:bg-gray-100 focus:outline-none font-sans text-[14px] font-normal text-[rgb(38,38,38)]"
                    onClick={() => setUserMenuOpen((open) => !open)}
                    aria-haspopup="true"
                    aria-expanded={userMenuOpen}
                  >
                    <span className="font-sans text-[14px] font-normal text-[rgb(38,38,38)]">{userName || ''}</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded shadow-lg z-50 font-sans text-[14px] font-normal text-[rgb(38,38,38)]">
                      <button
                        className="w-full flex items-center px-4 py-2 focus:outline-none font-sans text-[14px] font-normal text-[rgb(38,38,38)] hover:text-black hover:bg-transparent !hover:bg-transparent"
                        onClick={() => { setUserMenuOpen(false); onLogout && onLogout(); }}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
            {variant === "admin" && (
              <Button
                variant="outline"
                onClick={onLogout}
                className="flex bg-transparent border border-gray-300 hover:bg-gray-100 items-center space-x-2 px-3 py-1 font-sans text-[14px] font-normal text-[rgb(38,38,38)]"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar; 