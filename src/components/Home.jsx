import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, DollarSign, Lock, Shield } from 'lucide-react';

const FeatureItem = ({ icon, text }) => (
  <li className="flex items-center mb-2">
    {icon}
    <span className="ml-2">{text}</span>
  </li>
);

export default function Home() {
  return (
    <div className="flex flex-col flex-grow bg-gray-900 text-white">
      <div className="flex-grow flex items-center justify-center">
        <div className="max-w-4xl w-full px-4 py-8">
          <h1 className="text-5xl font-bold mb-6 text-center text-cyan-400">Welcome to 0xBin</h1>
          <p className="text-xl mb-10 text-center">
            0xBin is a decentralized pastebin service built with EVM. Create, share, and access
            pastes with the power of blockchain technology.
          </p>
          <div className="bg-gray-800 rounded-lg p-8 mb-10 shadow-lg">
            <h2 className="text-3xl font-semibold mb-6 text-center text-cyan-300">Features:</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <ul className="space-y-4">
                <FeatureItem icon={<FileText className="text-cyan-400" />} text="Create public, paid, and private pastes" />
                <FeatureItem icon={<DollarSign className="text-cyan-400" />} text="Set access prices/addresses for your pastes" />
              </ul>
              <ul className="space-y-4">
                <FeatureItem icon={<Lock className="text-cyan-400" />} text="Tip paste creators" />
                <FeatureItem icon={<Shield className="text-cyan-400" />} text="Fully decentralized and censorship-resistant" />
              </ul>
            </div>
          </div>
          <div className="flex justify-center space-x-4">
            <Link
              to="/explore"
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg"
            >
              Explore Pastes
            </Link>
            <Link
              to="/create"
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg"
            >
              Create Paste
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}