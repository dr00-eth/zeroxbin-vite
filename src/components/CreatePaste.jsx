import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import MDEditor from '@uiw/react-md-editor';
import "react-datepicker/dist/react-datepicker.css";
import { getContractAddress, contractABI, isNetworkSupported, getNetworkName } from '../contracts/config';
import { generateEncryptionKey, encryptContent } from '../utils/CryptoUtils';
import { useWallet } from '../hooks/useWallet';

function CreatePaste() {
  const { wallet, provider, connectedChain, connectWallet } = useWallet();
  const [contract, setContract] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pasteType, setPasteType] = useState('public');
  const [price, setPrice] = useState('0');
  const [allowedAddresses, setAllowedAddresses] = useState([]);
  const [currentAddress, setCurrentAddress] = useState('');
  const [addressError, setAddressError] = useState('');
  const [tipAmount, setTipAmount] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [ethPrice, setEthPrice] = useState(null);
  const [expirationDate, setExpirationDate] = useState(null);

  useEffect(() => {
    const initContract = async () => {
      if (provider && connectedChain) {
        if (isNetworkSupported(connectedChain.id)) {
          const contractAddress = getContractAddress(connectedChain.id);
          const signer = await provider.getSigner();
          const contractInstance = new ethers.Contract(contractAddress, contractABI, signer);
          setContract(contractInstance);
          setError('');
        } else {
          setError(`Network ${getNetworkName(connectedChain.id)} is not supported. Please switch to a supported network.`);
        }
      }
    };

    initContract();
  }, [provider, connectedChain]);

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

  const handleAddAddress = () => {
    if (ethers.isAddress(currentAddress)) {
      if (!allowedAddresses.includes(currentAddress)) {
        setAllowedAddresses([...allowedAddresses, currentAddress]);
        setCurrentAddress('');
        setAddressError('');
      } else {
        setAddressError('Address already added');
      }
    } else {
      setAddressError('Invalid Ethereum address');
    }
  };

  const handleRemoveAddress = (addressToRemove) => {
    setAllowedAddresses(allowedAddresses.filter(addr => addr !== addressToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contract) {
      setError('Wallet not connected. Please connect your wallet.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      let tx;
      const tipInWei = ethers.parseEther(tipAmount);
      const expirationTime = expirationDate ? Math.floor(expirationDate.getTime() / 1000) : 0;

      let finalContent = content;
      let publicKey = '';

      if (pasteType !== 'public') {
        const encryptionKey = generateEncryptionKey();
        //console.log('Generated encryption key:', encryptionKey);
        finalContent = await encryptContent(content, encryptionKey);
        //console.log('Encrypted content:', finalContent);
        publicKey = encryptionKey.publicKey;
      }

      switch (pasteType) {
        case 'public':
          tx = await contract.createPublicPaste(title, finalContent, expirationTime, publicKey, { value: tipInWei });
          break;
        case 'paid':
          const priceInWei = ethers.parseEther(price);
          tx = await contract.createPaidPaste(title, ethers.toUtf8Bytes(finalContent), expirationTime, priceInWei, publicKey, { value: tipInWei });
          break;
        case 'private':
          tx = await contract.createPrivatePaste(title, ethers.toUtf8Bytes(finalContent), expirationTime, allowedAddresses, publicKey, { value: tipInWei });
          break;
      }

      //console.log('Transaction sent:', tx.hash);
      await tx.wait();
      //console.log('Transaction confirmed');
      setSuccess(true);
      // Reset form
      // ... (reset logic remains the same)
    } catch (error) {
      console.error('Error creating paste:', error);
      setError('Error creating paste: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <h2 className="text-2xl font-bold mb-4">Create New Paste</h2>
      {!wallet && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4" role="alert">
          <p className="font-bold">Wallet Not Connected</p>
          <p>Please connect your wallet to create a paste. You can still fill out the form below.</p>
          <button onClick={connectWallet} className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Connect Wallet
          </button>
        </div>
      )}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">Paste created successfully!</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title input */}
        <div>
          <label className="block text-white-700 text-sm font-bold mb-2" htmlFor="title">
            Paste Title
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-white-700 leading-tight focus:outline-none focus:shadow-outline"
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Paste Title"
            required
          />
        </div>

        {/* Content input */}
        <div>
          <label className="block text-white-700 text-sm font-bold mb-2" htmlFor="content">
            Paste Content
          </label>
          <MDEditor
            value={content}
            onChange={setContent}
            preview="edit"
            height={400}
          />
        </div>

        {/* Paste Type selection */}
        <div>
          <label className="block text-white-700 text-sm font-bold mb-2" htmlFor="pasteType">
            Paste Type
          </label>
          <select
            className="shadow appearance-none border rounded w-full py-2 px-3 text-white-700 leading-tight focus:outline-none focus:shadow-outline"
            id="pasteType"
            value={pasteType}
            onChange={(e) => setPasteType(e.target.value)}
          >
            <option value="public">Public</option>
            <option value="paid">Paid</option>
            <option value="private">Private</option>
          </select>
        </div>

        {/* Expiration Date input */}
        <div>
          <label className="block text-white-700 text-sm font-bold mb-2" htmlFor="expirationDate">
            Expiration Date/Time (optional)
          </label>
          <DatePicker
            selected={expirationDate}
            onChange={(date) => setExpirationDate(date)}
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={15}
            timeCaption="time"
            dateFormat="MMMM d, yyyy h:mm aa"
            minDate={new Date()}
            placeholderText="Select date and time"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-white-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        {/* Price input for Paid pastes */}
        {pasteType === 'paid' && (
          <div>
            <label className="block text-white-700 text-sm font-bold mb-2" htmlFor="price">
              Access Price (ETH)
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-white-700 leading-tight focus:outline-none focus:shadow-outline"
              id="price"
              type="number"
              step="0.001"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            {ethPrice && (
              <p className="text-sm text-white-600 mt-1">
                ≈ ${calculateUsdValue(price)} USD
              </p>
            )}
          </div>
        )}

        {/* Allowed Addresses input for Private pastes */}
        {pasteType === 'private' && (
          <div>
            <label className="block text-white-700 text-sm font-bold mb-2" htmlFor="allowedAddresses">
              Allowed Addresses
            </label>
            <div className="flex items-center mb-2">
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-white-700 leading-tight focus:outline-none focus:shadow-outline mr-2"
                id="currentAddress"
                type="text"
                value={currentAddress}
                onChange={(e) => setCurrentAddress(e.target.value)}
                placeholder="0x..."
              />
              <button
                type="button"
                onClick={handleAddAddress}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Add
              </button>
            </div>
            {addressError && <p className="text-red-500 text-sm mb-2">{addressError}</p>}
            <ul className="list-disc pl-5">
              {allowedAddresses.map((address, index) => (
                <li key={index} className="flex items-center justify-between mb-1">
                  <span className="text-sm">{address}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAddress(address)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tip input */}
        <div>
          <label className="block text-white-700 text-sm font-bold mb-2" htmlFor="tip">
            Tip the Devs (optional)
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-white-700 leading-tight focus:outline-none focus:shadow-outline"
            id="tip"
            type="number"
            step="0.001"
            min="0"
            value={tipAmount}
            onChange={(e) => setTipAmount(e.target.value)}
          />
          {ethPrice && (
            <p className="text-sm text-white-600 mt-1">
              ≈ ${calculateUsdValue(tipAmount)} USD
            </p>
          )}
        </div>

        {/* Submit button */}
        <div>
          <button
            type="submit"
            disabled={loading || !contract}
            className={`bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${(loading || !contract) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {!contract ? 'Connect Wallet to Create' : loading ? 'Creating...' : 'Create Paste'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreatePaste;