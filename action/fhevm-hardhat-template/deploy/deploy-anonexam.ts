import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedAnonExam = await deploy("AnonExam", {
    from: deployer,
    log: true,
    waitConfirmations: 1,
  });

  console.log(`AnonExam contract deployed to: ${deployedAnonExam.address}`);
  
  // 可选：验证合约
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await new Promise(resolve => setTimeout(resolve, 60000)); // 等待1分钟
    
    try {
      await hre.run("verify:verify", {
        address: deployedAnonExam.address,
        constructorArguments: [],
      });
    } catch (error) {
      console.log("Verification failed:", error);
    }
  }
};

export default func;
func.id = "deploy_anonexam";
func.tags = ["AnonExam"];

