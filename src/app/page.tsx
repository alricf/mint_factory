"use client";
require('dotenv').config();

import './globals.css';
import React, { useState, ChangeEvent, FormEvent } from 'react';
import { ethers } from 'ethers';

import MINT_FACTORY_ABI from '../abis/MintFactory.json';
import config from '../config.json';

// Components
import Navigation from '@/components/Navigation';
import Create from '@/components/Create';

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

  // const [signer, setSigner] = useState<any | null>(null);

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
    setAccount(null);  // Reset account state
    console.log("Disconnected");
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.id === 'formNFTName') setName(event.target.value);
    if (event.target.id === 'formNFTDescription') setDescription(event.target.value);
    if (event.target.files && event.target.files.length > 0 && event.target.id === 'formNFTFiles') setFiles(event.target.files);
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
      const response = await fetch('/api/file', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();
      console.log(data, 'data');

      console.log(data.typeof, 'data typeof');

      const metadataBaseURIs = data.uploadedMetadataFiles.map(element => {
        return element.IpfsHash
      })
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

      // Sending 1 Ether from the user's wallet
      const tx = await mintFactory.mint(metadataBaseURIs.length, metadataBaseURIs, {
        value: ethers.parseUnits(metadataBaseURIs.length.toString(), "ether"),
      });
      console.log(tx);

      await tx.wait(); // Wait for transaction to be mined
      console.log("Minting successful:", tx.hash);
      const totalSupply = await mintFactory.totalSupply();
      console.log(totalSupply.toString(), 'totalSupply');

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
      <Create
        handleSubmit={handleSubmit}
        handleChange={handleChange}
      />
      {/* {account ?
        (
          <Create
            handleSubmit={handleSubmit}
            handleChange={handleChange}
          />
        )
        :
        (
          <div className='flex flex-col justify-center items-center h-full'>
            <h1 className='text-3xl'>
              WELCOME TO MINT FACTORY
            </h1>
            <p>Please connect your wallet</p>
          </div>
        )} 
      */}
    </>
  );
}
