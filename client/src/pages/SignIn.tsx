import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn } from "lucide-react";

export default function SignIn() {
  const { loginWithRedirect, isAuthenticated } = useAuth0();

  if (isAuthenticated) {
    window.location.href = '/';
    return null;
  }

  const handleSignIn = () => {
    const returnPath = window.location.pathname === '/signin' ? '/' : window.location.pathname;
    loginWithRedirect({
      appState: {
        returnTo: returnPath
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>
            Sign in to access reproductive healthcare resources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            className="w-full" 
            onClick={handleSignIn}
          >
            <LogIn className="mr-2 h-4 w-4" />
            Sign In
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}