import { useEffect, useState } from 'react'
import { ethers, VoidSigner } from 'ethers'
import NodeABI from '../../../artifacts/contracts/fd.sol/Node.json'
import FairDaoABI from '../../../artifacts/contracts/fd.sol/FairDao.json'

const AddChild = ({childAddress, setChildAddress, node, nodeAddress, noNodeError, setNoNodeError, fairDao}) => {
    const handleChildAddedChange = async (value) => {
        setChildAddress(value.target.value)
    }

    const handleChildAddedClick = async () => {
        if (node == null) {
            setNoNodeError("Please load Node Contract");
            return;
        }
        setNoNodeError(null);
        if (childAddress == null || !ethers.isAddress(childAddress)){
            return;
        }
        const tx = await fairDao.insert(nodeAddress, childAddress);
        const receipt = await tx.wait();
        /* const events = receipt.logs
            .map(log => fairDao.interface.parseLog(log)) // Parse each log
            .filter(event => event.name === "ChildAddedEvent");
        for (const k in events){
            console.log(events[k].args.added)
        }*/
    }
    return(
        <div className="add-child">
        {noNodeError != null && <p>{noNodeError}</p>}
        <div className="flex">
            <button 
                    type="button"
                    className="add-child-button btn btn-outline btn-primary mx-5 px-10"
                    onClick={handleChildAddedClick}>Add Employee Contract </button>
            <input type="text" placeholder="Employee Address" className="add-child-input input input-bordered input-ghost w-full max-w-xs" onChange={handleChildAddedChange}></input>
        </div>
    </div>
    );
};

export default AddChild;