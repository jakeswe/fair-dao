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
import LoadFairDao from './FairDaoSearch/LoadFairDao.jsx'
import LookupEmployeeContract from './FairDaoSearch/LookupEmployeeContract.jsx'
import LookupAbbrAddress from './FairDaoSearch/LookupAbbrAddress.jsx'

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
                <LoadFairDao
                    signer={signer}
                    searchValue={searchValue} 
                    setSearchValue={setSearchValue} 
                    setFairDao={setFairDao} 
                    root={root} 
                    setRoot={setRoot} 
                    setNode={setNode} 
                    setNodeAddress={setNodeAddress} 
                    setOwnerBalance={setOwnerBalance} 
                    setTree={setTree} 
                    setFdAddress={setFdAddress} />
                <LookupEmployeeContract
                    signer={signer} 
                    provider={provider}
                    setOwner={setOwner} 
                    fairDao={fairDao} 
                    noFDError={noFDError} 
                    setNoFDError={setNoFDError} 
                    owner={owner} 
                    setNode={setNode} 
                    nodeAddress={nodeAddress} 
                    setNodeAddress={setNodeAddress} 
                    ownerBalance={ownerBalance}
                    setOwnerBalance={setOwnerBalance}/>
                <LookupAbbrAddress
                    signer={signer} 
                    provider={provider} 
                    abbrAddress={abbrAddress} 
                    setAbbrAddress={setAbbrAddress} 
                    abbrAddressMap={abbrAddressMap} 
                    setNode={setNode} 
                    nodeAddress={nodeAddress} 
                    setNodeAddress={setNodeAddress} 
                    setOwner={setOwner} 
                    setOwnerBalance={setOwnerBalance}/>
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