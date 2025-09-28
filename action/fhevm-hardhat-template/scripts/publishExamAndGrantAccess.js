const { ethers } = require("hardhat");

async function main() {
  console.log("📚 Publishing exam and granting student access...");
  
  // 获取合约实例
  const contractAddress = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";
  const [deployer, teacher, student1, student2] = await ethers.getSigners();
  
  const AnonExam = await ethers.getContractFactory("AnonExam");
  const anonExam = AnonExam.attach(contractAddress);
  
  console.log("📋 Contract address:", contractAddress);
  console.log("📋 Teacher address:", deployer.address);
  console.log("📋 Student addresses:", [student1.address, student2.address]);
  
  try {
    // 1. 获取考试总数
    const totalExams = await anonExam.getTotalExams();
    console.log("📊 Total exams:", totalExams.toString());
    
    if (totalExams == 0) {
      console.log("❌ No exams found. Creating one first...");
      
      // 创建考试
      const startTime = Math.floor(Date.now() / 1000) + 60; // 1分钟后开始
      const endTime = startTime + 3600; // 1小时后结束
      
      const createTx = await anonExam.createExam(
        "JavaScript基础测试",
        "测试JavaScript基本概念，学生可以参加",
        startTime,
        endTime,
        60, // 60分钟时长
        100 // 总分100分
      );
      
      await createTx.wait();
      console.log("✅ Test exam created!");
    }
    
    const examId = 1; // 使用第一个考试
    
    // 2. 发布考试
    console.log("📢 Publishing exam...");
    const publishTx = await anonExam.publishExam(examId);
    await publishTx.wait();
    console.log("✅ Exam published successfully!");
    
    // 3. 授权学生访问
    console.log("🎓 Granting student access...");
    const students = [student1.address, student2.address, deployer.address]; // 包括部署者作为学生测试
    
    const grantTx = await anonExam.grantExamAccess(examId, students);
    await grantTx.wait();
    console.log("✅ Student access granted!");
    
    // 4. 验证考试状态
    const examInfo = await anonExam.getExamInfo(examId);
    console.log("📋 Exam status:", {
      title: examInfo.title,
      isPublished: examInfo.isPublished,
      questionCount: examInfo.questionCount,
    });
    
    // 5. 验证学生访问权限
    for (const student of students) {
      const hasAccess = await anonExam.hasAccessToExam(examId, student);
      console.log(`📋 Student ${student.slice(0, 6)}...${student.slice(-4)} has access:`, hasAccess);
    }
    
  } catch (error) {
    console.error("❌ Operation failed:", error.message);
  }
}

main()
  .then(() => {
    console.log("🎉 Exam setup completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  });

