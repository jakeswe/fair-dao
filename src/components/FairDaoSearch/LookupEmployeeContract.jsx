import { useEffect, useState } from 'react'
import { ethers, VoidSigner } from 'ethers'
import FairDaoABI from '../../../artifacts/contracts/fd.sol/FairDao.json'
import NodeABI from '../../../artifacts/contracts/fd.sol/Node.json'


const LookupEmployeeContract = ({signer, provider, setOwner, fairDao, noFDError, setNoFDError, owner, setNode, nodeAddress, setNodeAddress, ownerBalance, setOwnerBalance}) => {
    const handleAtoNChange = async (value) => {
        setOwner(value.target.value);
    }

    const handleAtoNClick = async () => {
        if (fairDao == null) {
            setNoFDError("Please load a FairDao Contract");
            return;
        }
        setNoFDError(null);
        if (owner == null || !ethers.isAddress(owner)) {
            return;
        }
        const _node = await fairDao.getNode(owner);
        const node = new ethers.Contract(_node, NodeABI["abi"], signer);
        setNode(node);
        const nodeAddress = await node.getAddress();
        setNodeAddress(nodeAddress);
        const ownerBalance = await provider.getBalance(owner);
        setOwnerBalance(ownerBalance.toString());
    }

    return (
        <div>
            {noFDError != null && <p>{noFDError}</p>}
            {nodeAddress != null && <p className="selected-node">Employee Contract Address: {nodeAddress}</p>}
            {ownerBalance != null && <p>Employee Address Balance: {ownerBalance} </p>}
            <div className="flex">
                <button 
                type="button"
                className="address-to-node-button btn btn-outline btn-primary mx-5 px-7"
                onClick={handleAtoNClick}>Lookup Employee Contract</button>
                <input type="text" placeholder="Employee Address" className="address-to-node-input input input-bordered input-ghost w-full max-w-xs" onChange={handleAtoNChange}></input>
            </div>
        </div>
    );
};

export default LookupEmployeeContract;