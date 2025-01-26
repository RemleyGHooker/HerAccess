import { Auth0Provider } from "@auth0/auth0-react";
import { type PropsWithChildren } from "react";
import { useLocation } from "wouter";

// Define the AppState type
interface AppState {
  returnTo?: string;
}

export function Auth0ProviderWithNavigate({ children }: PropsWithChildren) {
  const domain = import.meta.env.VITE_AUTH0_DOMAIN;
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
  const [, setLocation] = useLocation();

  const origin = window.location.origin;
  const callbackUrl = `${origin}/callback`;

  if (!domain || !clientId) {
    return null;
  }

  const onRedirectCallback = (appState?: AppState) => {
    setLocation(appState?.returnTo || '/');
  };

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: callbackUrl
      }}
      onRedirectCallback={onRedirectCallback}
      useRefreshTokens={true}
      cacheLocation="localstorage"
      skipRedirectCallback={window.location.pathname === '/callback'}
    >
      {children}
    </Auth0Provider>
  );
}