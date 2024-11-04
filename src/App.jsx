import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import './App.css'
import './assets/index.scss'
import FairDaoABI from '../artifacts/contracts/fd.sol/FairDao.json'
import NodeABI from '../artifacts/contracts/fd.sol/Node.json'
import FairDaoSearch from './components/FairDaoSearch.jsx'

function App() {
  const [count, setCount] = useState(0)
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] =useState(null);
  const [fairDao, setFairDao] = useState(null);
  const [node, setNode] = useState(null);
  const [nodeAddress, setNodeAddress] = useState(null);
  const [payedNodes, setPayedNodes] = useState({});

  const loadBlockchainData = async () => {
    const accounts = await window.ethereum.request({method: 'eth_requestAccounts'});
    const account = ethers.getAddress(accounts[0]);
    setAccount(account);
  }
const loadContract = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    setProvider(provider);
    const signer = await provider.getSigner(account);
    setSigner(signer);
    //const network = await provider.getNetwork();
}

  useEffect(() => {
    loadBlockchainData();
  }, []);
  useEffect(() => {
    loadContract();
  }, []);

  return (
    <>
      <div>
        <FairDaoSearch signer={signer}
                       provider={provider} 
                       fairDao={fairDao} 
                       setFairDao={setFairDao} 
                       node={node} 
                       setNode={setNode} 
                       nodeAddress={nodeAddress} 
                       setNodeAddress={setNodeAddress}
                       payedNodes={payedNodes}
                       setPayedNodes={setPayedNodes}/>
      </div>
    </>
  )
}

export default App
