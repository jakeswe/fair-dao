import { ethers, VoidSigner } from 'ethers'
import { useEffect, useState } from 'react'
import NodeSearch from './NodeSearch.jsx'
import FairDaoABI from '../../artifacts/contracts/fd.sol/FairDao.json'
import NodeABI from '../../artifacts/contracts/fd.sol/Node.json'
import RadialTreeChart from './RadialTreeChart.jsx'
import TidyTreeChart from './TidyTreeChart.jsx'
import "../assets/fairdaosearch.scss";
import PullDownHeader from './FairDaoSearch/PullDownHeader.jsx'
import CreateFairDao from './FairDaoSearch/CreateFairDao.jsx'

import {OPTION_ADDRESS} from "../constants/options.js"
import {OPTION_CONTRIBUTION} from "../constants/options.js"
import {OPTION_OWNER} from "../constants/options.js"
import {OPTION_TIDY} from "../constants/options.js"
import {OPTION_RADIAL} from "../constants/options.js"

const FairDaoSearch = ({signer, provider, fairDao, setFairDao, node, setNode, nodeAddress, setNodeAddress, payedNodes, setPayedNodes}) => {

    const [searchValue, setSearchValue] = useState(null);
    const [root, setRoot] = useState(null);
    const [noFDError, setNoFDError] = useState(null);
    const [owner, setOwner] = useState(null);
    const [noNodeError, setNoNodeError] = useState(null);
    const [childAddress, setChildAddress] = useState(null);
    const [tree, setTree] = useState(null);
    const [fdAddress, setFdAddress] = useState(null);
    const [fdOrder, setFdOrder] = useState(null);
    const [fdHireCost, setFdHireCost] = useState(null);
    const [ownerBalance, setOwnerBalance] = useState(null);
    const [abbrAddress, setAbbrAddress] = useState(null);
    const [abbrAddressMap, setAddressMap] = useState({});
    const [optionValue, setOptionValue] = useState(null);
    const [optionTreeValue, setOptionTreeValue] = useState(OPTION_RADIAL);

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
    }
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
    const formatAddress = (address) => {
        const addressLength = address.length;
        return address.slice(0, 6) + "..." + address.slice(addressLength - 3, addressLength);
    }

    const recurse = async (address) => {
        const _node = new ethers.Contract(address, NodeABI["abi"], signer);
        let entry = {};
        const baseAddress =  await _node.getAddress();
        let currentNodeAddress;
        if (node != null){
            currentNodeAddress = await node.getAddress();
        }
        if (baseAddress == currentNodeAddress){
            entry["hl"] = true;
            entry["current"] = true;
        }
        const addressLength = baseAddress.length; 
        const name = formatAddress(baseAddress);
        switch(optionValue){
            case OPTION_ADDRESS:
                entry["name"] = name;
                break;
            case OPTION_CONTRIBUTION:
                const contribution = await _node.getContribution();
                entry["name"] = contribution;
                break;
            case OPTION_OWNER:
                const owner = await _node.getOwner();
                entry["name"] = formatAddress(owner);
                break;
            default:
                entry["name"] = name;
        }
        
        if (payedNodes[baseAddress] != null) {
            entry["payed"] = true;
            entry["name"] = entry["name"] + "\n" + payedNodes[baseAddress];
        }
        setAddressMap((current) => ({
            ...current,
            [name]: baseAddress,
        }));
        const _length = await _node.getLength();
        entry["children"] = [];
        for (let y = 0; y < _length; y++){
            const child = await _node.getChild(y);
            const result = await recurse(child);
            entry["children"].push(result);
            if (result["hl"]){
                entry["hl"] = true;
            }
        }
        return entry;
    }

    const buildTree = async () => {
        const root =  await fairDao.getRoot();
        setRoot(root);
        setAddressMap({});
        const tree = await recurse(root);
        setTree(tree);
        setPayedNodes({});
    }

    return (
        <div className="search">
            <div className="flex justify-center">
                {tree != null && optionTreeValue == OPTION_TIDY && <TidyTreeChart data={tree} width="600" height="600"/>}
                {tree != null && optionTreeValue == OPTION_RADIAL && <RadialTreeChart data={tree} width="600" height="600"/>}
                {root != null && 
                <div className="fixed bottom-4 right-4 z-10">
                    <button type="button" className="btn btn-outline btn-secondary" onClick={buildTree}>Refresh</button>
                </div>}
            </div>
            <div className="search card glass my-10">
                <div className="card-body">
                <PullDownHeader 
                    root={root}
                    optionValue={optionValue}
                    setOptionValue={setOptionValue} 
                    optionTreeValue={optionTreeValue}
                    setOptionTreeValue={setOptionTreeValue}/>
                <CreateFairDao
                    signer={signer}
                    fdOrder={fdOrder} 
                    fdAddress={fdAddress} 
                    setFdOrder={setFdOrder} 
                    fdHireCost={fdHireCost} 
                    setFdHireCost={setFdHireCost}
                    setFairDao={setFairDao}
                    setRoot={setRoot}
                    setFdAddress={setFdAddress}
                    setNode={setNode}
                    setNodeAddress={setNodeAddress} 
                    setOwnerBalance={setOwnerBalance} 
                    setTree={setTree} />
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
                    <NodeSearch signer={signer} 
                        provider={provider}
                        node={node} 
                        setNode={setNode} 
                        nodeAddress={nodeAddress}
                        setNodeAddress={setNodeAddress}
                        payedNodes={payedNodes}
                        setPayedNodes={setPayedNodes} />
                </div>
            </div>
        </div>
    );
}
export default FairDaoSearch;