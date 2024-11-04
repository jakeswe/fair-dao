const { expect } = require("chai")
const hre = require("hardhat");
const fs = require('fs');
const path = require('path');


const ROOT_OWNER = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const CHILD_OWNER = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";
const FAIRDAO_ORDER = 6;
const FAIRDAO_IMPL_ORDER = 2;
const FAIRDAO_HIRECOST = 5073566;
const FAIRDAO_IMPL_HIRECOST = 6000000;
const FAIRDAO_MAX_DEPTH = 4;

let NodeABI;

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

const loadABI = async() => {
    try {
        const data = fs.readFileSync('./artifacts/contracts/fd.sol/Node.json', 'utf8');
        NodeABI = JSON.parse(data);
    } catch (err) {
        console.error('Error reading or parsing the JSON file:', err);
    }
    return NodeABI;
}

describe("Dappazon", () => {
    let fairDAO;
    let deployer;
    let rootAddress;
    let root;

    beforeEach(async () => {
      // Setup accounts
      [deployer] = await ethers.getSigners();
      await loadABI();
      // Deploy FairDAO
      const FairDAO = await hre.ethers.getContractFactory("FairDao");
      fairDAO = await FairDAO.deploy(FAIRDAO_HIRECOST, FAIRDAO_ORDER);
      await fairDAO.waitForDeployment();
      rootAddress = await fairDAO.getRoot();
      root = new ethers.Contract(rootAddress, NodeABI["abi"], deployer);
      await recurse(deployer, fairDAO, root, FAIRDAO_IMPL_HIRECOST, FAIRDAO_MAX_DEPTH, 0, FAIRDAO_IMPL_ORDER);
  
    });
    describe("Deployed", () => {
      it("Creates Contract", async () => {
        const deployerAddress = await deployer.getAddress();
        expect(await root.getOwner()).to.equal(deployerAddress);
      })
    });

    describe("Payment", () => {
        let payedNodes = {};
        let payment = 0;
        let node;
        let nodeAddress;
        let gpAddress;
        let grandparent;
        beforeEach(async () => {
            nodeAddress = await root.getChild(0);
            node = new ethers.Contract(nodeAddress, NodeABI["abi"], deployer);
            while(await node.getLength() > 0){
                nodeAddress = await node.getChild(0);
                node = new ethers.Contract(nodeAddress, NodeABI["abi"], deployer);
            }
            const contri = await node.getContribution();
            let parentAddress = await node.getParent();
            let parent = new ethers.Contract(parentAddress, NodeABI["abi"], deployer);
            gpAddress = await parent.getParent();
            grandparent = new ethers.Contract(gpAddress, NodeABI["abi"], deployer);
            let parentContribution = await parent.getContribution();
            payment = parentContribution - contri + 1n;
            const tx = await node.sendPayment({ value: payment});
            const receipt = await tx.wait();
            const events = receipt.logs
                .map(log => node.interface.parseLog(log)) // Parse each log
                .filter(event => event.name === "NodePayedEvent");
            for (const k in events){
                payedNodes[events[k].args.node] = events[k].args.payment;
            }
        });

        it("Pays node owners", async () => {
            expect(payedNodes[rootAddress].toString()).to.equal((payment / 5n).toString());
            let nextPayment = payment - (payment / 5n);
            let nextAddress = await root.getChild(0);
            let nextNode = new ethers.Contract(nextAddress, NodeABI["abi"], deployer);
            let parent = root;
            while(await parent.getLength() > 0) {
                let tx = await parent.getChildContributions();
                let contributions;
                const receipt = await tx.wait();
                const events = receipt.logs
                    .map(log => parent.interface.parseLog(log)) // Parse each log
                    .filter(event => event.name === "GetChildContributionsEvent");
                for (const k in events){
                    contributions = events[k].args.contributions;
                }
                let contribution = await nextNode.getContribution();
                const checkPayment =  nextPayment * BigInt(contribution) / BigInt(contributions) / 5n;
                expect(payedNodes[nextAddress].toString()).to.equal((checkPayment).toString());
                parent = nextNode;
                if (await parent.getLength() > 0) {
                    nextAddress = await parent.getChild(0);
                    nextNode = new ethers.Contract(nextAddress, NodeABI["abi"], deployer);
                    nextPayment = checkPayment * 4n;
                }
            } 
        });

        it("Checks promotion", async () => {
            expect(await node.getParent()).to.equal(await grandparent.getAddress());
        });
    });


    describe("Insertion", () => {
        let node;
        let nodeAddress;
        beforeEach(async () => {
            const tx = await fairDAO.insert(rootAddress, CHILD_OWNER);
            const receipt = await tx.wait();
            const events = receipt.logs
                .map(log => fairDAO.interface.parseLog(log)) // Parse each log
                .filter(event => event.name === "ChildAddedEvent");
            for (const k in events){
                nodeAddress = events[k].args.child;
            }
            node = new ethers.Contract(nodeAddress, NodeABI["abi"], deployer); 
        });

        it("Checks node added", async () => {
            expect(await node.getParent()).to.equal(rootAddress);
        });
    });
});