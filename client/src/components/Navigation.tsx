import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { UserAuth } from "./UserAuth";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";

export default function Navigation() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth0();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/map", label: "Find Care" },
    { path: "/laws", label: "Laws & Updates" },
    { path: "/take-action", label: "Take Action" },
  ];

  return (
    <>
      <header className="border-b bg-white shadow-sm fixed w-full top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="HerAccess Logo" className="h-8 w-8 object-contain" />
            <span className="text-2xl font-bold text-[#be185d]">HerAccess</span>
          </Link>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden md:block">
            <NavigationMenuList>
              {navItems.map((item) => (
                <NavigationMenuItem key={item.path}>
                  <Button
                    variant="ghost"
                    className={`
                      hover:text-pink-700 transition-colors
                      ${location === item.path ? "text-pink-700" : ""}
                    `}
                    asChild
                  >
                    <Link href={item.path}>{item.label}</Link>
                  </Button>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Desktop Auth */}
          <div className="hidden md:block">
            <UserAuth />
          </div>
        </div>
      </header>

      {/* Mobile Menu Button - Floating Circular */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 rounded-full w-12 h-12 shadow-lg md:hidden hover:scale-105 transition-all duration-200 hover:bg-secondary/20"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-white/95 z-30 md:hidden pt-16">
          <nav className="container mx-auto px-4 py-4">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                className={`
                  w-full justify-start mb-3 hover:text-pink-700 transition-colors
                  ${location === item.path ? "text-pink-700" : ""}
                `}
                onClick={() => setIsMenuOpen(false)}
                asChild
              >
                <Link href={item.path}>{item.label}</Link>
              </Button>
            ))}
            <div className="mt-4 mb-2 border-t pt-4">
              <UserAuth />
            </div>
          </nav>
        </div>
      )}
    </>
  );
}