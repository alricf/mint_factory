"use client";
import { useState } from 'react';
import Image from 'next/image';

interface DisplayProps {
  allData: object[] | null;
}

const Display: React.FC<DisplayProps> = ({ allData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');

  const openModal = (url: string) => {
    setSelectedImageUrl(url);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedImageUrl('');
  };

  return (
    <section id="display" className="bg-[#11F9ED] p-6 border-y-black border-y-4">
      <h1 className="text-5xl font-bold text-center text-gray-900 mb-6">
        Assets Owned
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {allData !== null && allData.length > 0 ? (
          allData.map((element: any, index) => (
            <div
              key={index}
              className="group relative w-full h-[400px] bg-black rounded-lg shadow-lg overflow-hidden cursor-pointer"
              onClick={() => openModal(`https://${process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL}/${element.result}`)}
            >
              {/* NFT */}
              <Image
                src={`https://${process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL}/${element.result}`}
                alt={`NFT ${index + 1}`}
                width={400}
                height={400}
                className="w-full h-full object-cover rounded-md transition-opacity duration-300 group-hover:opacity-0"
              />

              {/* Hover - Name and Description  */}
              <div className="absolute inset-0 bg-black text-center flex flex-col justify-center items-center rounded-lg p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <h2 className="text-xl font-semibold text-white">{element.name}</h2>
                <p className="text-white mt-2">{element.description}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-1 sm:col-span-2 md:col-span-3">
            <p className="text-center text-gray-900 text-2xl">0 Assets Owned</p>
          </div>
        )}
      </div>

      { // Modal
        isModalOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={closeModal}
          >
            <div
              className="relative bg-white p-4 rounded-lg shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <span
                className="absolute top-2 right-2 text-2xl font-bold cursor-pointer text-red-500"
                onClick={closeModal}
              >
                &times;
              </span>
              <Image
                src={selectedImageUrl}
                alt="Modal Image"
                width={500}
                height={500}
                className="rounded-lg object-contain"
              />
            </div>
          </div>
        )}
    </section>
  );
};

export default Display;
