import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { getContractAddress, getContractABI, isNetworkSupported, getNetworkName } from '../contracts/config';
import { NETWORKS } from '../config';
import { decryptContent, deriveDecryptionKey, verifySignature, generateMessageToSign } from '../utils/CryptoUtils';
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
  const [encryptedContent, setEncryptedContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [networkInitialized, setNetworkInitialized] = useState(false);

  const initContract = useCallback(async () => {
    if (!selectedNetwork) {
      console.log('Network not yet initialized');
      return null;
    }

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
      const contractABI = getContractABI(networkId);
      
      console.log(`Initializing contract for network ${networkId}`);
      console.log('Contract ABI:', contractABI);
      
      let contractInstance;
      if (wallet && provider) {
        const signer = await provider.getSigner();
        contractInstance = new ethers.Contract(contractAddress, contractABI, signer);
      } else {
        contractInstance = new ethers.Contract(contractAddress, contractABI, contractProvider);
      }

      setContract(contractInstance);
      return contractInstance;
    } catch (err) {
      console.error('Error initializing contract:', err);
      setError(`Error initializing contract: ${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [wallet, provider, connectedChain, selectedNetwork]);

  const fetchPasteData = useCallback(async (contractInstance) => {
    if (!contractInstance || !pasteId) {
      return;
    }
  
    setLoading(true);
    setError(null);
  
    try {
      // First, fetch basic paste info to determine the paste type and total versions
      const basicInfo = await contractInstance.pastes(BigInt(pasteId));
      const pasteType = ['Public', 'Paid', 'Private'][Number(basicInfo.pasteType)];
      const totalVersions = Number(basicInfo.currentVersion);

      // If selectedVersion is not set or is greater than totalVersions, use the latest version
      const versionToFetch = selectedVersion && selectedVersion <= totalVersions ? selectedVersion : totalVersions;

      let result;
      if (pasteType !== 'Public' && wallet && provider) {
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        const message = generateMessageToSign(pasteId, address);
        const signature = await signer.signMessage(ethers.getBytes(message));
        result = await contractInstance.getPasteWithSignature(BigInt(pasteId), signature);
      } else {
        result = await contractInstance.getPaste(BigInt(pasteId), BigInt(versionToFetch));
      }

      const [pasteInfo, content, hasAccess] = result;

      const formattedInfo = {
        id: pasteId,
        creator: pasteInfo.creator,
        title: pasteInfo.title,
        creationTime: new Date(Number(pasteInfo.creationTime) * 1000).toLocaleString(),
        expirationTime: Number(pasteInfo.expirationTime) === 0 ? 'Never' : new Date(Number(pasteInfo.expirationTime) * 1000).toLocaleString(),
        pasteType: pasteType,
        price: ethers.formatEther(pasteInfo.price),
        publicKey: pasteInfo.publicKey,
        currentVersion: totalVersions,
      };

      setPasteInfo(formattedInfo);
      setVersions(Array.from({ length: totalVersions }, (_, i) => i + 1));
      setSelectedVersion(versionToFetch);

      setHasAccess(hasAccess);
      if (hasAccess) {
        if (formattedInfo.pasteType === 'Public') {
          setPasteContent(ethers.toUtf8String(content));
          setEncryptedContent(null);
        } else {
          setEncryptedContent(content);
          setPasteContent(null);
        }
      } else {
        setEncryptedContent(null);
        setPasteContent(null);
      }

      if (wallet && wallet.accounts[0].address.toLowerCase() === formattedInfo.creator.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (err) {
      console.error('Error fetching paste data:', err);
      setError('Error fetching paste data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [pasteId, selectedVersion, wallet, provider]);

  useEffect(() => {
    const initializeNetwork = () => {
      if (connectedChain && isNetworkSupported(connectedChain.id)) {
        setSelectedNetwork(connectedChain.id);
      } else if (urlNetwork && isNetworkSupported(urlNetwork)) {
        setSelectedNetwork(urlNetwork);
      } else {
        setSelectedNetwork(Object.values(NETWORKS)[0].id);
      }
      setNetworkInitialized(true);
    };
  
    initializeNetwork();
  }, [connectedChain, urlNetwork]);

  useEffect(() => {
    const loadPaste = async () => {
      if (selectedNetwork) {
        const contractInstance = await initContract();
        if (contractInstance) {
          await fetchPasteData(contractInstance);
        }
      }
    };
  
    loadPaste();
  }, [initContract, fetchPasteData, selectedNetwork]); 

  const handleVersionChange = (event) => {
    const newVersion = Number(event.target.value);
    setSelectedVersion(newVersion);
  };

  useEffect(() => {
    if (contract) {
      fetchPasteData(contract);
    }
  }, [fetchPasteData, contract, selectedVersion]);

  const handleAccessGranted = async (signature) => {
    try {
      if (!pasteInfo || !encryptedContent) {
        throw new Error('Paste information or encrypted content is missing');
      }

      if (!wallet || !provider) {
        throw new Error('Wallet not connected');
      }

      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const message = generateMessageToSign(pasteId, address);

      if (!verifySignature(message, signature, address)) {
        throw new Error('Invalid signature');
      }

      const decryptionKey = await deriveDecryptionKey(pasteInfo.publicKey, signature);

      const decryptedContent = await decryptContent(encryptedContent, pasteInfo.publicKey, signature);

      setPasteContent(decryptedContent);
      setEncryptedContent(null);
      setHasAccess(true);
    } catch (err) {
      console.error('Error handling access granted:', err);
      setError('Error handling access granted: ' + err.message);
    }
  };

  const handleDecrypt = async () => {
    try {
      if (!wallet || !provider) {
        throw new Error('Wallet not connected');
      }

      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const message = generateMessageToSign(pasteId, address);
      const signature = await signer.signMessage(ethers.getBytes(message));

      await handleAccessGranted(signature);
    } catch (err) {
      console.error('Error decrypting content:', err);
      setError('Error decrypting content: ' + err.message);
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
  if (!networkInitialized) {
    return <div className="text-center">Initializing network...</div>;
  }
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
      {versions.length > 1 && (
        <div className="mb-4">
          <label htmlFor="version-select" className="block text-sm font-medium text-gray-700">
            Select Version:
          </label>
          <select
            id="version-select"
            value={selectedVersion || ''}
            onChange={handleVersionChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            {versions.map((version) => (
              <option key={version} value={version}>
                Version {version}
              </option>
            ))}
          </select>
        </div>
      )}
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
              }
            }}
          >
            {pasteContent}
          </ReactMarkdown>
        </div>
      ) : hasAccess && encryptedContent ? (
        <div>
          <p>You have access to this paste. Click the button below to decrypt and view the content.</p>
          <button
            onClick={handleDecrypt}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Decrypt and View Content
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
      {wallet && pasteInfo.creator !== wallet.accounts[0].address && (
        <TipCreator pasteId={pasteId} creator={pasteInfo.creator} />
      )}
    </div>
  );
}

export default ViewPaste;