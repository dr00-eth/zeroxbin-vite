import React, { useState, useEffect } from 'react';
import { useConnectWallet } from '@web3-onboard/react';
import { ethers } from 'ethers';
import axios from 'axios';

function TipCreator({ pasteId, creator }) {
  const [{ wallet }] = useConnectWallet();
  const [tipAmount, setTipAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [ethPrice, setEthPrice] = useState(null);

  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        setEthPrice(response.data.ethereum.usd);
      } catch (error) {
        console.error('Error fetching ETH price:', error);
      }
    };

    fetchEthPrice();
    const interval = setInterval(fetchEthPrice, 60000); // Update price every minute

    return () => clearInterval(interval);
  }, []);

  const calculateUsdValue = (ethAmount) => {
    if (!ethPrice || !ethAmount) return '0.00';
    return (parseFloat(ethAmount) * ethPrice).toFixed(2);
  };

  const handleTip = async (e) => {
    e.preventDefault();
    if (!wallet) {
      setError('Wallet not connected. Please connect your wallet.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const provider = new ethers.BrowserProvider(wallet.provider);
      const signer = await provider.getSigner();
      
      const tx = await signer.sendTransaction({
        to: creator,
        value: ethers.parseEther(tipAmount)
      });

      console.log('Transaction sent:', tx.hash);
      await tx.wait();
      console.log('Transaction confirmed');

      setSuccess(true);
      setTipAmount('');
    } catch (error) {
      console.error('Error sending tip:', error);
      setError('Error sending tip: ' + error.message);
    }
    setLoading(false);
  };

  if (!wallet) {
    return (
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Tip the Creator</h3>
        <p>Please connect your wallet to send a tip.</p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Tip the Creator</h3>
      {success && <p className="text-green-500 mb-2">Tip sent successfully!</p>}
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <form onSubmit={handleTip} className="flex flex-col items-start">
        <div className="flex items-center mb-2">
          <input
            type="number"
            step="0.001"
            min="0"
            value={tipAmount}
            onChange={(e) => setTipAmount(e.target.value)}
            placeholder="ETH Amount"
            className="mr-2 p-2 border rounded"
          />
          <button
            type="submit"
            disabled={loading || !wallet}
            className={`bg-green-500 text-white px-4 py-2 rounded ${(loading || !wallet) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-600'}`}
          >
            {loading ? 'Sending...' : 'Send Tip'}
          </button>
        </div>
        {ethPrice && (
          <p className="text-sm text-gray-300">
            ≈ ${calculateUsdValue(tipAmount)} USD
          </p>
        )}
      </form>
    </div>
  );
}

export default TipCreator;