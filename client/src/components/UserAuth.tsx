import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@/components/ui/button";
import { UserCircle2, LogOut } from "lucide-react";

export function UserAuth() {
  const { loginWithRedirect, logout, isAuthenticated, user, isLoading } = useAuth0();

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        Loading...
      </Button>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm hidden md:inline-block">{user.email}</span>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <Button variant="default" size="sm" onClick={() => loginWithRedirect()}>
      <UserCircle2 className="h-4 w-4 mr-2" />
      Sign In
    </Button>
  );
}