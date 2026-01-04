import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Wallet, ExternalLink, Send, Shield, RefreshCw, History, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ConnectKitButton } from 'connectkit';
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt, useContractEvent } from 'wagmi';
import { formatEther, parseEther, isAddress } from 'viem';
import { WALLET_CONTRACT_ADDRESS, WALLET_CONTRACT_ABI } from '@/config/wagmi';

const BASESCAN_URL = 'https://sepolia.basescan.org';
const ETH_PRICE = 2500; // Mock ETH price for USD conversion

interface Transaction {
  type: 'sent' | 'received';
  amount: string;
  usdValue: string;
  timestamp: number;
  to?: string;
  from?: string;
  hash?: string;
}

export function WalletDashboard() {
  const { toast } = useToast();
  const { isConnected, address } = useAccount();
  const [copied, setCopied] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Fetch contract balance with error handling
  const { data: balanceData, refetch: refetchBalance, isLoading: isBalanceLoading, error: balanceError } = useBalance({
    address: WALLET_CONTRACT_ADDRESS,
    query: {
      retry: 3,
      retryDelay: 1000,
    },
  });

  // Contract write hook
  const { writeContract, data: hash, isPending } = useWriteContract();
  
  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const balance = balanceData ? formatEther(balanceData.value) : '0.0000';

  // Fetch recent transactions (placeholder for future API integration)
  const fetchRecentTransactions = async () => {
    // This would be replaced with actual API calls to fetch historical transactions
    // For now, we'll keep the existing transactions and add any new ones from events
    if (transactions.length === 0) {
      // Add some sample transactions if none exist
      const sampleTransactions: Transaction[] = [
        {
          type: 'sent',
          amount: '0.1',
          usdValue: '$250.00',
          timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
          to: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        },
        {
          type: 'received',
          amount: '0.5',
          usdValue: '$1,250.00',
          timestamp: Date.now() - 5 * 60 * 60 * 1000, // 5 hours ago
          from: '0x123d35Cc6634C0532925a3b844Bc454e4438f44e',
        },
      ];
      setTransactions(sampleTransactions);
    }
  };

  // Load transactions on component mount
  React.useEffect(() => {
    fetchRecentTransactions();
  }, []);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(WALLET_CONTRACT_ADDRESS);
    setCopied(true);
    toast({ title: 'Copied!', description: 'Contract address copied to clipboard.' });
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle balance refresh with error handling
  const handleRefreshBalance = async () => {
    try {
      await refetchBalance();
      if (!balanceError) {
        toast({ title: 'Refreshed', description: 'Balance updated.' });
      }
    } catch (error) {
      console.warn('Balance refresh error:', error);
      toast({ 
        title: 'Refresh Failed', 
        description: 'Could not update balance. Please try again.',
        variant: 'destructive'
      });
    }
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
      await writeContract({
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
      console.warn('Transaction error:', error);
      toast({
        title: 'Transaction Failed',
        description: error?.message?.includes('User rejected') 
          ? 'Transaction cancelled by user'
          : error?.message?.includes('insufficient funds')
            ? 'Insufficient funds for transaction'
            : 'Failed to send transaction. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle successful transaction
  React.useEffect(() => {
    if (isConfirmed && hash) {
      toast({
        title: 'Transaction Confirmed!',
        description: (
          <a
            href={`${BASESCAN_URL}/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary transition-colors"
          >
            View on BaseScan
          </a>
        ),
      });
      setRecipientAddress('');
      setSendAmount('');
      refetchBalance();
    }
  }, [isConfirmed, hash, toast, refetchBalance]);

  const feeAmount = sendAmount ? (parseFloat(sendAmount) * 0.005).toFixed(6) : '0';
  const netAmount = sendAmount ? (parseFloat(sendAmount) - parseFloat(feeAmount)).toFixed(6) : '0';

  return (
    <div className="min-h-screen p-4 md:p-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold eth-gradient">MyBaseWallet</h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span>Base Sepolia Testnet</span>
              </div>
            </div>
          </div>
          <ConnectKitButton />
        </header>

        <div className="glass-card p-6 space-y-4 animate-fade-in hover:shadow-2xl hover:bg-white/15 transition-all duration-300">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Send className="w-4 h-4" /><span>Receive ETH</span></div>
          <div className="flex justify-center"><div className="p-4 bg-foreground rounded-2xl hover:scale-105 transition-transform duration-300"><QRCodeSVG value={WALLET_CONTRACT_ADDRESS} size={200} bgColor="#fafafa" fgColor="#0f0f14" level="H" /></div></div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs md:text-sm bg-secondary p-3 rounded-lg truncate font-mono hover:bg-secondary/80 transition-colors">{WALLET_CONTRACT_ADDRESS}</code>
            <Button variant="secondary" size="icon" onClick={copyToClipboard} className="hover:bg-secondary/80 transition-colors">{copied ? <Check className="w-4 h-4 text-success animate-bounce" /> : <Copy className="w-4 h-4" />}</Button>
            <Button variant="secondary" size="icon" asChild className="hover:bg-secondary/80 transition-colors"><a href={`${BASESCAN_URL}/address/${WALLET_CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" /></a></Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6 glow-effect animate-fade-in hover:shadow-2xl hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground text-sm">Balance</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 hover:bg-white/10 transition-colors" 
                onClick={handleRefreshBalance}
                disabled={isBalanceLoading}
              >
                <RefreshCw className={`w-3 h-3 ${isBalanceLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <div className="text-4xl md:text-5xl font-bold eth-gradient">
              {isBalanceLoading ? (
                <div className="animate-pulse bg-muted rounded h-12 w-32"></div>
              ) : balanceError ? (
                <span className="text-muted-foreground">Unable to load</span>
              ) : (
                <>
                  {parseFloat(balance).toFixed(4)} <span className="text-2xl">ETH</span>
                </>
              )}
            </div>
            {!isBalanceLoading && !balanceError && parseFloat(balance) > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">
                ≈ ${(parseFloat(balance) * ETH_PRICE).toFixed(2)} USD
              </div>
            )}
            {balanceError && (
              <div className="mt-2 text-xs text-destructive">
                Failed to load balance
              </div>
            )}
          </div>

          <div className="glass-card p-6 space-y-4 animate-fade-in hover:shadow-2xl hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center gap-2 text-sm">
              <Send className="w-4 h-4 text-primary" />
              <span className="font-medium">Send ETH</span>
              <span className="text-muted-foreground ml-auto text-xs">0.5% fee supports the builder</span>
            </div>
            
            <div className="space-y-3">
              <div>
                <Input 
                  placeholder="Recipient address (0x...)" 
                  value={recipientAddress} 
                  onChange={(e) => setRecipientAddress(e.target.value)} 
                  className={`font-mono text-sm ${recipientAddress && !isAddress(recipientAddress) ? 'border-destructive' : ''}`}
                />
                {recipientAddress && !isAddress(recipientAddress) && (
                  <p className="text-xs text-destructive mt-1">Invalid Ethereum address</p>
                )}
              </div>
              
              <div>
                <Input 
                  type="number" 
                  step="0.0001" 
                  placeholder="Amount (ETH)" 
                  value={sendAmount} 
                  onChange={(e) => setSendAmount(e.target.value)} 
                  className={sendAmount && (parseFloat(sendAmount) <= 0 || parseFloat(sendAmount) > parseFloat(balance)) ? 'border-destructive' : ''}
                />
                {sendAmount && parseFloat(sendAmount) > parseFloat(balance) && (
                  <p className="text-xs text-destructive mt-1">Insufficient balance</p>
                )}
              </div>
            </div>

            {sendAmount && parseFloat(sendAmount) > 0 && parseFloat(sendAmount) <= parseFloat(balance) && (
              <div className="text-sm text-muted-foreground space-y-1 p-3 bg-secondary rounded-lg animate-fade-in">
                <div className="flex justify-between"><span>Amount:</span><span>{sendAmount} ETH</span></div>
                <div className="flex justify-between text-warning"><span>Fee (0.5%):</span><span>-{feeAmount} ETH</span></div>
                <div className="flex justify-between font-medium text-foreground border-t border-border pt-1 mt-1"><span>Recipient receives:</span><span>{netAmount} ETH</span></div>
              </div>
            )}

            <Button 
              className={`w-full btn-glow ${isConfirmed ? 'bg-success hover:bg-success/90 animate-pulse' : ''}`} 
              size="lg" 
              disabled={!isConnected || isPending || isConfirming || !recipientAddress || !sendAmount || !isAddress(recipientAddress) || parseFloat(sendAmount || '0') <= 0 || parseFloat(sendAmount || '0') > parseFloat(balance)}
              onClick={handleSendEth}
            >
              <Send className="w-4 h-4 mr-2" />
              {!isConnected 
                ? 'Connect Wallet to Send' 
                : isPending || isConfirming 
                  ? 'Sending...' 
                  : isConfirmed
                    ? 'Sent Successfully! 🎉'
                    : 'Send ETH'}
            </Button>
          </div>
        </div>

        <div className="glass-card p-6 space-y-4 animate-fade-in hover:shadow-2xl hover:bg-white/15 transition-all duration-300">
          <div className="flex items-center gap-2 text-sm">
            <History className="w-4 h-4 text-primary" />
            <span className="font-medium">Recent Activity</span>
            <span className="text-muted-foreground ml-auto text-xs">Last {transactions.length > 0 ? '24h' : 'transactions'}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 ml-2 hover:bg-white/10 transition-colors" 
              onClick={fetchRecentTransactions}
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>
          
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No transactions yet</p>
                <p className="text-xs">Your transaction history will appear here</p>
              </div>
            ) : (
              transactions.map((tx, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      tx.type === 'sent' ? 'bg-destructive/20' : 'bg-success/20'
                    }`}>
                      {tx.type === 'sent' ? (
                        <Send className={`w-4 h-4 ${tx.type === 'sent' ? 'text-destructive' : 'text-success'}`} />
                      ) : (
                        <Zap className="w-4 h-4 text-success" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {tx.type === 'sent' ? 'ETH Sent' : 'ETH Received'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      tx.type === 'sent' ? 'text-destructive' : 'text-success'
                    }`}>
                      {tx.type === 'sent' ? '-' : '+'}{tx.amount} ETH
                    </p>
                    <p className="text-xs text-muted-foreground">{tx.usdValue}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <Button variant="outline" className="w-full" size="sm">
            <History className="w-4 h-4 mr-2" />
            View Full History {transactions.length > 0 && `(${transactions.length})`}
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
