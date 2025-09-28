const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing AnonExam contract...");
  
  // 获取合约实例
  const contractAddress = "0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44";
  const [deployer] = await ethers.getSigners();
  
  const AnonExam = await ethers.getContractFactory("AnonExam");
  const anonExam = AnonExam.attach(contractAddress);
  
  console.log("📋 Contract address:", contractAddress);
  console.log("📋 Deployer address:", deployer.address);
  
  // 测试 getTotalExams
  try {
    const totalExams = await anonExam.getTotalExams();
    console.log("✅ getTotalExams() works:", totalExams.toString());
  } catch (error) {
    console.error("❌ getTotalExams() failed:", error.message);
    return;
  }
  
  // 创建一个测试考试
  try {
    const startTime = Math.floor(Date.now() / 1000) + 60; // 1分钟后开始
    const endTime = startTime + 3600; // 1小时后结束
    
    console.log("📝 Creating test exam...");
    const tx = await anonExam.createExam(
      "FHEVM测试考试",
      "测试FHEVM加密考试功能",
      startTime,
      endTime,
      60, // 60分钟时长
      100 // 总分100分
    );
    
    console.log("⏳ Transaction hash:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ Exam created successfully!");
    
    // 再次检查总考试数
    const newTotalExams = await anonExam.getTotalExams();
    console.log("📊 New total exams:", newTotalExams.toString());
    
    // 获取考试信息
    if (newTotalExams > 0) {
      const examInfo = await anonExam.getExamInfo(newTotalExams);
      console.log("📋 Exam info:", {
        title: examInfo.title,
        description: examInfo.description,
        teacher: examInfo.teacher,
        questionCount: examInfo.questionCount,
        isPublished: examInfo.isPublished,
      });
    }
    
  } catch (error) {
    console.error("❌ Create exam failed:", error.message);
  }
}

main()
  .then(() => {
    console.log("🎉 Contract test completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
