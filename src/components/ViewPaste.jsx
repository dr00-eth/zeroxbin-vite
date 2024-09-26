import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { getContractAddress, contractABI, isNetworkSupported, getNetworkName } from '../contracts/config';
import { NETWORKS } from '../config';
import { decryptContent } from '../utils/CryptoUtils';
import AccessPaste from './AccessPaste';
import TipCreator from './TipCreator';
import styles from '../styles/MarkdownStyles.module.css';
import { useWallet } from '../hooks/useWallet';

function ViewPaste() {
  const { id: pasteId, network: urlNetwork } = useParams();
  const navigate = useNavigate();
  const { wallet, provider, connectedChain, connectWallet } = useWallet();
  const [contract, setContract] = useState(null);
  const [pasteInfo, setPasteInfo] = useState(null);
  const [pasteContent, setPasteContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState(urlNetwork || Object.values(NETWORKS)[0].id);

  useEffect(() => {
    initContract();
  }, [provider, connectedChain, selectedNetwork]);

  const initContract = async () => {
    setLoading(true);
    setError(null);
    let contractProvider;
    let networkId = selectedNetwork;

    try {
      if (wallet && provider && connectedChain && isNetworkSupported(connectedChain.id)) {
        contractProvider = provider;
        networkId = connectedChain.id;
      } else {
        const network = Object.values(NETWORKS).find(net => net.id === networkId);
        if (!network) {
          throw new Error(`Unsupported network ID: ${networkId}`);
        }
        contractProvider = new ethers.JsonRpcProvider(network.rpcUrl);
      }

      const contractAddress = getContractAddress(networkId);
      const contractInstance = new ethers.Contract(contractAddress, contractABI, contractProvider);
      setContract(contractInstance);
      await fetchPasteData(contractInstance);
    } catch (err) {
      console.error('Error initializing contract:', err);
      setError(`Error initializing contract: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchPasteData = async (contractInstance) => {
    if (!contractInstance || !pasteId) {
      return;
    }

    try {
      const pasteData = await contractInstance.getPasteInfo(pasteId);
      
      const formattedInfo = {
        id: pasteId,
        creator: pasteData.creator,
        title: pasteData.title,
        creationTime: new Date(Number(pasteData.creationTime) * 1000).toLocaleString(),
        expirationTime: Number(pasteData.expirationTime) === 0 ? 'Never' : new Date(Number(pasteData.expirationTime) * 1000).toLocaleString(),
        pasteType: ['Public', 'Paid', 'Private'][Number(pasteData.pasteType)],
        price: ethers.formatEther(pasteData.price),
        publicKey: pasteData.publicKey,
      };

      setPasteInfo(formattedInfo);

      if (formattedInfo.pasteType === 'Public') {
        const content = await fetchPasteContent(contractInstance, formattedInfo.pasteType);
        setPasteContent(content);
        setHasAccess(true);
      } else {
        setHasAccess(false);
      }

      if (wallet && wallet.accounts[0].address.toLowerCase() === formattedInfo.creator.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (err) {
      console.error('Error fetching paste data:', err);
      setError('Error fetching paste data: ' + err.message);
    }
  };

  const fetchPasteContent = async (contractInstance, pasteType) => {
    if (!contractInstance || !pasteId) return null;

    try {
      let pasteData;
      if (pasteType === 'Public') {
        pasteData = await contractInstance.getPublicPaste(pasteId);
      } else {
        if (!wallet) {
          throw new Error('Wallet connection required for non-public pastes');
        }
        pasteData = await contractInstance.getPrivatePaste(pasteId);
      }
      
      let content = ethers.toUtf8String(pasteData.content);
      
      if (pasteType !== 'Public') {
        content = await decryptContent(content, pasteData.publicKey);
      }
      
      return content;
    } catch (err) {
      console.error('Error fetching paste content:', err);
      throw new Error('Error fetching paste content: ' + err.message);
    }
  };

  const handleAccessGranted = async () => {
    try {
      const content = await fetchPasteContent(contract, pasteInfo.pasteType);
      setPasteContent(content);
      setHasAccess(true);
    } catch (err) {
      console.error('Error handling access granted:', err);
      setError('Error handling access granted: ' + err.message);
    }
  };

  const handleEdit = () => {
    navigate(`/edit-paste/${pasteId}`);
  };

  const handleNetworkChange = (event) => {
    const newNetwork = event.target.value;
    setSelectedNetwork(newNetwork);
    navigate(`/paste/${newNetwork}/${pasteId}`);
  };

  if (loading) return <div className="text-center">Loading...</div>;
  if (error) {
    return (
      <div className="text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <select
          value={selectedNetwork}
          onChange={handleNetworkChange}
          className="bg-gray-700 text-white rounded p-2"
        >
          {Object.values(NETWORKS).map((network) => (
            <option key={network.id} value={network.id}>
              {network.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
  if (!pasteInfo) return <div className="text-center">No paste found</div>;

  return (
    <div className="shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <h2 className="text-2xl font-bold mb-4">{pasteInfo.title}</h2>
      {wallet && connectedChain ? (
        <p className="mb-4">Current network: {getNetworkName(connectedChain.id)}</p>
      ) : (
        <div className="mb-4">
          <label htmlFor="network-select" className="mr-2">Select network:</label>
          <select
            id="network-select"
            value={selectedNetwork}
            onChange={handleNetworkChange}
            className="p-2 border rounded"
          >
            {Object.values(NETWORKS).map((network) => (
              <option key={network.id} value={network.id}>
                {network.label}
              </option>
            ))}
          </select>
        </div>
      )}
      {isOwner && (
        <button
          onClick={handleEdit}
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mb-4"
        >
          Manage Paste
        </button>
      )}
      <div className="mb-4">
        <p className="text-sm text-gray-300">Created by: {pasteInfo.creator}</p>
        <p className="text-sm text-gray-300">Created at: {pasteInfo.creationTime}</p>
        <p className="text-sm text-gray-300">Expires: {pasteInfo.expirationTime}</p>
        <p className="text-sm text-gray-300">Type: {pasteInfo.pasteType}</p>
        {pasteInfo.pasteType !== 'Public' && <p className="text-sm text-gray-600">Price: {pasteInfo.price} ETH</p>}
      </div>
      {hasAccess && pasteContent ? (
        <div className={`bg-gray-100 p-4 rounded overflow-x-auto mb-4 ${styles['markdown-body']}`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({node, inline, className, children, ...props}) {
                const match = /language-(\w+)/.exec(className || '')
                return !inline && match ? (
                  <SyntaxHighlighter
                    language={match[1]}
                    PreTag="div"
                    {...props}
                    style={vscDarkPlus}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                )
              },
              table({node, ...props}) {
                return (
                  <table className="border-collapse table-auto w-full text-sm" {...props} />
                )
              },
              th({node, ...props}) {
                return (
                  <th className="border-b dark:border-slate-600 font-medium p-4 pl-8 pt-0 pb-3 text-slate-400 dark:text-slate-200 text-left" {...props} />
                )
              },
              td({node, ...props}) {
                return (
                  <td className="border-b border-slate-100 dark:border-slate-700 p-4 pl-8 text-slate-500 dark:text-slate-400" {...props} />
                )
              }
            }}
          >
            {pasteContent}
          </ReactMarkdown>
        </div>
      ) : (
        <>
          {pasteInfo.pasteType !== 'Public' && !wallet ? (
            <div className="mb-4">
              <p>This paste requires wallet connection to access.</p>
              <button
                onClick={connectWallet}
                className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Connect Wallet
              </button>
            </div>
          ) : (
            <AccessPaste
              contract={contract}
              pasteId={pasteId}
              pasteType={pasteInfo.pasteType}
              price={pasteInfo.price}
              publicKey={pasteInfo.publicKey}
              onAccessGranted={handleAccessGranted}
            />
          )}
        </>
      )}
      {wallet && pasteInfo.creator !== wallet.accounts[0].address && (
        <TipCreator pasteId={pasteId} creator={pasteInfo.creator} />
      )}
    </div>
  );
}

export default ViewPaste;