import { NextResponse, NextRequest } from "next/server";
import { pinata } from "../../../../../utils/config";
import { ethers } from 'ethers';
import MINT_FACTORY_ABI from '../../../../abis/MintFactory.json';
import config from '../../../../config.json';

import * as dotenv from 'dotenv';
dotenv.config();

interface NFTData {
  image?: string;
  name?: string;
  description?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body as JSON
    const body = await request.json();

    // Extract account and chainId from the request body
    const account: string = body.account;
    const chainId: string = body.chainId;

    let provider: any = null;

    // Type validation
    if (typeof account !== 'string') {
      return NextResponse.json({ error: 'Invalid input, expected a string.' }, { status: 400 });
    }

    if (chainId === '31337') {
      // Connect to the local Hardhat network
      provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    } else if (chainId === '84532') {
      // Connect to Base Sepolia network
      provider = new ethers.JsonRpcProvider(`https://base-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`);
    } else {
      throw new Error('Unsupported network');
    }

    // Initiate contract
    const mintFactory = new ethers.Contract(
      config[chainId].mintFactory.address,
      MINT_FACTORY_ABI,
      provider
    );

    // Get token URIs owned by account
    const tokenURIsOwnedByAccount = await mintFactory.walletOfOwner(account);

    const tokenURIs = await Promise.all(
      tokenURIsOwnedByAccount.map(async (element: any) => {
        const tokenURI = await mintFactory.tokenURI(element);
        return tokenURI;
      })
    );

    // Fetch NFT data owned by account
    const allData = await Promise.all(
      tokenURIs?.map(async (tokenURI: string) => {
        const url = `https://${process.env.PINATA_GATEWAY_URL}/ipfs/${tokenURI}`;
        try {
          const response = await pinata.gateways.get(url);

          // Type response.data as any initially
          const rawData = response.data as any;

          // Validate and cast response.data to NFTData
          const data: NFTData = {
            image: typeof rawData?.image === "string" ? rawData.image : undefined,
            name: typeof rawData?.name === "string" ? rawData.name : undefined,
            description: typeof rawData?.description === "string" ? rawData.description : undefined,
          };

          const image = data.image ?? "no image available";
          const name = data.name ?? "no name available";
          const description = data.description ?? "No description available";

          const result = image.substring(0, image.lastIndexOf('/'));
          return { name, description, result };
        } catch (error) {
          console.error('Error fetching file URLs:', error);
          return { name: null, description: null, result: null };
        }
      })
    );

    return NextResponse.json({ allData }, { status: 200 });

  } catch (e) {
    console.log(e);
  }
}
