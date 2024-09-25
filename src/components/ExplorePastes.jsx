import React, { useState, useEffect } from 'react';
import { useConnectWallet } from '@web3-onboard/react';
import { ethers } from 'ethers';
import { Link } from 'react-router-dom';
import { contractAddress, contractABI } from '../contracts/config';

function ExplorePastes() {
  const [{ wallet }] = useConnectWallet();
  const [contract, setContract] = useState(null);
  const [pastes, setPastes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const initContract = async () => {
      if (wallet?.provider) {
        const provider = new ethers.BrowserProvider(wallet.provider);
        const signer = await provider.getSigner();
        const contractInstance = new ethers.Contract(contractAddress, contractABI, signer);
        setContract(contractInstance);
      }
    };

    initContract();
  }, [wallet]);

  useEffect(() => {
    if (contract) {
      fetchPastes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract, currentPage, pageSize, searchTerm]);

  const fetchPastes = async () => {
    setLoading(true);
    try {
      const offset = (currentPage - 1) * pageSize;
      const pastesData = await contract.getPublicPastes(offset, pageSize * 2); // Fetch double to account for potential expired pastes

      const currentTimestamp = Math.floor(Date.now() / 1000);
      const formattedPastes = pastesData
        .filter(
          paste =>
            Number(paste.expirationTime) === 0 ||
            Number(paste.expirationTime) > currentTimestamp
        )
        .map(paste => ({
          id: paste.id.toString(),
          title: paste.title,
          creator: paste.creator,
          creationTime: new Date(Number(paste.creationTime) * 1000).toLocaleString(),
          expirationTime:
            Number(paste.expirationTime) === 0
              ? 'Never'
              : new Date(Number(paste.expirationTime) * 1000).toLocaleString(),
          pasteType: ['Public', 'Paid', 'Private'][Number(paste.pasteType)],
          price: ethers.formatEther(paste.price),
        }));

      // Filter pastes based on search term
      const filteredPastes = formattedPastes.filter(
        paste =>
          paste.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          paste.creator.toLowerCase().includes(searchTerm.toLowerCase())
      );

      setPastes(filteredPastes.slice(0, pageSize));
      setHasMore(filteredPastes.length > pageSize);
      setError(null); // Reset error state if successful
    } catch (err) {
      console.error('Error fetching pastes:', err);
      setError('Error fetching pastes: ' + err.message);
    }
    setLoading(false);
  };

  const handlePageChange = newPage => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = event => {
    setPageSize(Number(event.target.value));
    setCurrentPage(1);
  };

  const handleSearchChange = event => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const getExpirationStatus = expirationTime => {
    if (expirationTime === 'Never') return 'Never expires';
    const expirationDate = new Date(expirationTime);
    const now = new Date();
    const daysUntilExpiration = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiration > 30) {
      return `Expires on ${expirationTime}`;
    } else if (daysUntilExpiration > 0) {
      return `Expires in ${daysUntilExpiration} day${daysUntilExpiration === 1 ? '' : 's'}`;
    } else {
      return 'Expired';
    }
  };

  if (!wallet)
    return <div className="text-center">Please connect your wallet to explore pastes.</div>;

  return (
    <div className="container mx-auto px-4">
      <h2 className="text-2xl font-bold mb-4">Explore Pastes</h2>
      <div className="mb-4 flex justify-between items-center">
        <input
          type="text"
          placeholder="Search pastes..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="p-2 border rounded"
        />
        <select
          value={pageSize}
          onChange={handlePageSizeChange}
          className="p-2 border rounded"
        >
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
      </div>
      {error && <div className="text-red-500 text-center">{error}</div>}
      {loading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <>
          {pastes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastes.map(paste => (
                <Link
                  to={`/paste/${paste.id}`}
                  key={paste.id}
                  className="block p-4 border rounded hover:shadow-lg transition-shadow"
                >
                  <h3 className="text-xl font-semibold mb-2">{paste.title}</h3>
                  <p className="text-sm text-gray-300">
                    Created by: {paste.creator.slice(0, 6)}...{paste.creator.slice(-4)}
                  </p>
                  <p className="text-sm text-gray-300">Created at: {paste.creationTime}</p>
                  <p
                    className="text-sm font-medium"
                    style={{ color: paste.expirationTime === 'Never' ? 'green' : 'orange' }}
                  >
                    {getExpirationStatus(paste.expirationTime)}
                  </p>
                  <p className="text-sm text-gray-300">
                    Type: {paste.pasteType}
                    {paste.pasteType === 'Paid' && ` (${paste.price} ETH)`}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center">No pastes found.</div>
          )}
          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-600"
            >
              Previous
            </button>
            <span>Page {currentPage}</span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!hasMore}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-600"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ExplorePastes;
