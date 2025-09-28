const { ethers } = require("hardhat");

async function main() {
  console.log("🎓 Granting access to all exams for all students...");
  
  // 获取合约实例
  const contractAddress = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";
  const [deployer, teacher, student1, student2] = await ethers.getSigners();
  
  const AnonExam = await ethers.getContractFactory("AnonExam");
  const anonExam = AnonExam.attach(contractAddress);
  
  console.log("📋 Contract address:", contractAddress);
  
  // 所有学生账户
  const students = [
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // student1
    "0x90F79bf6EB2c4f870365E785982E1f101E93b906", // student2
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // deployer也可以作为学生
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // teacher也可以作为学生测试
  ];
  
  try {
    // 获取考试总数
    const totalExams = await anonExam.getTotalExams();
    console.log("📊 Total exams:", totalExams.toString());
    
    // 为每个考试授权所有学生
    for (let examId = 1; examId <= totalExams; examId++) {
      console.log(`\n📝 Processing exam ${examId}:`);
      
      // 获取考试信息
      const examInfo = await anonExam.getExamInfo(examId);
      console.log(`   Title: ${examInfo.title}`);
      console.log(`   Published: ${examInfo.isPublished}`);
      console.log(`   Questions: ${examInfo.questionCount}`);
      
      // 如果考试已发布，授权学生访问
      if (examInfo.isPublished) {
        try {
          const grantTx = await anonExam.grantExamAccess(examId, students);
          await grantTx.wait();
          console.log(`   ✅ Access granted to all students`);
        } catch (error) {
          if (error.message.includes("already")) {
            console.log(`   ℹ️  Access already granted`);
          } else {
            console.log(`   ❌ Failed to grant access:`, error.message);
          }
        }
      } else {
        // 如果考试未发布，尝试发布（如果有题目）
        if (examInfo.questionCount > 0) {
          try {
            const publishTx = await anonExam.publishExam(examId);
            await publishTx.wait();
            console.log(`   ✅ Exam published`);
            
            // 发布后授权访问
            const grantTx = await anonExam.grantExamAccess(examId, students);
            await grantTx.wait();
            console.log(`   ✅ Access granted to all students`);
          } catch (error) {
            console.log(`   ❌ Failed to publish/grant:`, error.message);
          }
        } else {
          console.log(`   ⚠️  Exam has no questions, cannot publish`);
        }
      }
      
      // 验证每个学生的访问权限
      for (const student of students) {
        const hasAccess = await anonExam.hasAccessToExam(examId, student);
        console.log(`   Student ${student.slice(0, 6)}...${student.slice(-4)}: ${hasAccess ? '✅' : '❌'}`);
      }
    }
    
  } catch (error) {
    console.error("❌ Operation failed:", error.message);
  }
}

main()
  .then(() => {
    console.log("\n🎉 Access management completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  });

