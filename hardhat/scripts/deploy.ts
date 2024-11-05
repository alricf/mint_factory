const hre = require("hardhat");

async function main() {
  // Deploy MintFactory contract
  const MintFactory = await hre.ethers.getContractFactory('MintFactory');
  let mintFactory = await MintFactory.deploy('Mint Factory', 'MF');

  await mintFactory.waitForDeployment();
  console.log(`MintFactory deployed to: ${mintFactory.target}\n`); // v6
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
