import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ethers } from 'ethers';
import MDEditor from '@uiw/react-md-editor';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import Swal from 'sweetalert2';
import { getContractAddress, getContractABI, isNetworkSupported, getNetworkName } from '../contracts/config';
import { encryptContent, decryptContent, generateMessageToSign, deriveDecryptionKey } from '../utils/CryptoUtils';
import { useWallet } from '../hooks/useWallet';

function EditPaste() {
  const { id: pasteId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { wallet, provider, connectedChain, connectWallet } = useWallet();
  const [contract, setContract] = useState(null);
  const [pasteInfo, setPasteInfo] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pasteType, setPasteType] = useState('');
  const [expirationDate, setExpirationDate] = useState(null);
  const [publicKey, setPublicKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [currentVersion, setCurrentVersion] = useState(null);

  useEffect(() => {
    const initContract = async () => {
      if (provider && connectedChain) {
        if (isNetworkSupported(connectedChain.id)) {
          const contractAddress = getContractAddress(connectedChain.id);
          const contractABI = getContractABI(connectedChain.id);
          const signer = await provider.getSigner();
          const contractInstance = new ethers.Contract(contractAddress, contractABI, signer);
          setContract(contractInstance);
          setError('');
          await fetchPasteData(contractInstance);
        } else {
          setError(`Network ${getNetworkName(connectedChain.id)} is not supported. Please switch to a supported network.`);
        }
      }
    };

    initContract();
  }, [provider, connectedChain, pasteId]);

  const fetchPasteData = async (contractInstance) => {
    if (!contractInstance || !pasteId) return;

    try {
      // First, fetch the paste info to get the current version
      const pasteInfoResult = await contractInstance.pastes(pasteId);
      const currentVersion = Number(pasteInfoResult.currentVersion);
      setCurrentVersion(currentVersion);

      // Now fetch the paste with the current version
      const result = await contractInstance.getPaste(pasteId, currentVersion);
      const [pasteInfo, pasteContent, access] = result;

      setPasteInfo(pasteInfo);
      setTitle(pasteInfo.title);
      const pasteTypeValue = Number(pasteInfo.pasteType);
      setPasteType(['Public', 'Paid', 'Private'][pasteTypeValue]);
      setExpirationDate(pasteInfo.expirationTime > 0 ? new Date(Number(pasteInfo.expirationTime) * 1000) : null);
      setPublicKey(pasteInfo.publicKey);
      setHasAccess(access);

      console.log('Paste Info:', pasteInfo);
      console.log('Public Key:', pasteInfo.publicKey);

      if (access) {
        if (pasteTypeValue === 0) { // Public paste
          setContent(ethers.toUtf8String(pasteContent));
        } else {
          await handleAccessGranted(pasteContent, pasteInfo.publicKey);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching paste data:', err);
      setError('Error fetching paste data: ' + err.message);
      setLoading(false);
    }
  };

  const handleAccessGranted = async (encryptedContent, publicKey) => {
    try {
      if (!wallet || !provider) {
        throw new Error('Wallet not connected');
      }

      if (!publicKey) {
        throw new Error('Public key is missing');
      }

      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const message = generateMessageToSign(pasteId, address);
      const signature = await signer.signMessage(ethers.getBytes(message));

      console.log('Deriving decryption key with public key:', publicKey);
      const decryptionKey = await deriveDecryptionKey(publicKey, signature);
      
      if (!decryptionKey) {
        throw new Error('Failed to derive decryption key');
      }

      const contentToDecrypt = typeof encryptedContent === 'string' ? encryptedContent : ethers.toUtf8String(encryptedContent);
      console.log('Decrypting content:', contentToDecrypt);
      const decryptedContent = await decryptContent(contentToDecrypt, decryptionKey);
      
      if (!decryptedContent) {
        throw new Error('Failed to decrypt content');
      }

      setContent(decryptedContent);
    } catch (err) {
      console.error('Error handling access granted:', err);
      setError('Error handling access granted: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contract) {
      setError('Wallet not connected or unsupported network. Please connect your wallet and switch to a supported network.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      let finalContent;
      if (pasteType === 'Public') {
        finalContent = ethers.toUtf8Bytes(content);
      } else {
        console.log('Encrypting content for non-public paste');
        console.log('Public key used for encryption:', publicKey);
        finalContent = await encryptContent(content, publicKey);
      }

      console.log('Updating paste with content:', finalContent);
      const tx = await contract.updatePaste(pasteId, finalContent);
      await tx.wait();
      setSuccess(true);
      Swal.fire({
        icon: 'success',
        title: 'Paste Updated',
        text: 'Your paste has been successfully updated.',
        timer: 2000,
        showConfirmButton: false
      }).then(() => navigate('/my-pastes'));
    } catch (error) {
      console.error('Error updating paste:', error);
      setError('Error updating paste: ' + error.message);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: 'There was an error updating your paste. Please try again.',
      });
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!contract) {
      setError('Wallet not connected or unsupported network. Please connect your wallet and switch to a supported network.');
      return;
    }

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const tx = await contract.deletePaste(pasteId);
        await tx.wait();
        Swal.fire(
          'Deleted!',
          'Your paste has been deleted.',
          'success'
        ).then(() => navigate('/my-pastes'));
      } catch (error) {
        console.error('Error deleting paste:', error);
        Swal.fire(
          'Error!',
          'There was an error deleting your paste. Please try again.',
          'error'
        );
      }
    }
  };

  if (!wallet) return (
    <div className="text-center">
      <p>Please connect your wallet to edit this paste.</p>
      <button onClick={connectWallet} className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Connect Wallet
      </button>
    </div>
  );
  if (loading) return <div className="text-center">Loading paste data...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;
  if (!hasAccess) return <div className="text-center">You don't have access to edit this paste.</div>;

  return (
    <div className="shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <h2 className="text-2xl font-bold mb-4">Edit Paste</h2>
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
            disabled
          />
        </div>

        <div>
          <label className="block text-white-700 text-sm font-bold mb-2" htmlFor="content">
            Paste Content (Version {currentVersion})
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
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-white-700 leading-tight focus:outline-none focus:shadow-outline"
            id="pasteType"
            type="text"
            value={pasteType}
            disabled
          />
        </div>

        <div>
          <label className="block text-white-700 text-sm font-bold mb-2" htmlFor="expirationDate">
            Expiration Date/Time
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
            placeholderText={expirationDate ? expirationDate.toLocaleString() : "Never"}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-white-700 leading-tight focus:outline-none focus:shadow-outline"
            disabled
          />
        </div>

        <div className="flex justify-between items-center">
          <button
            type="submit"
            disabled={loading}
            className={`bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Updating...' : 'Update Paste'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Delete Paste
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditPaste;