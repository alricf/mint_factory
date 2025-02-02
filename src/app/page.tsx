"use client";
require('dotenv').config();
import './globals.css';
import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { ethers } from 'ethers';
import MINT_FACTORY_ABI from '../abis/MintFactory.json';
import configJSON from '../config.json';

const config: ConfigType = configJSON;

// Components
import Navigation from '@/components/Navigation';
import Create from '@/components/Create';
import Display from '@/components/Display';

// Wallet connection library
import Web3Modal from 'web3modal';

interface MintFactoryConfig {
  mintFactory: {
    address: string;
  };
}

type ConfigType = {
  [chainId: string]: MintFactoryConfig;
};

export default function Home() {
  const [nfts, setNFTs] = useState<{
    name: string;
    description: string;
    files: File[];
    blobURLs: string[];
  }[]>([]);
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<any | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [allData, setAllData] = useState<object[] | null>(null);
  const [totalSupply, setTotalSupply] = useState<number | null>(null);
  const [totalNFTs, setTotalNFTs] = useState<null | number>(null);
  const [chainId, setChainId] = useState<string | null>(null);

  useEffect(() => {
    const read = async () => {
      if (account !== null) {
        // Sending account to server
        const response = await fetch('/api/file/read', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ account, chainId }),
        });
        const data = await response.json();

        // Check if data contains allData
        if (Array.isArray(data)) {
          setAllData(data);
        } else if (data.allData && Array.isArray(data.allData)) {
          setAllData(data.allData);
        } else {
          console.error('Expected an array but received:', data);
        }
      }
    };
    read();
  }, [account, totalSupply, chainId]);

  // Wallet connect handler
  const connectWallet = async () => {
    try {
      const web3Modal = new Web3Modal({
        cacheProvider: false,
        providerOptions: {},
      });

      const instance = await web3Modal.connect(); // MetaMask prompt

      const provider = new ethers.BrowserProvider(instance); // v6
      setProvider(provider);

      // Get the network and chainId
      const network = await provider.getNetwork();
      const chainId = network.chainId.toString();
      setChainId(chainId);

      if (chainId === '31337' || chainId === '84532') {
        const signer = await provider.getSigner();

        const address = await signer.getAddress();
        setAccount(address);

        // Sign a message for proof of intent
        const message = `${address} is minting NFT(s) using Mint Factory`;
        setMessage(message);

        const signature = await signer.signMessage(message);
        setSignature(signature);
      } else {
        window.alert('Unsupported network');
        window.location.reload();
      }

    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  // Wallet disconnect handler
  const disconnectWallet = async () => {
    const web3Modal = new Web3Modal();
    web3Modal.clearCachedProvider();  // Clear cache to disconnect

    // Reset state variables
    setProvider(null);
    setAccount(null);
    setMessage(null);
    setSignature(null);
    setAllData(null);
  };

  const handleChange = (index: number, event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, files } = event.target as HTMLInputElement;
    const newNFTs = [...nfts];

    // Handle file changes
    if (event.target.type === 'file' && files) {
      const filesArray = Array.from(files);

      const newBlobURLs = filesArray.map((file) => URL.createObjectURL(file));

      newNFTs[index] = {
        ...newNFTs[index],
        files: filesArray.length > 0 ? filesArray : [],
        blobURLs: newBlobURLs,
      };
    } else {
      newNFTs[index] = {
        ...newNFTs[index],
        [name]: value,
      };
    }

    setNFTs(newNFTs);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!provider) {
      alert('Please connect your wallet before minting');
      return;
    }

    setTotalNFTs(null);

    try {
      let metadataBaseURIs: string[] = [];

      // Collect promises from asynchronous operations
      const promises = nfts.map(async (nft, index) => {
        const nftFormData = new FormData();

        nftFormData.append('name', nft.name);
        nftFormData.append('description', nft.description);

        nft.files.forEach((file) => {
          nftFormData.append('files[]', file);
        });

        const response = await fetch('/api/file/create', {
          method: 'POST',
          body: nftFormData,
        });

        if (!response.ok) throw new Error(`Server error: ${response.status}`);

        const data = await response.json();

        const baseURIs = data.uploadedMetadataFileBaseURIs.flatMap((uri: string) => {
          return uri;
        });
        return baseURIs;
      });

      setNFTs([]);

      // Wait for all asynchronous operations to complete
      const promisesCollection = await Promise.all(promises);

      metadataBaseURIs = promisesCollection.flat();

      // Get the network and chainId
      const network = await provider.getNetwork();
      const chainId = network.chainId.toString();
      setChainId(chainId);

      if (chainId === '31337' || chainId === '84532') {
        const signer2 = await provider.getSigner();
        const mintFactory = new ethers.Contract(
          config[chainId].mintFactory.address,
          MINT_FACTORY_ABI,
          signer2
        );

        let totalSupply = await mintFactory.totalSupply();
        setTotalSupply(totalSupply);

        // Send the minting transaction
        const tx = await mintFactory.mint(metadataBaseURIs.length, metadataBaseURIs, {
          value: ethers.parseUnits(metadataBaseURIs.length.toString(), 'wei'),
        });
        await tx.wait();

        totalSupply = await mintFactory.totalSupply();
        setTotalSupply(totalSupply);
      } else {
        window.alert('Unsupported network');
        window.location.reload();
      }

    } catch (error) {
      console.error('Error sending files to server:', error);
    }
  };

  const addNFT = (newNFT: { name: string; description: string; files: File[]; blobURLs: string[]; }) => {
    setNFTs([...nfts, newNFT]);
  };

  return (
    <>
      <Navigation
        account={account}
        connectHandler={connectWallet}
        disconnectHandler={disconnectWallet}
      />

      {
        signature ?
          <>
            <Create
              handleSubmit={handleSubmit}
              handleChange={handleChange}
              nfts={nfts}
              addNFT={addNFT}
              removeNFT={(index) => setNFTs(nfts.filter((_, i) => i !== index))}
              allData={allData}
              account={account}
              signature={signature}
              totalNFTs={totalNFTs}
              setTotalNFTs={setTotalNFTs}
            />
            <Display allData={allData} />
          </>
          :
          (
            <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-r from-[#2BFDB9] to-[#1DE9B6] px-6">
              <div className="max-w-5xl text-center bg-white rounded-xl shadow-lg p-8 my-20">
                <h1 className="text-5xl md:text-6xl font-extrabold text-[#FD2B6A] mb-6">
                  Welcome to Mint Factory
                </h1>

                {/* Video Section */}
                <div className="relative overflow-hidden rounded-lg shadow-md mb-8">
                  <video
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                  >
                    <source src="/assets/videos/local-demo.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  <p className="text-black py-2 text-center font-bold">
                    Local Hardhat Demo
                  </p>
                </div>

                {/* Content Section */}
                <p className="text-lg md:text-xl text-gray-700 leading-7 mb-4">
                  Mint Factory is your gateway to effortless NFT creation and ownership verification. This decentralized application (dApp) empowers anyone to mint NFTs (Non-Fungible Tokens) directly to their wallet, ensuring secure ownership and authenticity.
                </p>
                <p className="text-lg md:text-xl text-gray-700 leading-7 mb-4">
                  Your NFTs are stored on the decentralized IPFS (InterPlanetary File System) via Pinata, offering unparalleled security and accessibility.
                </p>
                <p className="text-lg md:text-xl text-gray-700 leading-7 mb-6">
                  Whether you’re building a digital art collection or need bulk NFT creation, Mint Factory makes it seamless. Provide a name and description for your NFTs—customize each one or use a unified approach for all.
                </p>
                <p className="text-lg md:text-xl text-black font-semibold mb-8">
                  Base Sepolia Contract Address:&nbsp;
                  <a
                    href="https://sepolia.basescan.org/address/0x5d4c097196e448ee7983332da8c0660d7ddafde1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline font-medium"
                  >
                    0x5d4c097196E448eE7983332da8C0660D7DDAFDe1
                  </a>
                </p>
                <p className="text-xl md:text-2xl text-[#FD2B6A] font-semibold mb-8">
                  Connect your wallet to start minting today!
                </p>
                <a
                  href={'https://github.com/alricf/mint_factory'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-3 py-3 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                    className="w-8 h-8"
                  >
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.56 7.56 0 0 1 4.01 0c1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
                  </svg>
                  <span>alricf/mint_factory</span>
                </a>
              </div>
            </div>
          )
      }
    </>
  );
};
