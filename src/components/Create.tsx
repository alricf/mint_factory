import React from 'react';

interface CreateProps {
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  handleChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; allData: object[] | null;
  account: string | null;
  signature: string | null;
}

const Create: React.FC<CreateProps> = ({ handleSubmit, handleChange, allData, account, signature }) => {
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
    <div className="flex flex-col justify-start items-center min-h-screen pt-40 relative" style={{ backgroundColor: '#FCFFA5' }}>
      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-md p-4 bg-black shadow-md rounded-lg">
        <h2 className="text-center text-2xl font-bold mb-4" style={{ color: '#0EACE2' }}>
          Mint NFT
        </h2>

        <div className="mb-3">
          <label htmlFor="formNFTName" className="block text-sm font-medium text-gray-700" style={{ color: '#0EACE2' }}>
            Name
          </label>
          <input
            type="text"
            id="formNFTName"
            placeholder="Enter text"
            className="text-black mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            onChange={handleChange}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="formNFTDescription" className="block text-sm font-medium text-gray-700" style={{ color: '#0EACE2' }}>
            Description
          </label>
          <textarea
            id="formNFTDescription"
            placeholder="Enter your description"
            rows={4}
            className="text-black mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            onChange={handleChange}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="formNFTFiles" className="block text-sm font-medium text-gray-700" style={{ color: '#0EACE2' }}>
            Upload NFT File(s)
          </label>
          <input
            type="file"
            multiple
            id="formNFTFiles"
            onChange={handleChange}
            className="mt-1 block w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 cursor-pointer focus:outline-none"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          MINT
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