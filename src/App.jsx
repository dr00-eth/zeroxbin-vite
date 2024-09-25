import React from 'react';
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

function App() {
  return (
    <Web3OnboardProvider web3Onboard={web3Onboard}>
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
                </div>
              </div>
            </div>
          </nav>

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
    </Web3OnboardProvider>
  );
}

export default App;