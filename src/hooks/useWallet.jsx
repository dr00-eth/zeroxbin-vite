import { useState, useEffect } from 'react';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
import { NETWORKS, CONTRACT_ADDRESSES } from '../config';

export function useWallet() {
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();
  const [{ connectedChain, settingChain }, setChain] = useSetChain();
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [contractAddress, setContractAddress] = useState(null);

  useEffect(() => {
    if (wallet?.provider) {
      const ethersProvider = new ethers.BrowserProvider(wallet.provider, 'any');
      setProvider(ethersProvider);
      setAccount(wallet.accounts[0].address);
    } else {
      setProvider(null);
      setAccount(null);
    }
  }, [wallet]);

  useEffect(() => {
    if (connectedChain) {
      setContractAddress(CONTRACT_ADDRESSES[connectedChain.id]);
    }
  }, [connectedChain]);

  const connectWallet = async () => {
    const wallets = await connect();
    if (wallets[0]) {
      await setChain({ chainId: Object.values(NETWORKS)[0].id });
    }
  };

  const disconnectWallet = async () => {
    await disconnect(wallet);
  };

  const switchNetwork = async (chainId) => {
    if (connectedChain?.id !== chainId) {
      try {
        await setChain({ chainId });
      } catch (error) {
        console.error('Error switching network:', error);
      }
    }
  };

  return {
    wallet,
    account,
    provider,
    connecting,
    contractAddress,
    connectedChain,
    connectWallet,
    disconnectWallet,
    switchNetwork
  };
}