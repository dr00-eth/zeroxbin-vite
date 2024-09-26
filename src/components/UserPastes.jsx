import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useConnectWallet } from '@web3-onboard/react';
import { ethers } from 'ethers';
import { contractAddress, contractABI } from '../contracts/config';

function UserPastes() {
  const [{ wallet }, connect] = useConnectWallet();
  const [contract, setContract] = useState(null);
  const [pastes, setPastes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const initContract = async () => {
      if (wallet?.provider) {
        try {
          const provider = new ethers.BrowserProvider(wallet.provider);
          const signer = await provider.getSigner();
          const contractInstance = new ethers.Contract(contractAddress, contractABI, signer);
          setContract(contractInstance);
        } catch (err) {
          console.error("Error initializing contract:", err);
          setError('Error initializing contract: ' + err.message);
        }
      } else {
        setContract(null);
      }
    };

    initContract();
  }, [wallet]);

  useEffect(() => {
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
            creationTime: new Date(creationTime * 1000).toLocaleString()
          };
        }));
        console.log("Fetched pastes data:", pastesData);
        setPastes(pastesData);
        setLoading(false);
      } catch (err) {
        console.error("Error in fetchUserPastes:", err);
        setError('Error fetching user pastes: ' + err.message);
        setLoading(false);
      }
    };

    fetchUserPastes();
  }, [contract, wallet]);

  const handleConnectWallet = async () => {
    await connect();
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
          onClick={handleConnectWallet}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  if (loading) return <div className="text-center">Loading your pastes...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;
  if (pastes.length === 0) return <div className="text-center">You haven't created any pastes yet.</div>;

  return (
    <div className="shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <h2 className="text-2xl font-bold mb-4">Your Pastes</h2>
      <ul className="space-y-2">
        {pastes.map((paste) => (
          <li key={paste.id} className="border-b pb-2 flex justify-between items-center">
            <div>
              <Link to={`/paste/${paste.id}`} className="text-slate-400 hover:text-blue-700">
                {paste.title}
              </Link>
              <p className="text-sm text-gray-100">Created: {paste.creationTime}</p>
            </div>
            <button
              onClick={() => handleEdit(paste.id)}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded focus:outline-none focus:shadow-outline"
            >
              Edit
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default UserPastes;