import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useConnectWallet } from '@web3-onboard/react';
import { ethers } from 'ethers';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { contractAddress, contractABI } from '../contracts/config';
import { decryptContent, deriveDecryptionKey } from '../utils/CryptoUtils';
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
        const info = await contract.getPasteInfo(pasteId);
        
        const formattedInfo = {
          id: pasteId,
          creator: info.creator,
          title: info.title,
          creationTime: new Date(Number(info.creationTime) * 1000).toLocaleString(),
          expirationTime: Number(info.expirationTime) === 0 ? 'Never' : new Date(Number(info.expirationTime) * 1000).toLocaleString(),
          pasteType: ['Public', 'Paid', 'Private'][Number(info.pasteType)],
          price: ethers.formatEther(info.price),
          publicKey: info.publicKey,
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

  const fetchPasteContent = async (signature) => {
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
        if (!signature) {
          throw new Error('Signature required for non-public pastes');
        }
        const decryptionKey = await deriveDecryptionKey(pasteInfo.publicKey, signature);
        content = await decryptContent(content, decryptionKey);
      }
      
      setPasteContent(content);
      setHasAccess(true);
    } catch (err) {
      console.error('Error fetching paste content:', err);
      if (err.code === 'CALL_EXCEPTION') {
        setError('You do not have access to this paste.');
      } else {
        setError('Error fetching paste content: ' + err.message);
      }
    }
  };

  const handleAccessPaste = async () => {
    setLoading(true);
    try {
      if (pasteInfo.pasteType === 'Paid') {
        const tx = await contract.accessPaste(pasteId, { value: ethers.parseEther(pasteInfo.price) });
        await tx.wait();
      }
      
      const provider = new ethers.BrowserProvider(wallet.provider);
      const signer = await provider.getSigner();
      const message = ethers.solidityPackedKeccak256(["uint256", "address"], [pasteId, await signer.getAddress()]);
      const signature = await signer.signMessage(ethers.getBytes(message));
      
      await fetchPasteContent(signature);
    } catch (err) {
      console.error('Error accessing paste:', err);
      if (err.code === 'CALL_EXCEPTION') {
        setError('You do not have access to this paste.');
      } else {
        setError('Error accessing paste: ' + err.message);
      }
    }
    setLoading(false);
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
        <div className="mb-4">
          <p>This paste is {pasteInfo.pasteType.toLowerCase()}. You need to access it first.</p>
          <button
            onClick={handleAccessPaste}
            className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            {pasteInfo.pasteType === 'Paid' ? `Pay ${pasteInfo.price} ETH to Access` : 'Access Paste'}
          </button>
        </div>
      )}
    </div>
  );
}

export default ViewPaste;