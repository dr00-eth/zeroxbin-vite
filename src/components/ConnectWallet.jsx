import React, { useState, useEffect } from 'react';
import { useConnectWallet } from '@web3-onboard/react';
import { ethers } from 'ethers';
import { contractAddress, contractABI } from '../contracts/config';

export default function ConnectWallet() {
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();
  const [ethersProvider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);

  useEffect(() => {
    if (wallet?.provider) {
      const provider = new ethers.BrowserProvider(wallet.provider);
      setProvider(provider);

      provider.getSigner().then(signer => {
        signer.getAddress().then(address => {
          setAccount({
            address: address,
            balance: wallet.accounts[0].balance,
          });
        });
      });
    } else {
      setProvider(null);
      setAccount(null);
    }
  }, [wallet]);

  if (wallet?.provider && account) {
    return (
      <div>
        <div>{account.address.slice(0, 6)}...{account.address.slice(-4)}</div>
        <div>Connected to {wallet.label}</div>
        <button onClick={() => disconnect({ label: wallet.label })} className="py-2 px-4 bg-red-500 text-white rounded hover:bg-red-600 transition duration-300">
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        disabled={connecting}
        onClick={() => connect()}
        className="py-2 px-4 bg-green-500 text-white rounded hover:bg-green-600 transition duration-300"
      >
        {connecting ? 'Connecting...' : 'Connect'}
      </button>
    </div>
  );
}