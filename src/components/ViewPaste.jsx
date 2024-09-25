import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useConnectWallet } from '@web3-onboard/react';
import { ethers } from 'ethers';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { contractAddress, contractABI } from '../contracts/config';
import { decryptContent } from '../utils/CryptoUtils';
import AccessPaste from './AccessPaste';
import TipCreator from './TipCreator';
import styles from '../styles/MarkdownStyles.module.css';

function ViewPaste() {
  const { id: pasteId } = useParams();
  const [{ wallet }] = useConnectWallet();
  const [contract, setContract] = useState(null);
  const [pasteInfo, setPasteInfo] = useState(null);
  const [pasteContent, setPasteContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);

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
      }
    };

    initContract();
  }, [wallet]);

  useEffect(() => {
    const fetchPasteInfo = async () => {
      if (!contract || !pasteId || !wallet) {
        setLoading(false);
        return;
      }

      try {
        const pasteData = await contract.getPasteInfo(pasteId);
        
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
          await fetchPasteContent();
        } else {
          setHasAccess(false);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching paste info:', err);
        setError('Error fetching paste info: ' + err.message);
        setLoading(false);
      }
    };

    fetchPasteInfo();
  }, [contract, pasteId, wallet]);

  const fetchPasteContent = async () => {
    if (!contract || !pasteId || !pasteInfo) return;

    try {
      let pasteData;
      if (pasteInfo.pasteType === 'Public') {
        pasteData = await contract.getPublicPaste(pasteId);
      } else {
        pasteData = await contract.getPrivatePaste(pasteId);
      }
      
      let content = ethers.toUtf8String(pasteData.content);
      
      if (pasteInfo.pasteType !== 'Public') {
        content = await decryptContent(content, pasteData.publicKey);
      }
      
      setPasteContent(content);
      setHasAccess(true);
    } catch (err) {
      console.error('Error fetching paste content:', err);
      setError('Error fetching paste content: ' + err.message);
    }
  };

  const handleAccessGranted = async (decryptionKey) => {
    try {
      await fetchPasteContent();
    } catch (err) {
      console.error('Error handling access granted:', err);
      setError('Error handling access granted: ' + err.message);
    }
  };

  if (!wallet) return <div className="text-center">Please connect your wallet to view this paste.</div>;
  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;
  if (!pasteInfo) return <div className="text-center">No paste found</div>;

  return (
    <div className="shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <h2 className="text-2xl font-bold mb-4">{pasteInfo.title}</h2>
      <div className="mb-4">
        <p className="text-sm text-gray-300">Created by: {pasteInfo.creator}</p>
        <p className="text-sm text-gray-300">Created at: {pasteInfo.creationTime}</p>
        <p className="text-sm text-gray-300">Expires: {pasteInfo.expirationTime}</p>
        <p className="text-sm text-gray-300">Type: {pasteInfo.pasteType}</p>
        {pasteInfo.pasteType !== 'Public' && <p className="text-sm text-gray-600">Price: {pasteInfo.price} ETH</p>}
      </div>
      {hasAccess ? (
        <div className={`bg-gray-100 p-4 rounded overflow-x-auto mb-4 ${styles['markdown-body']}`}>
          <ReactMarkdown
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
      <TipCreator pasteId={pasteId} creator={pasteInfo.creator} />
    </div>
  );
}

export default ViewPaste;