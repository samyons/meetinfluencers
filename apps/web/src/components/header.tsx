import { Link, useRouterState } from "@tanstack/react-router";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";
import { buttonVariants } from "./ui/button";
import { LayoutDashboard, Users, Search, History } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
  { to: "/influencers" as const, label: "Influenceurs", icon: Users },
  { to: "/scrape" as const, label: "Scraper", icon: Search },
  { to: "/history" as const, label: "Historique", icon: History },
];

export default function Header() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              MeetInfluencers
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => {
              const isActive = currentPath === to || 
                (to !== "/dashboard" && currentPath.startsWith(to));
              
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "gap-2",
                    isActive && "bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
