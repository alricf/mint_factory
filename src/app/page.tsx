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

// Wallet connection libraries
import Web3Modal from 'web3modal';

export default function Home() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [name, setName] = useState<String | null>(null);
  const [description, setDescription] = useState<String | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<any | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [allData, setAllData] = useState<object[] | null>(null);

  const read = async () => {
    if (account !== null) {
      // Sending files to server
      const response = await fetch('/api/file/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ account }),
      });
      const data = await response.json();
      console.log('Data received from server:', data);
      console.log('Type of data:', typeof data);

      // Log the structure of the data
      if (typeof data === 'object') {
        console.log('Data keys:', Object.keys(data));
      }

      // Check if data contains allData
      if (Array.isArray(data)) {
        setAllData(data); // Direct array
      } else if (data.allData && Array.isArray(data.allData)) {
        setAllData(data.allData); // Extract from object
      } else {
        console.error('Expected an array but received:', data);
      }
    }
  };

  useEffect(() => {
    read();
  }, [account]);
  console.log(allData);

  // Wallet connect handler
  const connectWallet = async () => {
    try {
      const web3Modal = new Web3Modal({
        cacheProvider: false, // optional
        providerOptions: {},  // MetaMask doesn't require extra config
      });

      const instance = await web3Modal.connect(); // MetaMask prompt

      const provider = new ethers.BrowserProvider(instance); // v6
      setProvider(provider);

      const signer = await provider.getSigner();
      // setSigner(signer)

      const address = await signer.getAddress(); // user's address
      setAccount(address); // Set the connected user's account address
      console.log("Connected to:", address);

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
    console.log("Wallet Disconnected");
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = event.target;

    // Handle Form Inputs
    if (id === 'formNFTName') setName(value);
    if (id === 'formNFTDescription') setDescription(value);
    if (event.target instanceof HTMLInputElement && event.target.type === 'file' && event.target.files) {
      setFiles(event.target.files);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!provider) alert('Please connect your wallet before minting');
    if (!files) {
      alert('Please select a file first!');
      return;
    }

    const formData = new FormData();
    formData.append('name', name as string);
    formData.append('description', description as string);
    Array.from(files).forEach((file) => {
      formData.append('files', file);
    });
    formData.append('account', account as string);
    formData.append('signature', signature as string);
    formData.append('message', message as string);

    try {
      // Sending files to server
      const response = await fetch('/api/file/create', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();
      console.log(data, 'data');

      console.log(data.typeof, 'data typeof');

      const metadataBaseURIs = data.uploadedMetadataFiles.map(element => {
        return element;
      });
      console.log(metadataBaseURIs, 'metadataBaseURIs');

      const signer2 = await provider.getSigner();
      console.log(signer2, 'signer2');

      // MintFactory contract interaction
      const mintFactory = new ethers.Contract(
        config[31337].mintFactory.address,
        MINT_FACTORY_ABI,
        signer2
      );
      console.log(mintFactory, 'mintFactory');
      console.log(metadataBaseURIs.length, 'metadataBaseURIs.length', metadataBaseURIs, 'metadataBaseURIs');

      // Sending the right amount of Ether from the user's wallet
      const tx = await mintFactory.mint(metadataBaseURIs.length, metadataBaseURIs, {
        value: ethers.parseUnits(metadataBaseURIs.length.toString(), "ether"),
      });
      console.log(tx);

      await tx.wait(); // Wait for transaction to be mined
      console.log("Minting successful:", tx.hash);
      const totalSupply = await mintFactory.totalSupply();
      console.log(totalSupply.toString(), 'totalSupply');

      // Reset form state variables
      setName(null);
      setDescription(null);
      setFiles(null);

      // Reset form
      const form = event.target as HTMLFormElement;
      form.reset();

      // Refresh assets owned after minting
      await read();

    } catch (error) {
      console.error('Error sending file to server:', error);
    }
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
              allData={allData}
              account={account}
              signature={signature}
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
}
