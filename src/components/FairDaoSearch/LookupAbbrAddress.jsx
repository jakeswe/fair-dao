import { useEffect, useState } from 'react'
import { ethers, VoidSigner } from 'ethers'
import NodeABI from '../../../artifacts/contracts/fd.sol/Node.json'

const LookupAbbrAddress = ({signer, provider, abbrAddress, setAbbrAddress, abbrAddressMap, setNode, nodeAddress, setNodeAddress, setOwner, setOwnerBalance}) => {
    const handleAbbrAddressChange = async (value) => {
        setAbbrAddress(value.target.value);
    }

    const handleAbbrAddressClick = async () => {
        if (abbrAddress == null) {
            return;
        }
        const nodeAddress = abbrAddressMap[abbrAddress];
        if (nodeAddress == null) {
            return;
        }
        const node = new ethers.Contract(nodeAddress, NodeABI["abi"], signer);
        setNode(node);
        setNodeAddress(nodeAddress);
        const owner = await node.getOwner();
        setOwner(owner);
        const ownerBalance = await provider.getBalance(owner);
        setOwnerBalance(ownerBalance.toString());
    }
    return(
        <div>
            {nodeAddress != null && <p className="selected-node">Employee Contract Address: {nodeAddress} </p>}
            <div className="flex">
                <button 
                type="button"
                className="abbr-address-button btn btn-outline btn-primary mx-5 px-7"
                onClick={handleAbbrAddressClick}>Lookup Employee Contract </button>
                <input type="text" placeholder="0x0000...000" className="abbt-address-input input input-bordered input-ghost w-full max-w-xs" onChange={handleAbbrAddressChange}></input>
            </div>
        </div>
    );
};

export default LookupAbbrAddress;