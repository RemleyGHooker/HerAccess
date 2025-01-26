import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import Navigation from "@/components/Navigation";
import Home from "@/pages/Home";
import Map from "@/pages/Map";
import Laws from "@/pages/Laws";
import Petitions from "@/pages/Petitions";
import TakeAction from "@/pages/TakeAction";
import NotFound from "@/pages/not-found";
import { Toaster } from "@/components/ui/toaster";
import ChatBot from "@/components/ChatBot";
import EscapeButton from "@/components/EscapeButton";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/map" component={Map} />
      <Route path="/laws" component={Laws} />
      <Route path="/take-action" component={TakeAction} />
      <Route path="/petitions" component={Petitions} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-pink-50">
        <Navigation />
        <div className="relative pt-[4.5rem]">
          <EscapeButton />
          <main>
            <Router />
          </main>
          <ChatBot />
        </div>
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;