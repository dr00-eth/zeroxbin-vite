import { NETWORKS, CONTRACT_ADDRESSES, CONTRACT_ABI } from '../config';

export const getContractAddress = (chainId) => {
  return CONTRACT_ADDRESSES[chainId] || null;
};

export const contractABI = CONTRACT_ABI;

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