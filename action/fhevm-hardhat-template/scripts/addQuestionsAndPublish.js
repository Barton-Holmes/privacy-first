const { ethers } = require("hardhat");

async function main() {
  console.log("📝 Adding questions and publishing exam...");
  
  // 获取合约实例
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const [deployer] = await ethers.getSigners();
  
  const AnonExam = await ethers.getContractFactory("AnonExam");
  const anonExam = AnonExam.attach(contractAddress);
  
  // 初始化FHEVM
  await hre.fhevm.initializeCLIApi();
  const fhevmInstance = await hre.fhevm.createInstance();
  
  console.log("📋 Contract address:", contractAddress);
  console.log("📋 Teacher address:", deployer.address);
  
  const examId = 1;
  
  try {
    // 1. 添加第一道选择题
    console.log("📝 Adding multiple choice question...");
    
    // 创建加密的正确答案 (选择题答案: 0=A, 1=B, 2=C, 3=D)
    const correctAnswerInput = hre.fhevm.createEncryptedInput(contractAddress, deployer.address);
    correctAnswerInput.add32(2); // 正确答案是C (索引2)
    const correctAnswerEnc = await correctAnswerInput.encrypt();
    
    // 创建加密的分值
    const pointsInput = hre.fhevm.createEncryptedInput(contractAddress, deployer.address);
    pointsInput.add8(25); // 25分
    const pointsEnc = await pointsInput.encrypt();
    
    const addQ1Tx = await anonExam.addQuestion(
      examId,
      0, // MultipleChoice
      "JavaScript中哪个关键字用于声明常量？",
      ["var", "let", "const", "function"],
      correctAnswerEnc.handles[0],
      correctAnswerEnc.inputProof,
      pointsEnc.handles[0],
      pointsEnc.inputProof
    );
    await addQ1Tx.wait();
    console.log("✅ Question 1 added!");
    
    // 2. 添加第二道填空题
    console.log("📝 Adding fill-in-blank question...");
    
    const answer2Input = hre.fhevm.createEncryptedInput(contractAddress, deployer.address);
    answer2Input.add32(42); // 正确答案是42
    const answer2Enc = await answer2Input.encrypt();
    
    const points2Input = hre.fhevm.createEncryptedInput(contractAddress, deployer.address);
    points2Input.add8(25); // 25分
    const points2Enc = await points2Input.encrypt();
    
    const addQ2Tx = await anonExam.addQuestion(
      examId,
      1, // FillInBlank
      "JavaScript中数组的length属性返回什么类型的值？（请输入数字）",
      [], // 填空题没有选项
      answer2Enc.handles[0],
      answer2Enc.inputProof,
      points2Enc.handles[0],
      points2Enc.inputProof
    );
    await addQ2Tx.wait();
    console.log("✅ Question 2 added!");
    
    // 3. 添加第三道简答题
    console.log("📝 Adding short answer question...");
    
    const answer3Input = hre.fhevm.createEncryptedInput(contractAddress, deployer.address);
    answer3Input.add32(1); // 简答题用数字1表示标准答案
    const answer3Enc = await answer3Input.encrypt();
    
    const points3Input = hre.fhevm.createEncryptedInput(contractAddress, deployer.address);
    points3Input.add8(50); // 50分
    const points3Enc = await points3Input.encrypt();
    
    const addQ3Tx = await anonExam.addQuestion(
      examId,
      2, // ShortAnswer
      "请简述JavaScript闭包的概念和作用。",
      [], // 简答题没有选项
      answer3Enc.handles[0],
      answer3Enc.inputProof,
      points3Enc.handles[0],
      points3Enc.inputProof
    );
    await addQ3Tx.wait();
    console.log("✅ Question 3 added!");
    
    // 4. 发布考试
    console.log("📢 Publishing exam...");
    const publishTx = await anonExam.publishExam(examId);
    await publishTx.wait();
    console.log("✅ Exam published successfully!");
    
    // 5. 授权学生访问
    console.log("🎓 Granting student access...");
    const students = [
      "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // student1
      "0x90F79bf6EB2c4f870365E785982E1f101E93b906", // student2
      deployer.address // 部署者也可以作为学生测试
    ];
    
    const grantTx = await anonExam.grantExamAccess(examId, students);
    await grantTx.wait();
    console.log("✅ Student access granted!");
    
    // 6. 验证最终状态
    const examInfo = await anonExam.getExamInfo(examId);
    console.log("📋 Final exam status:", {
      title: examInfo.title,
      isPublished: examInfo.isPublished,
      questionCount: examInfo.questionCount,
    });
    
    // 验证学生访问权限
    for (const student of students) {
      const hasAccess = await anonExam.hasAccessToExam(examId, student);
      console.log(`📋 Student ${student.slice(0, 6)}...${student.slice(-4)} has access:`, hasAccess);
    }
    
  } catch (error) {
    console.error("❌ Operation failed:", error.message);
    console.error("Full error:", error);
  }
}

main()
  .then(() => {
    console.log("🎉 Exam setup completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  });
