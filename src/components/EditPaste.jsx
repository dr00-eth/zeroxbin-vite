import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useConnectWallet } from '@web3-onboard/react';
import { ethers } from 'ethers';
import MDEditor from '@uiw/react-md-editor';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import Swal from 'sweetalert2';
import { contractAddress, contractABI } from '../contracts/config';
import { encryptContent } from '../utils/CryptoUtils';

function EditPaste() {
  const { id: pasteId } = useParams();
  const navigate = useNavigate();
  const [{ wallet }] = useConnectWallet();
  const [contract, setContract] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pasteType, setPasteType] = useState('');
  const [expirationDate, setExpirationDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
    const fetchPasteData = async () => {
      if (!contract || !pasteId) return;

      try {
        const pasteData = await contract.getPaste(pasteId);
        setTitle(pasteData.title);
        setContent(ethers.toUtf8String(pasteData.content));
        setPasteType(['Public', 'Paid', 'Private'][Number(pasteData.pasteType)]);
        setExpirationDate(pasteData.expirationTime > 0 ? new Date(Number(pasteData.expirationTime) * 1000) : null);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching paste data:', err);
        setError('Error fetching paste data: ' + err.message);
        setLoading(false);
      }
    };

    fetchPasteData();
  }, [contract, pasteId]);

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
      let finalContent = content;
      if (pasteType !== 'Public') {
        finalContent = await encryptContent(content, pasteInfo.publicKey);
      }

      const tx = await contract.updatePaste(pasteId, ethers.toUtf8Bytes(finalContent));
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
      setError('Wallet not connected. Please connect your wallet.');
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

  if (!wallet) return <div className="text-center">Please connect your wallet to edit this paste.</div>;
  if (loading) return <div className="text-center">Loading paste data...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

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
            value={title + ` (Cannot Edit)`}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Paste Title"
            required
            disabled
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
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-white-700 leading-tight focus:outline-none focus:shadow-outline"
            id="pasteType"
            type="text"
            value={pasteType + ` (Cannot Edit)`}
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
            placeholderText={expirationDate ? expirationDate.toLocaleString() : "Cannot Edit"}
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