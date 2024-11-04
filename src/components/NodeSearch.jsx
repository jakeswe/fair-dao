import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import NodeABI from '../../artifacts/contracts/fd.sol/Node.json'
import "../assets/nodesearch.scss"

const FairDaoSearch = ({signer, provider, node, setNode, nodeAddress, setNodeAddress, payedNodes, setPayedNodes}) => {
    const [searchValue, setSearchValue] = useState(null);
    const [paymentValue, setPaymentValue] = useState(null);
    const [owner, setOwner] = useState(null);
    const [noNodeError, setNoNodeError] = useState(null);

    const handleSearchChange = async (value) => {
        setSearchValue(value.target.value);
    }
    const handleSearchClick = async () => {
        const node = new ethers.Contract(searchValue, NodeABI["abi"], signer);
        setNode(node);
        const nodeAddress = await node.getAddress();
        setNodeAddress(nodeAddress);
        const owner = await node.getOwner();
        setOwner(owner);
    }
    const handlePaymentChange = async (value) => {
        setPaymentValue(value.target.value)
    }

    const isBigInt = (value) => {
        try {
            BigInt(value);
            return true;
        } catch(e){
            return false;
        }
    }

    const handlePaymentClick = async () => {
        if (node == null) {
            setNoNodeError("Please load Node Contract");
            return;
        }
        setNoNodeError(null);
        if (!isBigInt(paymentValue)){
            return;
        }

        setPayedNodes({});
        const tx = await node.sendPayment({ value: paymentValue});
        const receipt = await tx.wait();
        const events = receipt.logs
            .map(log => node.interface.parseLog(log)) // Parse each log
            .filter(event => event.name === "NodePayedEvent");
        for (const k in events){
            setPayedNodes((current) => ({
                ...current,
                [events[k].args.node]: [events[k].args.payment],
            }));
        }
    }

    return (
            <div className="send-payment">
                {noNodeError != null && <p>{noNodeError}</p>}
                <div className="flex">
                    <button 
                            type="button"
                            className="send-payment-button  btn btn-outline btn-primary mx-5 px-12"
                            onClick={handlePaymentClick}>Send Payment (Wei)</button>
                    <input type="text" placeholder="Payment Amount in Wei" className="send-payment-input input input-bordered w-full max-w-xs input-bordered input-ghost" onChange={handlePaymentChange}></input>
                </div>
            </div>
    );
}
export default FairDaoSearch;