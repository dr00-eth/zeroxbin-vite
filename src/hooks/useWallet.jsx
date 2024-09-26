import { useState, useEffect } from 'react';
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { ethers } from 'ethers';
import { CHAIN_ID, CHAIN_NAME } from '../config';

export function useWallet() {
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();
  const [{ chains, connectedChain, settingChain }, setChain] = useSetChain();
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainCorrect, setChainCorrect] = useState(false);

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
      setChainCorrect(connectedChain.id === CHAIN_ID);
    }
  }, [connectedChain]);

  const connectWallet = async () => {
    const wallets = await connect();
    if (wallets[0]) {
      await switchNetwork();
    }
  };

  const switchNetwork = async () => {
    if (connectedChain?.id !== CHAIN_ID) {
      try {
        await setChain({ chainId: CHAIN_ID });
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
    chainCorrect,
    connectWallet,
    switchNetwork,
    disconnect
  };
}