# SimpleBaseWallet

A secure, minimal ETH wallet contract for Base (chainId 8453) with protocol fees for Talent Protocol Base Builders leaderboard.

## Features

- **Receive ETH**: Accept deposits via fallback/receive function
- **Owner Withdrawals**: Send ETH to any address with 0.5% protocol fee
- **Security**: ReentrancyGuard, Pausable, Ownable
- **Emergency Recovery**: Owner can recover all funds in emergency
- **Immutable Treasury**: Protocol fees sent to fixed treasury address

## Contract Details

- **Solidity Version**: ^0.8.24
- **Protocol Fee**: 0.5% (50 BPS) on withdrawals
- **Treasury**: Immutable address set at deployment
- **Security**: Checks-Effects-Interactions pattern, custom errors

## Deployment Steps

### Prerequisites

1. Install Foundry: https://book.getfoundry.sh/getting-started/installation
2. Clone this repository
3. Install dependencies: `forge install`
4. Set up environment variables: Copy `.env.example` to `.env` and fill in your values
5. Set up Foundry account: `cast wallet import defaultKey --interactive` or use private key

### Quick Deployment Scripts

#### Testnet Deployment (Base Sepolia)

```bash
./deploy-testnet.sh
```

**✅ Successfully Deployed Contract:**
- **Address:** `0xB0246478c73aAf9B4d730d1C6B6C2767C2D1Be5a`
- **Network:** Base Sepolia
- **Verification:** ✅ Verified on BaseScan
- **Treasury:** `0x1804c8AB1F12E6bbf3894d4083f33e07309d1f38` (deployer)

#### Mainnet Deployment (Base Mainnet)

⚠️ **Use with caution - Mainnet deployment cannot be undone**

```bash
./deploy-mainnet.sh
```

### Manual Deployment

#### Local Testing

```bash
# Run tests
forge test

# Run with gas reporting
forge test --gas-report

# Run specific test
forge test --match-test testSendEth
```

#### Deployment to Base Sepolia

1. Set up your environment variables:
```bash
export PRIVATE_KEY=your_private_key_without_0x
export BASE_SEPOLIA_RPC=https://sepolia.base.org
```

2. Deploy the contract:
```bash
forge script script/DeploySimpleWallet.s.sol --rpc-url $BASE_SEPOLIA_RPC --private-key $PRIVATE_KEY --broadcast --verify
```

3. Note the deployed contract address from the output.

### Deployment to Base Mainnet

1. Update RPC URL:
```bash
export BASE_MAINNET_RPC=https://mainnet.base.org
```

2. Deploy:
```bash
forge script script/DeploySimpleWallet.s.sol --rpc-url $BASE_MAINNET_RPC --private-key $PRIVATE_KEY --broadcast --verify
```

## Contract Interaction

### Base Sepolia Testnet Contract
- **Address:** [`0xB0246478c73aAf9B4d730d1C6B6C2767C2D1Be5a`](https://sepolia.basescan.org/address/0xB0246478c73aAf9B4d730d1C6B6C2767C2D1Be5a)
- **Source Code:** ✅ Verified on BaseScan
- **Treasury:** `0x1804c8AB1F12E6bbf3894d4083f33e07309d1f38`

### Using Cast (Command Line)

```bash
# Check balance
cast call 0xB0246478c73aAf9B4d730d1C6B6C2767C2D1Be5a "getBalance()" --rpc-url https://sepolia.base.org

# Send ETH (owner only)
cast send 0xB0246478c73aAf9B4d730d1C6B6C2767C2D1Be5a "sendEth(address,uint256)" 0xRecipientAddress 1000000000000000000 --rpc-url https://sepolia.base.org --private-key $PRIVATE_KEY
```

### Using Foundry Cast

```bash
# Get contract info
cast call --rpc-url https://sepolia.base.org 0xB0246478c73aAf9B4d730d1C6B6C2767C2D1Be5a "TREASURY()"
cast call --rpc-url https://sepolia.base.org 0xB0246478c73aAf9B4d730d1C6B6C2767C2D1Be5a "owner()"
```

## Leaderboard Impact

Every withdrawal generates measurable on-chain fees:
- **0.5% protocol fee** sent to treasury on each `sendETH` call
- **Public repository** earns GitHub contribution points
- **Real usage** through deposits and withdrawals boosts leaderboard ranking
### Live Testnet Contract
The deployed contract on Base Sepolia is ready for testing:
- Fund it with test ETH
- Use `sendEth` to generate fee transactions
- Each withdrawal creates on-chain fee data for leaderboard tracking

**Start generating fees today!** 🚀
## Security Considerations

- **Reentrancy Protection**: Uses OpenZeppelin's ReentrancyGuard
- **Pausable**: Emergency pause functionality
- **Access Control**: Only owner can withdraw/send ETH
- **Input Validation**: Zero address and balance checks
- **Immutable Treasury**: Fee destination cannot be changed

## Contract Functions

### Core Functions
- `receive()`: Accept ETH deposits
- `sendEth(address to, uint256 amount)`: Send ETH with fee (owner only)
- `getBalance()`: View contract balance

### Admin Functions
- `pause()`: Pause contract (owner only)
- `unpause()`: Unpause contract (owner only)
- `emergencyRecover(address to)`: Emergency fund recovery (owner only)

### View Functions
- `treasury()`: Get treasury address
- `owner()`: Get contract owner
- `paused()`: Check if contract is paused

## Events

- `Deposited(address indexed from, uint256 amount)`: ETH received
- `Withdrawn(address indexed owner, address indexed to, uint256 amountSent, uint256 fee)`: ETH sent with fee
- `EmergencyRecovered(address indexed to, uint256 amount)`: Emergency recovery

## Testing

Run the full test suite:
```bash
forge test
```

Test coverage includes:
- ✅ Deposit functionality
- ✅ Withdrawal with fee calculation
- ✅ Access control (owner only)
- ✅ Pause/unpause functionality
- ✅ Emergency recovery
- ✅ Input validation and error handling
- ✅ Event emissions
- ✅ Reentrancy protection

## License

MIT
