const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

let NodeABI;

const ROOT_OWNER = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const CHILD_OWNER = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const FAIRDAO_ORDER = 6;
const FAIRDAO_IMPL_ORDER = 2;
const FAIRDAO_HIRECOST = 5073566;
const FAIRDAO_IMPL_HIRECOST = 6000000;
const FAIRDAO_MAX_DEPTH = 4;

const recurse = async(signer, fairDao, node, hireCost, maxDepth, depth, order) => {
    //const childAddress = depth % 2 == 0 ? CHILD_OWNER : ROOT_OWNER;
    const childAddress = ROOT_OWNER;
    const nodeAddress = await node.getAddress();
    let limit = order; //Math.floor(order * Math.random(order));
    let payment = hireCost * limit * (maxDepth - depth + 1);
    const tx = await node.sendPayment({ value: payment});
    const receipt = await tx.wait(); 
    if (depth >= maxDepth) {
        return;
    }
    for (let y = 0; y < limit; y++){
        const _tx = await fairDao.insert(nodeAddress, childAddress);
        const _receipt = await _tx.wait()
        const events = _receipt.logs
            .map(log => fairDao.interface.parseLog(log)) // Parse each log
            .filter(event => event.name === "ChildAddedEvent");
        let nextNodeAddress
        //there should only be one but returned as array
        for (const k in events){
            nextNodeAddress = events[k].args.child
        }
        const nextNode = new ethers.Contract(nextNodeAddress, NodeABI["abi"], signer);
        await recurse(signer, fairDao, nextNode, hireCost, maxDepth, depth + 1, order);
    }
}

async function main() {
    try {
        const data = fs.readFileSync('./artifacts/contracts/fd.sol/Node.json', 'utf8');
        NodeABI = JSON.parse(data);
    } catch (err) {
        console.error('Error reading or parsing the JSON file:', err);
    }

    // Setup accounts
    const [deployer] = await ethers.getSigners();

    // Deploy FairDAO
    const FairDAO = await hre.ethers.getContractFactory("FairDao");
    const fairDAO = await FairDAO.deploy(FAIRDAO_HIRECOST, FAIRDAO_ORDER);
    await fairDAO.waitForDeployment();
    const rootAddress = await fairDAO.getRoot();
    const nextNode = new ethers.Contract(rootAddress, NodeABI["abi"], deployer);
    await recurse(deployer, fairDAO, nextNode, FAIRDAO_IMPL_HIRECOST, FAIRDAO_MAX_DEPTH, 0, FAIRDAO_IMPL_ORDER);

    const Node = await hre.ethers.getContractFactory("Node");
    const _node = await Node.deploy(fairDAO, deployer, 0);
    await _node.waitForDeployment();
  
    console.log(`Deployed Contract at: ${await fairDAO.getAddress()}\n`);
    console.log(`Deployed Node at: ${await _node.getAddress()}\n`);
    console.log(`Deployed Root at: ${await fairDAO.getRoot()}\n`);

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })