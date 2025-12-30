import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useWatchContractEvent, useAccount } from 'wagmi';
import { WALLET_CONTRACT_ADDRESS, WALLET_CONTRACT_ABI } from '@/config/wagmi';
import { parseEther, formatEther } from 'viem';
import { baseSepolia } from 'wagmi/chains';
import { useToast } from '@/hooks/use-toast';

export function useWalletContract() {
  const { toast } = useToast();
  const { address: userAddress } = useAccount();

  // Read functions
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: WALLET_CONTRACT_ADDRESS,
    abi: WALLET_CONTRACT_ABI,
    functionName: 'getBalance',
    chainId: baseSepolia.id,
  });

  const { data: owner, refetch: refetchOwner } = useReadContract({
    address: WALLET_CONTRACT_ADDRESS,
    abi: WALLET_CONTRACT_ABI,
    functionName: 'owner',
    chainId: baseSepolia.id,
  });

  const { data: isPaused, refetch: refetchPaused } = useReadContract({
    address: WALLET_CONTRACT_ADDRESS,
    abi: WALLET_CONTRACT_ABI,
    functionName: 'paused',
    chainId: baseSepolia.id,
  });

  const { data: protocolFeeBps } = useReadContract({
    address: WALLET_CONTRACT_ADDRESS,
    abi: WALLET_CONTRACT_ABI,
    functionName: 'PROTOCOL_FEE_BPS',
    chainId: baseSepolia.id,
  });

  const { data: treasury } = useReadContract({
    address: WALLET_CONTRACT_ADDRESS,
    abi: WALLET_CONTRACT_ABI,
    functionName: 'TREASURY',
    chainId: baseSepolia.id,
  });

  // Write functions
  const { writeContract: writeSendEth, data: sendEthHash, isPending: isSendingEth, reset: resetSendEth } = useWriteContract();
  const { writeContract: writePause, data: pauseHash, isPending: isPausing } = useWriteContract();
  const { writeContract: writeUnpause, data: unpauseHash, isPending: isUnpausing } = useWriteContract();
  const { writeContract: writeEmergencyRecover, data: emergencyRecoverHash, isPending: isRecovering } = useWriteContract();
  const { writeContract: writeTransferOwnership, data: transferOwnershipHash, isPending: isTransferring } = useWriteContract();
  const { writeContract: writeRenounceOwnership, data: renounceOwnershipHash, isPending: isRenouncing } = useWriteContract();

  // Transaction receipts
  const { isLoading: isConfirmingSendEth, isSuccess: isSendEthSuccess } = useWaitForTransactionReceipt({ hash: sendEthHash });
  const { isLoading: isConfirmingPause, isSuccess: isPauseSuccess } = useWaitForTransactionReceipt({ hash: pauseHash });
  const { isLoading: isConfirmingUnpause, isSuccess: isUnpauseSuccess } = useWaitForTransactionReceipt({ hash: unpauseHash });
  const { isLoading: isConfirmingRecover, isSuccess: isRecoverSuccess } = useWaitForTransactionReceipt({ hash: emergencyRecoverHash });
  const { isLoading: isConfirmingTransfer, isSuccess: isTransferSuccess } = useWaitForTransactionReceipt({ hash: transferOwnershipHash });
  const { isLoading: isConfirmingRenounce, isSuccess: isRenounceSuccess } = useWaitForTransactionReceipt({ hash: renounceOwnershipHash });

  // Watch events
  useWatchContractEvent({
    address: WALLET_CONTRACT_ADDRESS,
    abi: WALLET_CONTRACT_ABI,
    eventName: 'Deposited',
    chainId: baseSepolia.id,
    onLogs: (logs) => {
      logs.forEach((log) => {
        const amount = log.args.amount ? formatEther(log.args.amount) : '0';
        toast({
          title: '💰 Deposit Received!',
          description: `${amount} ETH deposited from ${log.args.from?.slice(0, 6)}...${log.args.from?.slice(-4)}`,
        });
        refetchBalance();
      });
    },
  });

  useWatchContractEvent({
    address: WALLET_CONTRACT_ADDRESS,
    abi: WALLET_CONTRACT_ABI,
    eventName: 'Withdrawn',
    chainId: baseSepolia.id,
    onLogs: (logs) => {
      logs.forEach((log) => {
        const amount = log.args.amountSent ? formatEther(log.args.amountSent) : '0';
        const fee = log.args.fee ? formatEther(log.args.fee) : '0';
        toast({
          title: '✅ ETH Sent Successfully!',
          description: `${amount} ETH sent (${fee} ETH fee)`,
        });
        refetchBalance();
      });
    },
  });

  useWatchContractEvent({
    address: WALLET_CONTRACT_ADDRESS,
    abi: WALLET_CONTRACT_ABI,
    eventName: 'EmergencyRecovered',
    chainId: baseSepolia.id,
    onLogs: (logs) => {
      logs.forEach((log) => {
        const amount = log.args.amount ? formatEther(log.args.amount) : '0';
        toast({
          title: '🚨 Emergency Recovery',
          description: `${amount} ETH recovered to ${log.args.to?.slice(0, 6)}...${log.args.to?.slice(-4)}`,
          variant: 'destructive',
        });
        refetchBalance();
      });
    },
  });

  // Action functions
  const sendEth = (to: `0x${string}`, amount: string) => {
    if (!userAddress) return;
    writeSendEth({
      address: WALLET_CONTRACT_ADDRESS,
      abi: WALLET_CONTRACT_ABI,
      functionName: 'sendEth',
      args: [to, parseEther(amount)],
      chain: baseSepolia,
      account: userAddress,
    });
  };

  const pause = () => {
    if (!userAddress) return;
    writePause({
      address: WALLET_CONTRACT_ADDRESS,
      abi: WALLET_CONTRACT_ABI,
      functionName: 'pause',
      chain: baseSepolia,
      account: userAddress,
    });
  };

  const unpause = () => {
    if (!userAddress) return;
    writeUnpause({
      address: WALLET_CONTRACT_ADDRESS,
      abi: WALLET_CONTRACT_ABI,
      functionName: 'unpause',
      chain: baseSepolia,
      account: userAddress,
    });
  };

  const emergencyRecover = (to: `0x${string}`) => {
    if (!userAddress) return;
    writeEmergencyRecover({
      address: WALLET_CONTRACT_ADDRESS,
      abi: WALLET_CONTRACT_ABI,
      functionName: 'emergencyRecover',
      args: [to],
      chain: baseSepolia,
      account: userAddress,
    });
  };

  const transferOwnership = (newOwner: `0x${string}`) => {
    if (!userAddress) return;
    writeTransferOwnership({
      address: WALLET_CONTRACT_ADDRESS,
      abi: WALLET_CONTRACT_ABI,
      functionName: 'transferOwnership',
      args: [newOwner],
      chain: baseSepolia,
      account: userAddress,
    });
  };

  const renounceOwnership = () => {
    if (!userAddress) return;
    writeRenounceOwnership({
      address: WALLET_CONTRACT_ADDRESS,
      abi: WALLET_CONTRACT_ABI,
      functionName: 'renounceOwnership',
      chain: baseSepolia,
      account: userAddress,
    });
  };

  return {
    // Read data
    balance: balance ? formatEther(balance) : '0',
    balanceRaw: balance,
    owner,
    isPaused,
    protocolFeeBps: protocolFeeBps ? Number(protocolFeeBps) / 100 : 0.5,
    treasury,
    // Write functions
    sendEth,
    pause,
    unpause,
    emergencyRecover,
    transferOwnership,
    renounceOwnership,
    resetSendEth,
    // Transaction states
    sendEthHash,
    isSendingEth,
    isConfirmingSendEth,
    isSendEthSuccess,
    isPausing,
    isConfirmingPause,
    isPauseSuccess,
    isUnpausing,
    isConfirmingUnpause,
    isUnpauseSuccess,
    isRecovering,
    isConfirmingRecover,
    isRecoverSuccess,
    isTransferring,
    isConfirmingTransfer,
    isTransferSuccess,
    isRenouncing,
    isConfirmingRenounce,
    isRenounceSuccess,
    // Refetch functions
    refetchBalance,
    refetchOwner,
    refetchPaused,
  };
}
