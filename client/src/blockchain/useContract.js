import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from './contract-config';

const useContract = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        try {
          const ethProvider = new ethers.providers.Web3Provider(window.ethereum);
          await window.ethereum.request({ method: 'eth_requestAccounts' });

          const signer = ethProvider.getSigner();
          const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
          const userAccount = await signer.getAddress();

          setProvider(ethProvider);
          setSigner(signer);
          setContract(contractInstance);
          setAccount(userAccount);
        } catch (error) {
          console.error("Error connecting to Metamask", error);
        }
      } else {
        alert("Please install Metamask");
      }
    };

    init();
  }, []);

  return { provider, signer, contract, account };
};

export default useContract;
