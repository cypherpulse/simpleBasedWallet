import { Toaster } from '@/components/ui/toaster';
import { WalletDashboard } from '@/components/WalletDashboard';

function App() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <WalletDashboard />
      <Toaster />
    </main>
  );
}

export default App;
