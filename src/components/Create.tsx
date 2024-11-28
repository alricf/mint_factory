import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface CreateProps {
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  handleChange: (index: number, event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  nfts: { name: string; description: string; files: File[] | null; blobURLs: string[]; }[]; // Add blobURLs as an array of strings
  addNFT: (newNFT: { name: string; description: string; files: File[]; blobURLs: string[]; }) => void;
  removeNFT: (index: number) => void;
  allData: object[] | null;
  account: string | null;
  signature: string | null;
  totalNFTs: number | null;
  setTotalNFTs: React.Dispatch<React.SetStateAction<number | null>>;
}

const Create: React.FC<CreateProps> = ({ handleSubmit, handleChange, nfts, addNFT, removeNFT, allData, account, signature, totalNFTs, setTotalNFTs }) => {
  console.log(nfts);
  const [currentNFT, setCurrentNFT] = useState<{
    name: string;
    description: string;
    files: File[]; 
    blobURLs: string[]; 
  }>({
    name: '',
    description: '',
    files: [], 
    blobURLs: [], 
  });

  useEffect(() => {
    console.log('currentNFT.files', currentNFT.files);
  }, [currentNFT.files]);

  const fileInputRef = useRef<HTMLInputElement | null>(null); 

  // Handle local form change
  const handleLocalChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = event.target as HTMLInputElement;

    if (target.type === "file" && target.files && target.files.length > 0) {
      const filesArray: File[] = Array.from(target.files); // Ensuring File[] type for files

      // Create blob URLs for previewing the files
      const newBlobURLs = filesArray.map((file) => URL.createObjectURL(file));

      setCurrentNFT((prev) => ({
        ...prev,
        files: filesArray, 
        blobURLs: newBlobURLs, 
      }));
    } else {
      setCurrentNFT((prev) => ({
        ...prev,
        [target.name]: target.value,
      }));
    }
  };

  // Handle adding new NFT
  const handleAddNFT = () => {
    if (currentNFT.name && currentNFT.description && currentNFT.files.length > 0) {
      setTotalNFTs((prevCounter: any) => prevCounter + currentNFT.files.length);
      const filesArray = [...currentNFT.files]; 
      const newBlobURLs = filesArray.map((file) => URL.createObjectURL(file));

      addNFT({
        name: currentNFT.name,
        description: currentNFT.description,
        files: filesArray, 
        blobURLs: newBlobURLs, 
      });

      // Clear the form fields after adding the NFT
      setCurrentNFT({ name: '', description: '', files: [], blobURLs: [] });

      // Clear the file input after the preview has rendered
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      console.error('Please fill in all the fields and upload a file.');
    }
  };

  const handleRemoveNFT = (index: number) => {
    const nftToRemove = nfts[index];

    setTotalNFTs((prevCounter: any) => prevCounter - nftToRemove.blobURLs.length);

    nftToRemove.blobURLs.forEach((url) => {
      URL.revokeObjectURL(url);
    });

    removeNFT(index);
  };

  // Scroll to display section
  const handleArrowClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    const targetElement = document.getElementById('display');
    if (targetElement) {
      window.scrollTo({
        top: targetElement.offsetTop,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="flex flex-col justify-start items-center h-full py-4 relative" style={{ backgroundColor: '#FCFFA5' }}>
      <form onSubmit={handleSubmit} className="w-full max-w-xl p-6 bg-black shadow-md rounded-xl">
        <h2 className="text-center text-2xl font-bold mb-4" style={{ color: '#0EACE2' }}>
          Mint NFT(s)
        </h2>

        {/* Fields for new NFT */}
        <div className="mb-6">
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              value={currentNFT.name}
              onChange={handleLocalChange}
              placeholder="NFT Name"
              className="text-black mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={currentNFT.description}
              onChange={handleLocalChange}
              placeholder="NFT Description"
              rows={4}
              className="text-black mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Upload File</label>
            <input
              type="file"
              name="files"
              multiple
              onChange={handleLocalChange} 
              ref={fileInputRef} 
              className="mt-1 block w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 cursor-pointer"
            />
          </div>

          {/* Show list of added NFTs only if there is at least one */}
          {nfts.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-2">NFT(s) to be minted:</h3>
              <ul>
                {nfts.map((nft, index) => (
                  <li key={index} className="flex flex-col justify-between items-center mb-2 border p-2 gap-2">

                    <div className="flex flex-wrap gap-1">
                      {nft.blobURLs.map((blobURL, i) => (
                        <Image
                          key={i}
                          src={blobURL}
                          alt={`Preview ${i}`}
                          width={64}
                          height={64}
                          className="object-cover my-2 rounded-full"
                        />
                      ))}
                    </div>

                    <span className="text-white">{nft.name}</span>

                    <span className="text-white">{nft.description}</span>

                    <button
                      type="button"
                      onClick={() => handleRemoveNFT(index)}
                      className="text-red-500 border-red-500 border rounded-lg px-2 py-1 hover:bg-red-500 hover:text-white"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
              <h3 className="text-lg font-bold mb-2 text-center">TOTAL COST: {totalNFTs} NFT(s) x 1 wei = {totalNFTs} wei</h3>
            </div>
          )}

          {/* Add NFT Button */}
          <button
            type="button"
            onClick={handleAddNFT}
            className="w-full bg-[#2BFDB9] text-black text-bold text-2xl py-2 px-4 rounded-full hover:bg-green-500 hover:text-white"
          >
            Add NFT(s)
          </button>
        </div>

        {/* Mint Button */}
        <button
          type="submit"
          className="w-full bg-blue-500 text-black text-bold text-2xl py-2 px-4 rounded-full hover:bg-blue-700 hover:text-white"
        >
          Mint NFT(s)
        </button>
      </form>

      {/* Arrow Down Icon */}
      {
        (allData !== null && allData.length > 0 && account !== null && signature !== null) &&
        (
          <div className="flex justify-center mt-8 cursor-pointer" onClick={handleArrowClick}>
            <div className="cursor-pointer">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-12 h-12 text-gray-700 hover:text-black animate-bounce"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <polyline points="19 12 12 19 5 12" />
              </svg>
            </div>
          </div>
        )
      }

    </div>
  );
};

export default Create;
