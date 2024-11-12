import { useEffect, useState } from 'react'
import { ethers, VoidSigner } from 'ethers'
import FairDaoABI from '../../../artifacts/contracts/fd.sol/FairDao.json'

const LoadFairDao = ({signer, searchValue, setSearchValue, setFairDao, root, setRoot, setNode, setNodeAddress, setOwnerBalance, setTree, setFdAddress}) => {
    const handleSearchChange = async (value) => {
        setSearchValue(value.target.value);
    }

    const handleSearchClick = async () => {
        if (searchValue == null || !ethers.isAddress(searchValue)) {
            return;
        }
        const fairDao = new ethers.Contract(searchValue, FairDaoABI["abi"], signer);
        setFairDao(fairDao);
        const root = await fairDao.getRoot();
        setRoot(root);
        setNode(null);
        setNodeAddress(null);
        setOwnerBalance(null);
        setTree(null);
        setFdAddress(null);
    }
    return(
    <div>
        {root != null && <p>Organization Root (CEO): {root}</p>}
        <div className="flex">
            <button 
            type="button"
            className="search-fd-button btn btn-outline btn-primary mx-5 px-14"
            onClick={handleSearchClick}>Load Organization</button>
            <input type="text" placeholder="Address" className="search-fd-input input input-bordered w-full max-w-xs input-ghost " onChange={handleSearchChange}></input>
        </div>
    </div>
    );
};

export default LoadFairDao;