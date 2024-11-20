"use client";
require('dotenv').config();
import './globals.css';
import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { ethers } from 'ethers';
import MINT_FACTORY_ABI from '../abis/MintFactory.json';
import config from '../config.json';

// Components
import Navigation from '@/components/Navigation';
import Create from '@/components/Create';
import Display from '@/components/Display';

// Wallet connection library
import Web3Modal from 'web3modal';

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

  const read = async () => {
    if (account !== null) {
      // Sending account to server
      const response = await fetch('/api/file/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ account }),
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

  useEffect(() => {
    read();
  }, [account, totalSupply]);

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

      const signer = await provider.getSigner();

      const address = await signer.getAddress();
      setAccount(address);

      // Sign a message for proof of intent
      const message = `${address} is minting NFT(s) using Mint Factory`;
      setMessage(message);

      const signature = await signer.signMessage(message);
      setSignature(signature);

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
        console.log(data, 'dataFE');
        console.log(data.uploadedMetadataFileBaseURI, 'data.uploadedMetadataFileBaseURI');

        const baseURIs = data.uploadedMetadataFileBaseURIs.flatMap((uri: string) => {
          return uri;
        });
        return baseURIs;
      });

      setNFTs([]);

      // Wait for all asynchronous operations to complete
      const promisesCollection = await Promise.all(promises);

      metadataBaseURIs = promisesCollection.flat();

      const signer2 = await provider.getSigner();
      const mintFactory = new ethers.Contract(
        config[31337].mintFactory.address,
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
            <div className="flex flex-col justify-center items-center h-screen bg-[#2BFDB9] pb-40">
              <h1 className="text-7xl font-bold text-indigo-800 mb-4">
                WELCOME TO MINT FACTORY
              </h1>
              <p className="text-2xl text-black">
                Please connect your wallet to get started.
              </p>
            </div>
          )
      }
    </>
  );
};
