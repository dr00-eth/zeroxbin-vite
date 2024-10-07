import { init } from '@web3-onboard/react';
import injectedModule from '@web3-onboard/injected-wallets';

const injected = injectedModule();

export const NETWORKS = {
  ARBITRUM_ONE: {
    id: '0xa4b1',
    token: 'ETH',
    label: 'Arbitrum One',
    rpcUrl: import.meta.env.VITE_ARBITRUM_RPC_URL,
  },
  ARBITRUM_SEPOLIA: {
    id: '0x66eee',
    token: 'ETH',
    label: 'Arbitrum Sepolia Testnet',
    rpcUrl: import.meta.env.VITE_ARBITRUM_SEPOLIA_RPC_URL,
  },
};

export const UNUSED_NETWORKS = {
  ARBITRUM_ONE: {
    id: '0xa4b1',
    token: 'ETH',
    label: 'Arbitrum One',
    rpcUrl: import.meta.env.VITE_ARBITRUM_RPC_URL,
  },
  ETHEREUM: {
    id: '0x1',
    token: 'ETH',
    label: 'Ethereum Mainnet',
    rpcUrl: import.meta.env.VITE_ETHEREUM_RPC_URL,
  },
  OPTIMISM: {
    id: '0xa',
    token: 'ETH',
    label: 'Optimism',
    rpcUrl: import.meta.env.VITE_OPTIMISM_RPC_URL,
  },
  BASE: {
    id: '0x2105',
    token: 'ETH',
    label: 'Base',
    rpcUrl: import.meta.env.VITE_BASE_RPC_URL,
  },
};

export const CONTRACT_ADDRESSES = {
  [NETWORKS.ARBITRUM_ONE.id]: import.meta.env.VITE_ARBITRUM_CONTRACT_ADDRESS,
  [NETWORKS.ARBITRUM_SEPOLIA.id]: import.meta.env.VITE_ARBITRUM_SEPOLIA_CONTRACT_ADDRESS
};

export const UNUSED_CONTRACT_ADDRESSES = {
  [NETWORKS.ARBITRUM_ONE.id]: import.meta.env.VITE_ARBITRUM_CONTRACT_ADDRESS,
  // [NETWORKS.ETHEREUM.id]: import.meta.env.VITE_ETHEREUM_CONTRACT_ADDRESS,
  // [NETWORKS.OPTIMISM.id]: import.meta.env.VITE_OPTIMISM_CONTRACT_ADDRESS,
  // [NETWORKS.BASE.id]: import.meta.env.VITE_BASE_CONTRACT_ADDRESS,
};


export const CONTRACT_ABI = JSON.parse(import.meta.env.VITE_CONTRACT_ABI);
export const TESTNET_CONTRACT_ABI = JSON.parse(import.meta.env.VITE_TESTNET_CONTRACT_ABI);

export const chains = Object.values(NETWORKS);

export const wallets = [injected];

export const web3Onboard = init({
  wallets,
  chains,
  appMetadata: {
    name: '0xBin',
    description: 'Decentralized PasteBin Alternative',
  },
});