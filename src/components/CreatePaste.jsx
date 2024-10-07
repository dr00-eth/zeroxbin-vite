import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import MDEditor from '@uiw/react-md-editor';
import "react-datepicker/dist/react-datepicker.css";
import { getContractAddress, getContractABI, isNetworkSupported, getNetworkName } from '../contracts/config';
import { generateEncryptionKey, encryptContent } from '../utils/CryptoUtils';
import { useWallet } from '../hooks/useWallet';

function CreatePaste() {
  const { wallet, provider, connectedChain, connectWallet } = useWallet();
  const [contract, setContract] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pasteType, setPasteType] = useState('Public');
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
        try {
          if (isNetworkSupported(connectedChain.id)) {
            const contractAddress = getContractAddress(connectedChain.id);
            const contractABI = getContractABI(connectedChain.id);
            const signer = await provider.getSigner();
            const contractInstance = new ethers.Contract(contractAddress, contractABI, signer);
            setContract(contractInstance);
            setError('');
          } else {
            setError(`Network ${getNetworkName(connectedChain.id)} is not supported. Please switch to a supported network.`);
          }
        } catch (err) {
          console.error("Error initializing contract:", err);
          setError(`Error initializing contract: ${err.message}`);
        }
      } else {
        setContract(null);
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
      const tipInWei = ethers.parseEther(tipAmount);
      const expirationTime = expirationDate ? Math.floor(expirationDate.getTime() / 1000) : 0;
  
      let finalContent;
      let publicKey = '';
  
      if (pasteType === 'Public') {
        finalContent = ethers.toUtf8Bytes(content);
      } else {
        console.log('Creating encrypted paste');
        const encryptionKey = generateEncryptionKey();
        console.log('Generated encryption key:', encryptionKey);
        finalContent = await encryptContent(content, encryptionKey);
        publicKey = encryptionKey;
        console.log('Encrypted content:', finalContent);
        console.log('Public key to be stored:', publicKey);
      }
  
      const pasteTypeEnum = ['Public', 'Paid', 'Private'].indexOf(pasteType);
      if (pasteTypeEnum === -1) {
        throw new Error('Invalid paste type');
      }
      
      const priceInWei = ethers.parseEther(price);

      console.log('Submitting paste to contract:', {
        title,
        content: finalContent,
        expirationTime,
        pasteTypeEnum,
        priceInWei,
        publicKey,
        allowedAddresses: pasteType === 'Private' ? allowedAddresses : []
      });

      // Use the consolidated createPaste function
      const tx = await contract.createPaste(
        title,
        finalContent,
        expirationTime,
        pasteTypeEnum,
        priceInWei,
        publicKey,
        pasteType === 'Private' ? allowedAddresses : [],
        { value: tipInWei }
      );
  
      console.log('Transaction sent:', tx.hash);
      await tx.wait();
      console.log('Transaction confirmed');
      setSuccess(true);
  
      // Reset form
      setTitle('');
      setContent('');
      setPasteType('Public');
      setPrice('0');
      setAllowedAddresses([]);
      setCurrentAddress('');
      setTipAmount('0');
      setExpirationDate(null);
  
      // Show success message
      setTimeout(() => {
        setSuccess(false);
      }, 5000); // Clear success message after 5 seconds
  
    } catch (error) {
      console.error('Error creating paste:', error);
      setError('Error creating paste: ' + error.message);
    }
    setLoading(false);
  };

  const isWalletConnected = wallet && provider && connectedChain;
  const isContractReady = isWalletConnected && contract;

  return (
    <div className="shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <h2 className="text-2xl font-bold mb-4">Create New Paste</h2>
      {!isWalletConnected && (
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
      <form onSubmit={handleSubmit} className="space-y-4">
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
            <option value="Public">Public</option>
            <option value="Paid">Paid</option>
            <option value="Private">Private</option>
          </select>
        </div>

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

        {pasteType === 'Paid' && (
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

        {pasteType === 'Private' && (
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

        <div>
          <button
            type="submit"
            disabled={loading || !isContractReady}
            className={`bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${(loading || !isContractReady) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {!isWalletConnected ? 'Connect Wallet to Create' : !isContractReady ? 'Initializing...' : loading ? 'Creating...' : 'Create Paste'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreatePaste;