import abi from './abi/SupplyChain.json'; // path to ABI JSON
import { ethers } from 'ethers';

export const CONTRACT_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"; // use your deployed address
// export const CONTRACT_ABI = abi.abi;
export const getContract = (providerOrSigner) => {
  return new ethers.Contract(CONTRACT_ADDRESS, abi.abi, providerOrSigner);
};