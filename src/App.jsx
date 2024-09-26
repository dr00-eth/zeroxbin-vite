import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { Web3OnboardProvider } from '@web3-onboard/react';
import logo from './assets/0xbin-logo.png';

import Home from './components/Home';
import CreatePaste from './components/CreatePaste';
import ViewPaste from './components/ViewPaste';
import UserPastes from './components/UserPastes';
import ConnectWallet from './components/ConnectWallet';
import ExplorePastes from './components/ExplorePastes';

import { web3Onboard } from './config';
import { useWallet } from './hooks/useWallet';
import { CHAIN_NAME } from './config';

function AppContent() {
  const { wallet, chainCorrect, connectWallet, switchNetwork } = useWallet();

  useEffect(() => {
    if (wallet && !chainCorrect) {
      switchNetwork();
    }
  }, [wallet, chainCorrect, switchNetwork]);

  return (
    <Router>
      <div className="min-h-screen bg-gray-900">
        <nav className="bg-gray-800 shadow-lg">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-7">
                <Link to="/" className="flex items-center">
                  <img src={logo} alt="0xBin Logo" className="h-10 w-auto mr-2" />
                  <span className="font-semibold text-2xl text-cyan-400">0xBin</span>
                </Link>
                <div className="hidden md:flex items-center space-x-1">
                  <Link to="/" className="py-4 px-2 text-cyan-300 hover:text-cyan-500 transition duration-300">Home</Link>
                  <Link to="/create" className="py-4 px-2 text-cyan-300 hover:text-cyan-500 transition duration-300">Create Paste</Link>
                  <Link to="/my-pastes" className="py-4 px-2 text-cyan-300 hover:text-cyan-500 transition duration-300">My Pastes</Link>
                  <Link to="/explore" className="py-4 px-2 text-cyan-300 hover:text-cyan-500 transition duration-300">Explore Pastes</Link>
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-3">
                <ConnectWallet />
                {wallet && !chainCorrect && (
                  <button
                    onClick={switchNetwork}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded"
                  >
                    Switch to {CHAIN_NAME}
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>

        {wallet && !chainCorrect && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
            <p className="font-bold">Wrong Network</p>
            <p>Please switch to the {CHAIN_NAME} network to use 0xBin.</p>
          </div>
        )}

        <div className="container mx-auto mt-8 px-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreatePaste />} />
            <Route path="/explore" element={<ExplorePastes />} />
            <Route path="/my-pastes" element={<UserPastes />} />
            <Route path="/paste/:id" element={<ViewPaste />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

function App() {
  return (
    <Web3OnboardProvider web3Onboard={web3Onboard}>
      <AppContent />
    </Web3OnboardProvider>
  );
}

export default App;