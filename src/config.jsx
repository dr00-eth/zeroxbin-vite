import { init } from '@web3-onboard/react';
import injectedModule from '@web3-onboard/injected-wallets';

const injected = injectedModule();

export const RPC_URL = import.meta.env.VITE_RPC_URL;
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
export const CONTRACT_ABI = JSON.parse(import.meta.env.VITE_CONTRACT_ABI);

export const chains = [
  {
    id: '0x66eee',
    token: 'ETH',
    label: 'Arbitrum Sepolia',
    rpcUrl: RPC_URL,
  },
];

export const wallets = [injected];

export const web3Onboard = init({
  wallets,
  chains,
  appMetadata: {
    name: '0xBin',
    description: 'Decentralized PasteBin Alternative',
  },
});