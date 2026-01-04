import { createRoot } from "react-dom/client";
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectKitProvider } from 'connectkit';
import App from "./App.tsx";
import "./index.css";
import { config } from './config/wagmi';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
      // Disable refetch on window focus to prevent conflicts
      refetchOnWindowFocus: false,
    },
  },
});

// Suppress wallet provider console errors globally
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args.join(' ');
  // Filter out wallet provider conflict errors
  if (
    message.includes('Cannot redefine property') ||
    message.includes('Cannot set property ethereum') ||
    message.includes('StacksProvider') ||
    message.includes('MetaMask encountered an error') ||
    message.includes('Another wallet may have already set it') ||
    message.includes('Family Accounts is not connected') ||
    message.includes('EIP1193 provider connection timeout')
  ) {
    return; // Silently ignore
  }
  originalConsoleError.apply(console, args);
};

createRoot(document.getElementById("root")!).render(
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <ConnectKitProvider>
        <App />
      </ConnectKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);
