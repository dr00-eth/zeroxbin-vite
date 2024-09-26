import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { getContractAddress, contractABI, isNetworkSupported, getNetworkName } from '../contracts/config';
import { useWallet } from '../hooks/useWallet';

function UserPastes() {
  const { wallet, provider, connectedChain, connectWallet } = useWallet();
  const [contract, setContract] = useState(null);
  const [ownPastes, setOwnPastes] = useState([]);
  const [accessiblePastes, setAccessiblePastes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const initContract = async () => {
      if (provider && connectedChain) {
        if (isNetworkSupported(connectedChain.id)) {
          const contractAddress = getContractAddress(connectedChain.id);
          const signer = await provider.getSigner();
          const contractInstance = new ethers.Contract(contractAddress, contractABI, signer);
          setContract(contractInstance);
          setError(null);
        } else {
          setError(`Network ${getNetworkName(connectedChain.id)} is not supported. Please switch to a supported network.`);
        }
      }
    };

    initContract();
  }, [provider, connectedChain]);

  useEffect(() => {
    if (contract && wallet) {
      fetchUserPastes();
      fetchAccessiblePastes();
    }
  }, [contract, wallet]);

  const sortPastesByDate = (pastes) => {
    return pastes.sort((a, b) => new Date(b.creationTime) - new Date(a.creationTime));
  };

  const fetchUserPastes = async () => {
    if (!contract || !wallet) {
      setLoading(false);
      return;
    }

    try {
      const account = wallet.accounts[0].address;
      console.log("Fetching pastes for account:", account);
      const pasteIds = await contract.getUserPastes(account);
      console.log("Paste IDs:", pasteIds);
      const pastesData = await Promise.all(pasteIds.map(async (id) => {
        console.log("Fetching paste with ID:", id.toString());
        const paste = await contract.getPaste(id);
        console.log("Raw paste data:", paste);
        
        let creationTime;
        if (typeof paste.creationTime === 'bigint') {
          creationTime = Number(paste.creationTime);
        } else if (typeof paste.creationTime === 'number') {
          creationTime = paste.creationTime;
        } else {
          creationTime = Number(paste.creationTime);
        }
        
        return {
          id: id.toString(),
          title: paste.title,
          creationTime: new Date(creationTime * 1000).toLocaleString(),
          pasteType: ['Public', 'Paid', 'Private'][Number(paste.pasteType)]
        };
      }));
      console.log("Fetched pastes data:", pastesData);
      setOwnPastes(sortPastesByDate(pastesData));
      setLoading(false);
    } catch (err) {
      console.error("Error in fetchUserPastes:", err);
      setError('Error fetching user pastes: ' + err.message);
      setLoading(false);
    }
  };

  const fetchAccessiblePastes = async () => {
    if (!contract || !wallet) {
      setLoading(false);
      return;
    }

    try {
      const account = wallet.accounts[0].address;
      console.log("Fetching accessible pastes for account:", account);
      const accessiblePastesData = await contract.getAccessiblePastes(account);
      console.log("Accessible pastes data:", accessiblePastesData);

      const formattedAccessiblePastes = accessiblePastesData
        .map(paste => ({
          id: paste.id.toString(),
          title: paste.title,
          creationTime: new Date(Number(paste.creationTime) * 1000).toLocaleString(),
          pasteType: ['Public', 'Paid', 'Private'][Number(paste.pasteType)],
          creator: paste.creator
        }))
        .filter(paste => paste.creator.toLowerCase() !== account.toLowerCase());

      setAccessiblePastes(sortPastesByDate(formattedAccessiblePastes));
      setLoading(false);
    } catch (err) {
      console.error("Error in fetchAccessiblePastes:", err);
      setError('Error fetching accessible pastes: ' + err.message);
      setLoading(false);
    }
  };

  const handleEdit = (pasteId) => {
    navigate(`/edit-paste/${pasteId}`);
  };

  if (!wallet) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-4">Your Pastes</h2>
        <p className="mb-4">Connect your wallet to view your pastes and manage your content.</p>
        <button
          onClick={connectWallet}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  if (loading) return <div className="text-center">Loading your pastes...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div className="shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <h2 className="text-2xl font-bold mb-4">Your Pastes</h2>
      {connectedChain && (
        <p className="mb-4">Current network: {getNetworkName(connectedChain.id)}</p>
      )}

      <h3 className="text-xl font-semibold mb-2">Your Created Pastes</h3>
      {ownPastes.length === 0 ? (
        <p>You haven't created any pastes yet.</p>
      ) : (
        <ul className="space-y-2 mb-8">
          {ownPastes.map((paste) => (
            <li key={paste.id} className="border-b pb-2 flex justify-between items-center">
              <div>
                <Link to={`/paste/${paste.id}`} className="text-slate-400 hover:text-blue-700">
                  {paste.title}
                </Link>
                <p className="text-sm text-gray-100">Created: {paste.creationTime}</p>
                <p className="text-sm text-gray-100">Type: {paste.pasteType}</p>
              </div>
              <button
                onClick={() => handleEdit(paste.id)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded focus:outline-none focus:shadow-outline"
              >
                Manage
              </button>
            </li>
          ))}
        </ul>
      )}

      <h3 className="text-xl font-semibold mb-2">Pastes You Can Access</h3>
      {accessiblePastes.length === 0 ? (
        <p>No Private or Paid Pastes are granted to your address.</p>
      ) : (
        <ul className="space-y-2">
          {accessiblePastes.map((paste) => (
            <li key={paste.id} className="border-b pb-2">
              <Link to={`/paste/${paste.id}`} className="text-slate-400 hover:text-blue-700">
                {paste.title}
              </Link>
              <p className="text-sm text-gray-100">Created by: {paste.creator.slice(0, 6)}...{paste.creator.slice(-4)}</p>
              <p className="text-sm text-gray-100">Created: {paste.creationTime}</p>
              <p className="text-sm text-gray-100">Type: {paste.pasteType}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default UserPastes;