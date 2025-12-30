import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Wallet, ExternalLink, Send, Shield, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ConnectKitButton } from 'connectkit';
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther, parseEther, isAddress } from 'viem';
import { WALLET_CONTRACT_ADDRESS, WALLET_CONTRACT_ABI } from '@/config/wagmi';

const BASESCAN_URL = 'https://sepolia.basescan.org';

export function WalletDashboard() {
  const { toast } = useToast();
  const { isConnected, address } = useAccount();
  const [copied, setCopied] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');

  // Fetch contract balance
  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address: WALLET_CONTRACT_ADDRESS,
  });

  // Contract write hook
  const { writeContract, data: hash, isPending } = useWriteContract();
  
  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const balance = balanceData ? formatEther(balanceData.value) : '0.0000';

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(WALLET_CONTRACT_ADDRESS);
    setCopied(true);
    toast({ title: 'Copied!', description: 'Contract address copied to clipboard.' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefreshBalance = () => {
    refetchBalance();
    toast({ title: 'Refreshed', description: 'Balance updated.' });
  };

  const handleSendEth = async () => {
    if (!recipientAddress || !sendAmount) {
      toast({
        title: 'Error',
        description: 'Please enter recipient address and amount.',
        variant: 'destructive',
      });
      return;
    }

    if (!isAddress(recipientAddress)) {
      toast({
        title: 'Invalid Address',
        description: 'Please enter a valid Ethereum address.',
        variant: 'destructive',
      });
      return;
    }

    const amount = parseFloat(sendAmount);
    if (amount <= 0 || isNaN(amount)) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount greater than 0.',
        variant: 'destructive',
      });
      return;
    }

    try {
      writeContract({
        address: WALLET_CONTRACT_ADDRESS,
        abi: WALLET_CONTRACT_ABI,
        functionName: 'sendEth',
        args: [recipientAddress as `0x${string}`, parseEther(sendAmount)],
      });

      toast({
        title: 'Transaction Submitted',
        description: 'Waiting for confirmation...',
      });
    } catch (error: any) {
      toast({
        title: 'Transaction Failed',
        description: error?.message || 'Failed to send transaction',
        variant: 'destructive',
      });
    }
  };

  // Handle successful transaction
  if (isConfirmed && hash) {
    toast({
      title: 'Transaction Confirmed!',
      description: (
        <a
          href={`${BASESCAN_URL}/tx/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          View on BaseScan
        </a>
      ),
    });
    setRecipientAddress('');
    setSendAmount('');
    refetchBalance();
  }

  const feeAmount = sendAmount ? (parseFloat(sendAmount) * 0.005).toFixed(6) : '0';
  const netAmount = sendAmount ? (parseFloat(sendAmount) - parseFloat(feeAmount)).toFixed(6) : '0';

  return (
    <div className="min-h-screen p-4 md:p-6 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold eth-gradient">MyBaseWallet</h1>
          </div>
          <ConnectKitButton />
        </header>

        <div className="glass-card p-6 space-y-4 animate-fade-in">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Send className="w-4 h-4" /><span>Receive ETH</span></div>
          <div className="flex justify-center"><div className="p-4 bg-foreground rounded-2xl"><QRCodeSVG value={WALLET_CONTRACT_ADDRESS} size={200} bgColor="#fafafa" fgColor="#0f0f14" level="H" /></div></div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs md:text-sm bg-secondary p-3 rounded-lg truncate font-mono">{WALLET_CONTRACT_ADDRESS}</code>
            <Button variant="secondary" size="icon" onClick={copyToClipboard}>{copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}</Button>
            <Button variant="secondary" size="icon" asChild><a href={`${BASESCAN_URL}/address/${WALLET_CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" /></a></Button>
          </div>
        </div>

        <div className="glass-card p-6 glow-effect animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground text-sm">Balance</span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRefreshBalance}>
                <RefreshCw className="w-3 h-3" />
              </Button>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="w-3 h-3" />
                <span>Base Sepolia</span>
              </div>
            </div>
          </div>
          <div className="text-4xl md:text-5xl font-bold eth-gradient">
            {parseFloat(balance).toFixed(4)} <span className="text-2xl">ETH</span>
          </div>
        </div>

        <div className="glass-card p-6 space-y-4 animate-fade-in">
          <div className="flex items-center gap-2 text-sm"><Send className="w-4 h-4 text-primary" /><span className="font-medium">Send ETH</span><span className="text-muted-foreground ml-auto text-xs">0.5% fee supports the builder</span></div>
          <Input placeholder="Recipient address (0x...)" value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} className="font-mono text-sm" />
          <Input type="number" step="0.0001" placeholder="Amount (ETH)" value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} />
          {sendAmount && parseFloat(sendAmount) > 0 && (
            <div className="text-sm text-muted-foreground space-y-1 p-3 bg-secondary rounded-lg">
              <div className="flex justify-between"><span>Amount:</span><span>{sendAmount} ETH</span></div>
              <div className="flex justify-between text-warning"><span>Fee (0.5%):</span><span>-{feeAmount} ETH</span></div>
              <div className="flex justify-between font-medium text-foreground border-t border-border pt-1 mt-1"><span>Recipient receives:</span><span>{netAmount} ETH</span></div>
            </div>
          )}
          <Button 
            className="w-full btn-glow" 
            size="lg" 
            disabled={!isConnected || isPending || isConfirming || !recipientAddress || !sendAmount}
            onClick={handleSendEth}
          >
            <Send className="w-4 h-4 mr-2" />
            {!isConnected 
              ? 'Connect Wallet to Send' 
              : isPending || isConfirming 
                ? 'Sending...' 
                : 'Send ETH'}
          </Button>
        </div>

        <div className="text-center text-xs text-muted-foreground space-y-1 animate-fade-in">
          <p>Base Sepolia Testnet • Contract: {WALLET_CONTRACT_ADDRESS.slice(0, 8)}...{WALLET_CONTRACT_ADDRESS.slice(-6)}</p>
          <p className="text-primary/80">Every send → 0.5% fee supports the builder 💜</p>
        </div>
      </div>
    </div>
  );
}
