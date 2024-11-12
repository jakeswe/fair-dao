import { useEffect, useState } from 'react'
import { ethers, VoidSigner } from 'ethers'
import FairDaoABI from '../../../artifacts/contracts/fd.sol/FairDao.json'

const CreateFairDao = ({signer, fdOrder, fdAddress, setFdOrder, fdHireCost, setFdHireCost, setFairDao, setRoot, setFdAddress, setNode, setNodeAddress, setOwnerBalance, setTree}) => {
    const handleOrderChange = async (value) => {
        setFdOrder(value.target.value);
       }
       const handleHireCostChange = async (value) => {
        setFdHireCost(value.target.value);
       }
       const handleCreateFDClick = async (value) => {
            if (fdOrder == null || !parseInt(fdOrder) || fdHireCost == null || !parseInt(fdHireCost)) {
                return null;
            }
            const factory = new ethers.ContractFactory(FairDaoABI["abi"], FairDaoABI["bytecode"], signer);
            const contract = await factory.deploy(fdHireCost, fdOrder);
            const fd = await contract.waitForDeployment();
            const a = await fd.getAddress();
            setFairDao(fd);
            const root = await fd.getRoot();
            setRoot(root);
            setFdAddress(a);
            setNode(null);
            setNodeAddress(null);
            setOwnerBalance(null);
            setTree(null);
       }

       return(
            <div>
                {fdAddress != null && <p>Organization Created At: {fdAddress}</p>}
                <div className="flex">
                    <button 
                    type="button"
                    className="create-fd-button btn btn-outline btn-primary mx-5 px-10"
                    onClick={handleCreateFDClick}>Create Organization</button>
                    <input type="text" placeholder="Team Size" className="order-input input input-bordered w-28 mx-8 input-ghost " onChange={handleOrderChange}></input>
                    <input type="text" placeholder="Hire Cost" className="hire-cost-input input input-bordered w-40 input-ghost " onChange={handleHireCostChange}></input>
                </div>
            </div>
       );
};

export default CreateFairDao;