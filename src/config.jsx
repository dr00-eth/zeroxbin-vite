import { init } from '@web3-onboard/react';
import injectedModule from '@web3-onboard/injected-wallets';

const injected = injectedModule();

export const RPC_URL = import.meta.env.VITE_RPC_URL;
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
export const CONTRACT_ABI = JSON.parse(import.meta.env.VITE_CONTRACT_ABI);
export const CHAIN_ID = '0xa4b1'; // Arbitrum chain ID
export const CHAIN_NAME = 'Arbitrum One';

export const chains = [
  {
    id: CHAIN_ID,
    token: 'ETH',
    label: CHAIN_NAME,
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