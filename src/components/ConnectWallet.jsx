import React from 'react';
import { useWallet } from '../hooks/useWallet';

export default function ConnectWallet() {
  const { wallet, account, connecting, connectWallet, disconnect } = useWallet();

  if (wallet?.provider && account) {
    return (
      <div>
        <div>{account.slice(0, 6)}...{account.slice(-4)}</div>
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
        onClick={connectWallet}
        className="py-2 px-4 bg-green-500 text-white rounded hover:bg-green-600 transition duration-300"
      >
        {connecting ? 'Connecting...' : 'Connect'}
      </button>
    </div>
  );
}