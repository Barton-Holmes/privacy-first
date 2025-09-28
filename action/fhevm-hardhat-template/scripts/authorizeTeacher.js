const { ethers } = require("hardhat");

async function main() {
  console.log("🎓 Authorizing teacher...");
  
  // 获取合约实例
  const contractAddress = "0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44";
  const [deployer, teacher] = await ethers.getSigners();
  
  const AnonExam = await ethers.getContractFactory("AnonExam");
  const anonExam = AnonExam.attach(contractAddress);
  
  console.log("📋 Contract address:", contractAddress);
  console.log("📋 Deployer address:", deployer.address);
  console.log("📋 Teacher to authorize:", teacher.address);
  
  try {
    // 授权第二个账户为教师
    const tx = await anonExam.connect(deployer).authorizeTeacher(teacher.address);
    console.log("⏳ Authorization transaction:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("✅ Teacher authorized successfully!");
    
    // 验证授权
    const isAuthorized = await anonExam.authorizedTeachers(teacher.address);
    console.log("📋 Is teacher authorized:", isAuthorized);
    
  } catch (error) {
    console.error("❌ Authorization failed:", error.message);
  }
}

main()
  .then(() => {
    console.log("🎉 Authorization completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Authorization failed:", error);
    process.exit(1);
  });
