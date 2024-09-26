import React from 'react';
import { useWallet } from '../hooks/useWallet';

export default function ConnectWallet() {
  const { wallet, account, connecting, connectWallet } = useWallet();

  if (wallet?.provider && account) {
    return (
      <div className="text-sm text-gray-300">
        Connected: {account.slice(0, 6)}...{account.slice(-4)}
      </div>
    );
  }

  return (
    <button
      disabled={connecting}
      onClick={connectWallet}
      className="py-2 px-4 bg-green-500 text-white rounded hover:bg-green-600 transition duration-300"
    >
      {connecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}