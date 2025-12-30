#!/bin/bash

# Load environment variables
source .env

# Deploy SimpleBaseWallet to Base Mainnet
forge script script/DeploySimpleWallet.s.sol \
  --rpc-url $BASE_MAINNET_RPC_URL \
  --account defaultKey \
  --broadcast \
