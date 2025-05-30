const hre = require("hardhat");

async function main() {
  const ContractFactory = await hre.ethers.getContractFactory("SupplyChain");
  const contract = await ContractFactory.deploy(); // This deploys the contract

  await contract.waitForDeployment(); // For Ethers v6

  console.log("Contract deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
