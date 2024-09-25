import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useConnectWallet } from '@web3-onboard/react';

function Home() {
  const navigate = useNavigate();
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();

  const handleConnect = async () => {
    if (wallet) {
      navigate('/create');
    } else {
      const connected = await connect();
      if (connected[0]) {
        navigate('/create');
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to 0xBin</h1>
      <p className="text-xl mb-8">
        0xBin is a decentralized pastebin service built with EVM. 
        Create, share, and access pastes with the power of blockchain technology.
      </p>
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Features:</h2>
        <ul className="list-disc list-inside text-left">
          <li>Create public, paid, and private pastes</li>
          <li>Set access prices/addresses for your pastes</li>
          <li>Tip paste creators</li>
          <li>Fully decentralized and censorship-resistant</li>
        </ul>
      </div>
      <button 
        onClick={handleConnect}
        disabled={connecting}
        className={`mt-8 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-semibold ${connecting ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {wallet ? 'Go to Create Paste' : connecting ? 'Connecting...' : 'Connect Wallet to Get Started'}
      </button>
      {wallet && (
        <p className="mt-4 text-sm text-gray-300">
          Connected with {wallet.label}
        </p>
      )}
    </div>
  );
}

export default Home;