import { task } from "hardhat/config";
import type { AnonExam } from "../types/contracts/AnonExam";

task("anonexam:create", "Create a new exam")
  .addParam("title", "Exam title")
  .addParam("description", "Exam description")
  .addParam("duration", "Exam duration in minutes")
  .addParam("maxscore", "Maximum score")
  .setAction(async (taskArgs, hre) => {
    const { ethers, deployments } = hre;
    const [deployer] = await ethers.getSigners();
    
    const anonExamDeployment = await deployments.get("AnonExam");
    const anonExam = await ethers.getContractAt("AnonExam", anonExamDeployment.address) as AnonExam;
    
    // 设置考试时间：现在开始，1小时后结束
    const startTime = Math.floor(Date.now() / 1000) + 60; // 1分钟后开始
    const endTime = startTime + 3600; // 1小时后结束
    
    const tx = await anonExam.connect(deployer).createExam(
      taskArgs.title,
      taskArgs.description,
      startTime,
      endTime,
      parseInt(taskArgs.duration),
      parseInt(taskArgs.maxscore)
    );
    
    const receipt = await tx.wait();
    console.log(`Exam created! Transaction hash: ${receipt?.hash}`);
    
    // 获取创建的考试ID
    const examCount = await anonExam.getTotalExams();
    console.log(`Exam ID: ${examCount}`);
  });

task("anonexam:list", "List all exams")
  .setAction(async (taskArgs, hre) => {
    const { ethers, deployments } = hre;
    
    const anonExamDeployment = await deployments.get("AnonExam");
    const anonExam = await ethers.getContractAt("AnonExam", anonExamDeployment.address) as AnonExam;
    
    const totalExams = await anonExam.getTotalExams();
    console.log(`Total exams: ${totalExams}`);
    
    for (let i = 1; i <= totalExams; i++) {
      try {
        const examInfo = await anonExam.getExamInfo(i);
        console.log(`\nExam ${i}:`);
        console.log(`  Title: ${examInfo.title}`);
        console.log(`  Description: ${examInfo.description}`);
        console.log(`  Teacher: ${examInfo.teacher}`);
        console.log(`  Start Time: ${new Date(Number(examInfo.startTime) * 1000).toLocaleString()}`);
        console.log(`  End Time: ${new Date(Number(examInfo.endTime) * 1000).toLocaleString()}`);
        console.log(`  Duration: ${examInfo.duration} minutes`);
        console.log(`  Questions: ${examInfo.questionCount}`);
        console.log(`  Published: ${examInfo.isPublished}`);
      } catch (error) {
        console.log(`Error getting exam ${i}:`, error);
      }
    }
  });

task("anonexam:authorize", "Authorize a teacher")
  .addParam("teacher", "Teacher address")
  .setAction(async (taskArgs, hre) => {
    const { ethers, deployments } = hre;
    const [deployer] = await ethers.getSigners();
    
    const anonExamDeployment = await deployments.get("AnonExam");
    const anonExam = await ethers.getContractAt("AnonExam", anonExamDeployment.address) as AnonExam;
    
    const tx = await anonExam.connect(deployer).authorizeTeacher(taskArgs.teacher);
    const receipt = await tx.wait();
    
    console.log(`Teacher ${taskArgs.teacher} authorized! Transaction hash: ${receipt?.hash}`);
  });

