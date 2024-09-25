import React, { useState, useEffect } from 'react';
import { useConnectWallet } from '@web3-onboard/react';
import { ethers } from 'ethers';
import { deriveDecryptionKey } from '../utils/CryptoUtils';

function AccessPaste({ contract, pasteId, pasteType, price, publicKey, onAccessGranted }) {
  const [{ wallet }] = useConnectWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      if (!contract || !wallet) return;

      try {
        const pasteData = await contract.getPaste(pasteId);
        setHasAccess(pasteData.hasAccess);
      } catch (err) {
        console.error('Error checking access:', err);
        setError('Error checking access: ' + err.message);
      }
    };

    checkAccess();
  }, [contract, pasteId, wallet]);

  const handleAccess = async () => {
    if (!contract || !wallet) {
      setError('Wallet not connected. Please connect your wallet.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const provider = new ethers.BrowserProvider(wallet.provider);
      const signer = await provider.getSigner();
      
      if (pasteType === 'Paid' && !hasAccess) {
        console.log('Attempting to pay for access');
        const tx = await contract.accessPaste(pasteId, { value: ethers.parseEther(price) });
        console.log('Payment transaction sent:', tx.hash);
        await tx.wait();
        console.log('Payment transaction confirmed');
      }

      console.log('Generating signature');
      const message = ethers.solidityPackedKeccak256(["uint256", "address"], [pasteId, await signer.getAddress()]);
      const signature = await signer.signMessage(ethers.getBytes(message));
      
      console.log('Deriving decryption key');
      const decryptionKey = await deriveDecryptionKey(publicKey, signature);
      
      console.log('Access granted, calling onAccessGranted');
      onAccessGranted(decryptionKey);
    } catch (err) {
      console.error('Error accessing paste:', err);
      setError(`Error accessing paste: ${err.message}`);
    }
    setLoading(false);
  };

  if (hasAccess) {
    return (
      <div className="mb-4">
        <button
          onClick={handleAccess}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          {loading ? 'Signing...' : 'Sign to Access Paste'}
        </button>
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