import { NETWORKS, CONTRACT_ADDRESSES, CONTRACT_ABI, TESTNET_CONTRACT_ABI } from '../config';

export const getContractAddress = (chainId) => {
  return CONTRACT_ADDRESSES[chainId] || null;
};

export const getContractABI = (chainId) => {
  return chainId == '0x66eee' ? TESTNET_CONTRACT_ABI : CONTRACT_ABI;
};

export const getSupportedNetworks = () => {
  return Object.values(NETWORKS);
};

export const isNetworkSupported = (chainId) => {
  return Object.keys(CONTRACT_ADDRESSES).includes(chainId);
};

export const getNetworkName = (chainId) => {
  const network = Object.values(NETWORKS).find(net => net.id === chainId);
  return network ? network.label : 'Unknown Network';
};