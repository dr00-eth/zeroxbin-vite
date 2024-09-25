# 0xBin: Decentralized Pastebin Alternative

0xBin is a decentralized version of Pastebin built on EVM-compatible blockchains. It allows users to create, share, and access text snippets (called "pastes") with the power of blockchain technology, ensuring censorship resistance and permanent storage.

## Features

- Create public, private, or paid pastes
- Decentralized storage on the blockchain
- End-to-end encryption for private and paid pastes
- Pay-to-access functionality for monetizing content
- Tipping system for supporting paste creators
- Fully responsive web interface

## Technology Stack

- Smart Contracts: Solidity
- Frontend: React.js
- Web3 Integration: ethers.js
- Wallet Connection: Web3-Onboard
- Styling: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- MetaMask or another Web3 wallet

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/0xbin.git
   cd 0xbin
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the project root from `.env.example` and add your environment variables:

4. Start the development server:
   ```
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser to view the app.

## Smart Contract

The 0xBin smart contract is deployed & verified on the Arbitrum Sepolia testnet.

## Usage

1. Connect your Web3 wallet to the app.
2. To create a paste, click on "Create Paste" and fill in the required information.
3. To view a paste, go to the paste URL or find it in the "Explore Pastes" section.
4. For paid pastes, you'll need to pay the specified amount to access the content.
5. For private pastes, you'll need to sign a message with your wallet to prove ownership of the allowed address.

## Contributing

We welcome contributions to 0xBin! Please feel free to submit issues, create pull requests, or fork the repository to make your own changes.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a pull request

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## Contact

dr00.eth - [@dr00shie](https://twitter.com/dr00shie) - andrewmeyer23@gmail.com

Project Link: [https://github.com/dr00-eth/zeroxbin-vite](https://github.com/dr00-eth/zeroxbin-vite)

## Acknowledgements

- [OpenZeppelin](https://openzeppelin.com/) for secure smart contract components
- [Arbitrum](https://arbitrum.io/) for providing a scalable Ethereum Layer 2 solution
- [ethers.js](https://docs.ethers.io/v5/) for Ethereum wallet integration
- [Web3-Onboard](https://onboard.blocknative.com/) for multi-wallet support
- [React](https://reactjs.org/) for the frontend framework
- [Tailwind CSS](https://tailwindcss.com/) for styling