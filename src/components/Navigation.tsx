import Image from 'next/image';
import logo from '../logo.png';
import React from 'react';

interface NavigationProps {
  account: string | null;
  connectHandler: () => void;
  disconnectHandler: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ account, connectHandler, disconnectHandler }) => {
  return (
    <nav className="py-2 px-12 flex justify-between items-center bg-[#452146] text-[#0EACE2] sticky top-0 z-50 border-black border-4">
      <div className="flex items-center flex-grow-0">
        <Image
          alt="logo"
          src={logo}
          width={110}
          height={100}
          className="inline-block align-top rounded-full"
        />
      </div>

      <a href="#" className="text-3xl font-semibold absolute left-1/2 transform -translate-x-1/2">
        MINT FACTORY
      </a>

      <div className="flex justify-end flex-grow-0 min-w-[200px]">
        {account ? (
          <div className="flex items-center">
            <span className="text-lg mr-4">Connected: {account.slice(0, 5) + '...' + account.slice(-4)}</span>
            <button
              onClick={disconnectHandler}
              className="bg-red-600 hover:bg-red-800 text-white font-bold py-2 px-4 rounded">
              Disconnect Wallet
            </button>
          </div>
        ) : (
          <button
            onClick={connectHandler}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Connect Wallet
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navigation;