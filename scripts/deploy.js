const hre = require("hardhat")

async function main() {
    // Setup accounts
    const [deployer] = await ethers.getSigners();
  
    // Deploy FairDAO
    const FairDAO = await hre.ethers.getContractFactory("FairDao");
    const fairDAO = await FairDAO.deploy(5073566, 3);
    await fairDAO.waitForDeployment();

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