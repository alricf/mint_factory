const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n: number) => {
  return ethers.utils.parseUnits(n.toString(), 'ether');
};

const ether = tokens;

describe('MintFactory', () => {
  const NAME: string = 'Mint Factory';
  const SYMBOL: string = 'MF';

  const COST = ether(1);

  let mintFactory: any, deployer: any, minter: any;

  beforeEach(async () => {
    let accounts = await ethers.getSigners();
    deployer = accounts[0];
    minter = accounts[1];
  });

  describe('Deployment', () => {

    beforeEach(async () => {
      const MintFactory = await ethers.getContractFactory('MintFactory');
      mintFactory = await MintFactory.deploy(NAME, SYMBOL);
    });

    it('has correct name', async () => {
      expect(await mintFactory.name()).to.equal(NAME);
    });

    it('has correct symbol', async () => {
      expect(await mintFactory.symbol()).to.equal(SYMBOL);
    });
  });

  describe('Minting', () => {
    let transaction: any, result: any;

    describe('Success', async () => {

      beforeEach(async () => {
        const MintFactory = await ethers.getContractFactory('MintFactory');
        mintFactory = await MintFactory.deploy(NAME, SYMBOL);

        transaction = await mintFactory.connect(minter).mint(1, ['ipfs/QmQ2jnDYecFhrf3asEWjyjZRX1pZSsNWG3qHzmNDvXa9qg/'], { value: COST });
        result = await transaction.wait();
      });

      it('returns the address of the minter', async () => {
        expect(await mintFactory.ownerOf(1)).to.equal(minter.address);
      });

      it('returns total number of tokens the minter owns', async () => {
        expect(await mintFactory.balanceOf(minter.address)).to.equal(1);
      });

      it('returns IPFS URI', async () => {
        expect(await mintFactory.tokenURI(1)).to.equal(`ipfs/QmQ2jnDYecFhrf3asEWjyjZRX1pZSsNWG3qHzmNDvXa9qg/1.json`);
      });

      it('updates the total supply', async () => {
        expect(await mintFactory.totalSupply()).to.equal(1);
      });

      it('updates the contract ether balance', async () => {
        expect(await ethers.provider.getBalance(mintFactory.address)).to.equal(COST);
      });

      it('emits Mint event', async () => {
        await expect(transaction).to.emit(mintFactory, 'Mint')
          .withArgs(1, minter.address);
      });

    });

    describe('Failure', async () => {

      it('rejects insufficient payment', async () => {
        const MintFactory = await ethers.getContractFactory('MintFactory');
        mintFactory = await MintFactory.deploy(NAME, SYMBOL);

        await expect(mintFactory.connect(minter).mint(1, ['ipfs/QmQ2jnDYecFhrf3asEWjyjZRX1pZSsNWG3qHzmNDvXa9qg/'], { value: ether(0.1) })).to.be.revertedWith('insufficient payment');
      });

      it('requires at least 1 NFT to be minted', async () => {
        const MintFactory = await ethers.getContractFactory('MintFactory');
        mintFactory = await MintFactory.deploy(NAME, SYMBOL);

        await expect(mintFactory.connect(minter).mint(0, ['ipfs/QmQ2jnDYecFhrf3asEWjyjZRX1pZSsNWG3qHzmNDvXa9qg/'], { value: COST })).to.be.revertedWith('must mint at least 1 token');
      });

      it('does not allow more NFTs to be minted than max amount', async () => {
        const MintFactory = await ethers.getContractFactory('MintFactory');
        mintFactory = await MintFactory.deploy(NAME, SYMBOL);

        await expect(mintFactory.connect(minter).mint(1001, ['ipfs/QmQ2jnDYecFhrf3asEWjyjZRX1pZSsNWG3qHzmNDvXa9qg/'], { value: ether(1001) })).to.be.revertedWith('max supply minted');
      });

      it('does not return URIs for invalid tokens', async () => {
        const MintFactory = await ethers.getContractFactory('MintFactory');
        mintFactory = await MintFactory.deploy(NAME, SYMBOL);

        mintFactory.connect(minter).mint(1, ['ipfs/QmQ2jnDYecFhrf3asEWjyjZRX1pZSsNWG3qHzmNDvXa9qg/'], { value: COST });

        await expect(mintFactory.tokenURI('1000000')).to.be.revertedWith('token does not exist');
      });

      it('does not mint tokens if the right count of NFT metadata Base URI are not provided', async () => {
        const MintFactory = await ethers.getContractFactory('MintFactory');
        mintFactory = await MintFactory.deploy(NAME, SYMBOL);

        // Mint 4 nfts with 3 different NFT metadata base URIs
        await expect(mintFactory.connect(minter).mint(4, ['ipfs/QmQ2jnDYecFhrf3asEWjyjZRX1pZSsNWG3qHzmNDvXa9qg/', 'ipfs/QmQ2jnDYecFhrf3asEWjyjZRX1pZSsNWG3qHzmNDvXa9qh/', 'ipfs/QmQ2jnDYecFhrf3asEWjyjZRX1pZSsNWG3qHzmNDvXa9qi/'], { value: ether(4) })).to.be.revertedWith('NFT metadata base URI vs mint amount count mismatch');
      });
    });

  });

  describe('Displaying NFTs', () => {
    let transaction: any, result: any;

    beforeEach(async () => {
      const MintFactory = await ethers.getContractFactory('MintFactory');
      mintFactory = await MintFactory.deploy(NAME, SYMBOL);

      // Mint 3 nfts
      transaction = await mintFactory.connect(minter).mint(3, ['ipfs/QmQ2jnDYecFhrf3asEWjyjZRX1pZSsNWG3qHzmNDvXa9qg/', 'ipfs/QmQ2jnDYecFhrf3asEWjyjZRX1pZSsNWG3qHzmNDvXa9qh/', 'ipfs/QmQ2jnDYecFhrf3asEWjyjZRX1pZSsNWG3qHzmNDvXa9qi/'], { value: ether(3) });

      result = await transaction.wait();
    });

    it('returns all the NFTs for a given owner', async () => {
      let tokenIds = await mintFactory.walletOfOwner(minter.address);

      expect(tokenIds.length).to.equal(3);
      expect(tokenIds[0].toString()).to.equal('1');
      expect(tokenIds[1].toString()).to.equal('2');
      expect(tokenIds[2].toString()).to.equal('3');
    });
  });

  describe('Withdrawing', () => {

    describe('Success', async () => {

      let transaction: any, result: any, balanceBefore: number;

      beforeEach(async () => {
        const MintFactory = await ethers.getContractFactory('MintFactory');
        mintFactory = await MintFactory.deploy(NAME, SYMBOL);

        transaction = await mintFactory.connect(minter).mint(1, ['ipfs/QmQ2jnDYecFhrf3asEWjyjZRX1pZSsNWG3qHzmNDvXa9qg/'], { value: COST });
        result = await transaction.wait();

        balanceBefore = await ethers.provider.getBalance(deployer.address);

        transaction = await mintFactory.connect(deployer).withdraw();
        result = await transaction.wait();
      });

      it('deducts contract balance', async () => {
        expect(await ethers.provider.getBalance(mintFactory.address)).to.equal(0);
      });

      it('sends funds to the owner', async () => {
        expect(await ethers.provider.getBalance(deployer.address)).to.be.greaterThan(balanceBefore);
      });

      it('emits a withdraw event', async () => {
        expect(transaction).to.emit(mintFactory, 'Withdraw')
          .withArgs(COST, deployer.address);
      });
    });

    describe('Failure', async () => {

      it('prevents non-owner from withdrawing', async () => {
        const MintFactory = await ethers.getContractFactory('MintFactory');
        mintFactory = await MintFactory.deploy(NAME, SYMBOL);

        // Mint 1 NFT
        mintFactory.connect(minter).mint(1, ['ipfs/QmQ2jnDYecFhrf3asEWjyjZRX1pZSsNWG3qHzmNDvXa9qg/'], { value: COST });

        // Try to withdraw from the wrong account
        await expect(mintFactory.connect(minter).withdraw()).to.be.revertedWith('Ownable: caller is not the owner');
      });
    });
  });
});