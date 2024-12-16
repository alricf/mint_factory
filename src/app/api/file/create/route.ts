import { NextResponse, NextRequest } from "next/server";
import { pinata } from "../../../../../utils/config";
import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    // Gather data
    const data = await request.formData();

    const name: string = data.get('name') as string;
    const description: string = data.get('description') as string;
    const files: File[] = data.getAll('files[]') as File[];

    const uploadedMetadataFileBaseURIs: string[] = [];

    for (const file of files) {
      const fileExtension = file.name.split('.').pop();

      const uniqueId = uuidv4();

      // Upload NFT file to pinata
      const uploadFileData = await pinata.upload
        .file(file)
        .addMetadata({
          name: `${uniqueId}.${fileExtension}`
        });

      // Upload json file to pinata
      const uploadMetadata = await pinata.upload
        .json({
          name,
          description,
          image: `ipfs/${uploadFileData.IpfsHash}/${uniqueId}.${fileExtension}`,
        })
        .addMetadata({
          name: `${uniqueId}.json`
        });

      uploadedMetadataFileBaseURIs.push(uploadMetadata.IpfsHash);
    }

    return NextResponse.json({
      uploadedMetadataFileBaseURIs
    }, { status: 200 });
  } catch (e) {
    console.log(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
