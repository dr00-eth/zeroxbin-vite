import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import { generateMessageToSign } from '../utils/CryptoUtils';

function AccessPaste({ contract, pasteId, pasteType, price, publicKey, onAccessGranted }) {
  const { wallet, provider } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAccess = async () => {
    if (!contract || !wallet || !provider) {
      setError('Wallet not connected. Please connect your wallet.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      if (pasteType === 'Paid') {
        console.log('Attempting to pay for access');
        const tx = await contract.accessPaste(pasteId, { value: ethers.parseEther(price) });
        console.log('Payment transaction sent:', tx.hash);
        await tx.wait();
        console.log('Payment transaction confirmed');
      }

      console.log('Generating signature');
      const message = generateMessageToSign(pasteId, address);
      const signature = await signer.signMessage(ethers.getBytes(message));
      
      console.log('Access granted, calling onAccessGranted');
      console.log('Signature:', signature);
      onAccessGranted(signature);
    } catch (err) {
      console.error('Error accessing paste:', err);
      setError(`Error accessing paste: ${err.message}`);
    }
    setLoading(false);
  };

  if (!wallet) {
    return (
      <div className="mb-4">
        <p>Please connect your wallet to access this paste.</p>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <p className="mb-2">This paste requires {pasteType === 'Paid' ? 'payment' : 'authentication'} to access.</p>
      {pasteType === 'Paid' && (
        <p className="mb-2">Price: {price} ETH</p>
      )}
      <button 
        onClick={handleAccess} 
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
      >
        {loading ? 'Processing...' : pasteType === 'Paid' ? `Pay ${price} ETH and Access` : 'Sign and Access'}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}

export default AccessPaste;