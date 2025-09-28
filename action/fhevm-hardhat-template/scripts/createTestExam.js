const { ethers } = require("hardhat");

async function main() {
  console.log("Creating test exam...");
  
  // 获取合约实例
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const [deployer] = await ethers.getSigners();
  
  const AnonExam = await ethers.getContractFactory("AnonExam");
  const anonExam = AnonExam.attach(contractAddress);
  
  // 创建考试
  const startTime = Math.floor(Date.now() / 1000) + 60; // 1分钟后开始
  const endTime = startTime + 3600; // 1小时后结束
  
  const tx = await anonExam.createExam(
    "JavaScript基础测试",
    "测试JavaScript基本概念和语法知识",
    startTime,
    endTime,
    60, // 60分钟时长
    100 // 总分100分
  );
  
  console.log("Transaction hash:", tx.hash);
  const receipt = await tx.wait();
  console.log("Exam created successfully!");
  
  // 获取考试总数
  const totalExams = await anonExam.getTotalExams();
  console.log("Total exams:", totalExams.toString());
  
  // 获取刚创建的考试信息
  if (totalExams > 0) {
    const examInfo = await anonExam.getExamInfo(totalExams);
    console.log("Created exam info:", {
      title: examInfo.title,
      description: examInfo.description,
      teacher: examInfo.teacher,
      startTime: new Date(Number(examInfo.startTime) * 1000).toLocaleString(),
      endTime: new Date(Number(examInfo.endTime) * 1000).toLocaleString(),
      duration: examInfo.duration.toString(),
      questionCount: examInfo.questionCount,
      isPublished: examInfo.isPublished,
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

