"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ethers } from "ethers";
import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { GenericStringStorage } from "@/fhevm/GenericStringStorage";
import { TIME_CONSTANTS } from "@/fhevm/internal/constants";

// 类型定义
export interface ExamInfo {
  examId: bigint;
  title: string;
  description: string;
  teacher: string;
  startTime: bigint;
  endTime: bigint;
  duration: bigint;
  questionCount: number;
  isPublished: boolean;
  status: number;
  submissionStatus?: SubmissionStatus; // 学生的提交状态
  studentScore?: number; // 学生的分数
  maxScore?: number; // 考试总分
}

export interface QuestionInfo {
  questionType: number;
  questionText: string;
  options: string[];
}

export interface SubmissionStatus {
  isSubmitted: boolean;
  submitTime: bigint;
  isGraded: boolean;
}

export enum QuestionType {
  MultipleChoice = 0,
  FillInBlank = 1,
  ShortAnswer = 2,
}

export enum ExamStatus {
  NotStarted = 0,
  InProgress = 1,
  Ended = 2,
  Graded = 3,
}

// Hook参数接口
interface UseAnonExamParams {
  instance: FhevmInstance | undefined;
  storage: GenericStringStorage;
  contractAddress: string | undefined;
  signer: ethers.JsonRpcSigner | undefined;
  readonlyProvider: ethers.ContractRunner | undefined;
  chainId: number | undefined;
  sameChain: (chainId: number | undefined) => boolean;
  sameSigner: (signer: ethers.JsonRpcSigner | undefined) => boolean;
  userAddress: string | undefined;
}

// 合约ABI（简化版，实际使用时应该从生成的ABI文件导入）
const ANONEXAM_ABI = [
  "function getTotalExams() external view returns (uint256)",
  "function getExamInfo(uint256 examId) external view returns (string title, string description, address teacher, uint256 startTime, uint256 endTime, uint256 duration, uint8 questionCount, bool isPublished, uint8 status)",
  "function getQuestionInfo(uint256 examId, uint8 questionIndex) external view returns (uint8 questionType, string questionText, string[] options)",
  "function getSubmissionStatus(uint256 examId, address student) external view returns (bool isSubmitted, uint256 submitTime, bool isGraded)",
  "function submitAnswers(uint256 examId, bytes32[] encryptedAnswers, bytes[] answersProof) external",
  "function createExam(string title, string description, uint256 startTime, uint256 endTime, uint256 duration, uint256 maxScore) external returns (uint256)",
  "function addQuestion(uint256 examId, uint8 questionType, string questionText, string[] options, bytes32 correctAnswerInput, bytes correctAnswerProof, bytes32 pointsInput, bytes pointsProof) external",
  "function publishExam(uint256 examId) external",
  "function autoGradeMultipleChoice(uint256 examId, address student) external",
  "function manualGrade(uint256 examId, address student, bytes32 scoreInput, bytes scoreProof, string comment) external",
  "function getStudentGrade(uint256 examId, address student) external view returns (bytes32 encryptedScore, bytes32 encryptedGradeLevel, bool isPublished, string comment)",
  "event ExamCreated(uint256 indexed examId, address indexed teacher, string title)",
  "event AnswerSubmitted(uint256 indexed examId, address indexed student, uint256 submitTime)",
  "event ExamGraded(uint256 indexed examId, address indexed student, address indexed teacher)",
];

export function useAnonExam(params: UseAnonExamParams) {
  const {
    instance,
    storage,
    contractAddress,
    signer,
    readonlyProvider,
    chainId,
    sameChain,
    sameSigner,
    userAddress,
  } = params;

  // 状态管理
  const [exams, setExams] = useState<ExamInfo[]>([]);
  const [currentExam, setCurrentExam] = useState<ExamInfo | null>(null);
  const [questions, setQuestions] = useState<QuestionInfo[]>([]);
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");

  // 操作状态
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingExam, setIsCreatingExam] = useState(false);
  const [isGrading, setIsGrading] = useState(false);

  // 引用
  const isLoadingRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const currentExamRef = useRef<ExamInfo | null>(null);
  const signerRef = useRef<ethers.JsonRpcSigner | undefined>(undefined);
  const chainIdRef = useRef<number | undefined>(undefined);

  // 更新引用
  currentExamRef.current = currentExam;
  signerRef.current = signer;
  chainIdRef.current = chainId;

  // 创建合约实例
  const contract = useMemo(() => {
    if (!contractAddress || !readonlyProvider) return null;
    return new ethers.Contract(contractAddress, ANONEXAM_ABI, readonlyProvider);
  }, [contractAddress, readonlyProvider]);

  const writeContract = useMemo(() => {
    if (!contractAddress || !signer) {
      console.log("[useAnonExam] writeContract not available:", { contractAddress, hasSigner: !!signer });
      return null;
    }
    
    console.log("[useAnonExam] Creating write contract with signer:", signer);
    return new ethers.Contract(contractAddress, ANONEXAM_ABI, signer);
  }, [contractAddress, signer]);

  // 获取所有考试
  const loadExams = useCallback(async () => {
    if (!contract || isLoadingRef.current) return;

    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      console.log("[useAnonExam] Loading exams...");
      
      const totalExams = await contract.getTotalExams();
      console.log("[useAnonExam] Total exams from contract:", totalExams.toString());
      
      const examPromises: Promise<ExamInfo>[] = [];

      for (let i = 1; i <= totalExams; i++) {
        examPromises.push(
          contract.getExamInfo(i).then(async (info: any) => {
            // 获取学生的提交状态和分数（如果有用户地址）
            let submissionStatus: SubmissionStatus | undefined;
            let studentScore: number | undefined;
            let maxScore: number | undefined;
            
            if (userAddress) {
              try {
                const status = await contract.getSubmissionStatus(i, userAddress);
                submissionStatus = {
                  isSubmitted: status.isSubmitted,
                  submitTime: status.submitTime,
                  isGraded: status.isGraded,
                };
                
                // 如果已评分，尝试获取分数
                if (status.isGraded) {
                  try {
                    const gradeInfo = await contract.getStudentGrade(i, userAddress);
                    // 这里需要解密分数，但需要FHEVM实例
                    // 暂时先获取加密的分数句柄，解密在组件中进行
                    console.log(`[useAnonExam] Grade info for exam ${i}:`, gradeInfo);
                  } catch (error) {
                    console.log(`[useAnonExam] Could not get grade for exam ${i}:`, error);
                  }
                }
              } catch (error) {
                // 如果获取失败，可能是没有权限或未提交
                console.log(`[useAnonExam] Could not get submission status for exam ${i}:`, error);
              }
            }
            
            return {
              examId: BigInt(i),
              title: info.title,
              description: info.description,
              teacher: info.teacher,
              startTime: info.startTime,
              endTime: info.endTime,
              duration: info.duration,
              questionCount: info.questionCount,
              isPublished: info.isPublished,
              status: info.status,
              submissionStatus,
              studentScore,
              maxScore: 100, // 可以从合约获取，暂时硬编码
            };
          })
        );
      }

      const examList = await Promise.all(examPromises);
      setExams(examList);
      console.log(`[useAnonExam] Loaded ${examList.length} exams`);
    } catch (err) {
      console.error("[useAnonExam] Failed to load exams:", err);
      setError(err instanceof Error ? err.message : "Failed to load exams");
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [contract, userAddress]);

  // 加载考试详情
  const loadExamDetails = useCallback(async (examId: bigint) => {
    if (!contract) return;

    try {
      console.log(`[useAnonExam] Loading exam details for ID: ${examId}`);
      
      const examInfo = await contract.getExamInfo(examId);
      const exam: ExamInfo = {
        examId,
        title: examInfo.title,
        description: examInfo.description,
        teacher: examInfo.teacher,
        startTime: examInfo.startTime,
        endTime: examInfo.endTime,
        duration: examInfo.duration,
        questionCount: examInfo.questionCount,
        isPublished: examInfo.isPublished,
        status: examInfo.status,
      };

      setCurrentExam(exam);

      // 加载题目
      if (exam.questionCount > 0) {
        const questionPromises: Promise<QuestionInfo>[] = [];
        
        for (let i = 0; i < exam.questionCount; i++) {
          questionPromises.push(
            contract.getQuestionInfo(examId, i).then((info: any) => ({
              questionType: info.questionType,
              questionText: info.questionText,
              options: info.options,
            }))
          );
        }

        const questionList = await Promise.all(questionPromises);
        setQuestions(questionList);
        console.log(`[useAnonExam] Loaded ${questionList.length} questions`);
      }

      // 如果是学生，加载提交状态
      if (signer) {
        const userAddress = await signer.getAddress();
        const status = await contract.getSubmissionStatus(examId, userAddress);
        setSubmissionStatus({
          isSubmitted: status.isSubmitted,
          submitTime: status.submitTime,
          isGraded: status.isGraded,
        });
      }
    } catch (err) {
      console.error("[useAnonExam] Failed to load exam details:", err);
      setError(err instanceof Error ? err.message : "Failed to load exam details");
    }
  }, [contract, signer]);

  // 提交答案
  const submitAnswers = useCallback(async (examId: bigint, answers: (string | number | boolean)[]) => {
    console.log("[useAnonExam] submitAnswers called:", { examId, answers });
    console.log("[useAnonExam] Dependencies:", {
      hasInstance: !!instance,
      hasWriteContract: !!writeContract,
      hasSigner: !!signer,
      isSubmitting: isSubmittingRef.current,
      contractAddress
    });

    if (!instance) {
      throw new Error("FHEVM实例未准备就绪");
    }

    if (!writeContract) {
      throw new Error("写入合约未准备就绪");
    }

    if (!signer) {
      throw new Error("签名者未准备就绪");
    }

    if (isSubmittingRef.current) {
      console.log("[useAnonExam] Already submitting");
      return;
    }

    const thisExamId = examId;
    const thisSigner = signer;
    const thisChainId = chainId;

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setMessage("正在加密答案...");

    try {
      const userAddress = await signer.getAddress();
      console.log("[useAnonExam] User address:", userAddress);
      
      // 检查操作是否过期
      const isStale = () => {
        const staleCheck = {
          examIdChanged: thisExamId !== currentExamRef.current?.examId,
          chainChanged: !sameChain(thisChainId),
          signerChanged: !sameSigner(thisSigner),
        };
        
        console.log("[useAnonExam] Stale check:", staleCheck);
        
        return staleCheck.examIdChanged || staleCheck.chainChanged || staleCheck.signerChanged;
      };

      // 创建加密输入
      console.log("[useAnonExam] Creating encrypted input...");
      const input = instance.createEncryptedInput(contractAddress!, userAddress);
      
      // 添加答案到加密输入
      answers.forEach((answer, index) => {
        console.log(`[useAnonExam] Adding answer ${index}:`, answer, typeof answer);
        
        if (typeof answer === 'boolean') {
          input.addBool(answer);
        } else if (typeof answer === 'number') {
          console.log(`[useAnonExam] Adding number answer:`, answer);
          input.add32(answer);
        } else {
          // 字符串转换为数字（最简单的处理）
          const answerStr = String(answer).trim();
          console.log(`[useAnonExam] Processing string answer: "${answerStr}"`);
          
          if (answerStr === '') {
            console.log(`[useAnonExam] Empty answer, encoding as 0`);
            input.add32(0);
          } else {
            // 直接尝试转换为数字，如果失败就用0
            const numValue = parseInt(answerStr);
            if (!isNaN(numValue)) {
              console.log(`[useAnonExam] String "${answerStr}" converted to number: ${numValue}`);
              input.add32(numValue);
            } else {
              // 非数字字符串，使用字符串长度作为简单编码
              console.log(`[useAnonExam] Non-numeric string "${answerStr}", using length: ${answerStr.length}`);
              input.add32(answerStr.length);
            }
          }
        }
      });

      setMessage("正在生成零知识证明...");
      
      // 延迟执行加密以避免UI冻结
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log("[useAnonExam] Encrypting answers...");
      const encrypted = await input.encrypt();
      console.log("[useAnonExam] Encryption completed:", encrypted);

      const staleResult = isStale();
      console.log("[useAnonExam] Stale check result:", staleResult);
      
      // 临时禁用stale检查以测试合约调用
      if (false && staleResult) {
        console.log("[useAnonExam] Operation is stale, cancelling");
        setMessage("操作已取消 - 可能是signer变化导致");
        return;
      }

      setMessage("正在提交答案到区块链...");
      console.log("[useAnonExam] About to submit to contract");
      console.log("[useAnonExam] writeContract:", writeContract);
      console.log("[useAnonExam] examId:", examId);
      console.log("[useAnonExam] encrypted.handles:", encrypted.handles);
      console.log("[useAnonExam] encrypted.inputProof:", encrypted.inputProof);

      // 提交到合约
      console.log("[useAnonExam] Submitting to contract...");
      const tx = await writeContract.submitAnswers(
        examId,
        encrypted.handles,
        encrypted.handles.map(() => encrypted.inputProof) // 每个答案使用相同的证明
      );
      
      console.log("[useAnonExam] Transaction sent:", tx.hash);

      setMessage(`等待交易确认: ${tx.hash}`);
      const receipt = await tx.wait();

      if (isStale()) {
        setMessage("操作已取消");
        return;
      }

      setMessage(`答案提交成功！交易状态: ${receipt?.status}`);
      
      // 刷新提交状态
      await loadExamDetails(examId);
      
      // 返回成功状态，让前端处理页面跳转
      return { success: true, examId };
    } catch (err) {
      console.error("[useAnonExam] Failed to submit answers:", err);
      setMessage(`提交失败: ${err instanceof Error ? err.message : "未知错误"}`);
      throw err;
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [instance, writeContract, signer, chainId, contractAddress, sameChain, sameSigner, loadExamDetails]);

  // 解密学生自己的分数
  const decryptStudentScore = useCallback(async (examId: bigint): Promise<number | null> => {
    if (!instance || !contract || !signer || !userAddress) return null;

    try {
      console.log(`[useAnonExam] Decrypting student score for exam ${examId}`);
      
      // 获取加密的分数
      const gradeInfo = await contract.getStudentGrade(examId, userAddress);
      
      // 构建解密签名
      const sig = await FhevmDecryptionSignature.loadOrSign(
        instance,
        [contractAddress!],
        signer,
        storage
      );

      if (!sig) {
        throw new Error("无法创建解密签名");
      }

      // 解密分数
      const decryptResults = await instance.userDecrypt(
        [{ handle: gradeInfo.encryptedScore, contractAddress: contractAddress! }],
        sig.privateKey,
        sig.publicKey,
        sig.signature,
        sig.contractAddresses,
        sig.userAddress,
        sig.startTimestamp,
        sig.durationDays
      );

      const score = Number(decryptResults[gradeInfo.encryptedScore]);
      console.log(`[useAnonExam] Decrypted student score: ${score}`);
      return score;
      
    } catch (err) {
      console.error(`[useAnonExam] Failed to decrypt student score:`, err);
      return null;
    }
  }, [instance, contract, signer, userAddress, contractAddress, storage]);

  // 解密成绩
  const decryptGrade = useCallback(async (examId: bigint) => {
    if (!instance || !contract || !signer) return null;

    try {
      console.log(`[useAnonExam] Decrypting grade for exam ${examId}`);
      
      const userAddress = await signer.getAddress();
      const gradeInfo = await contract.getStudentGrade(examId, userAddress);
      
      if (!gradeInfo.isPublished) {
        throw new Error("成绩尚未发布");
      }

      // 构建解密签名
      const sig = await FhevmDecryptionSignature.loadOrSign(
        instance,
        [contractAddress!],
        signer,
        storage
      );

      if (!sig) {
        throw new Error("无法创建解密签名");
      }

      // 解密分数和等级
      const decryptResults = await instance.userDecrypt(
        [
          { handle: gradeInfo.encryptedScore, contractAddress: contractAddress! },
          { handle: gradeInfo.encryptedGradeLevel, contractAddress: contractAddress! }
        ],
        sig.privateKey,
        sig.publicKey,
        sig.signature,
        sig.contractAddresses,
        sig.userAddress,
        sig.startTimestamp,
        sig.durationDays
      );

      return {
        score: decryptResults[gradeInfo.encryptedScore],
        gradeLevel: decryptResults[gradeInfo.encryptedGradeLevel],
        comment: gradeInfo.comment,
      };
    } catch (err) {
      console.error("[useAnonExam] Failed to decrypt grade:", err);
      throw err;
    }
  }, [instance, contract, signer, contractAddress, storage]);

  // 创建考试（教师功能）
  const createExam = useCallback(async (examData: {
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
    duration: number;
    questions: any[];
    maxScore: number;
  }) => {
    console.log("[useAnonExam] createExam called with:", examData);
    console.log("[useAnonExam] createExam state check:", {
      hasWriteContract: !!writeContract,
      hasInstance: !!instance,
      hasSigner: !!signer,
      hasContractAddress: !!contractAddress,
      instanceType: instance ? instance.constructor.name : 'undefined'
    });
    
    if (!writeContract) {
      console.error("[useAnonExam] No write contract available");
      setMessage("合约未连接");
      return null;
    }

    if (isCreatingExam) {
      console.log("[useAnonExam] Already creating exam");
      return null;
    }

    setIsCreatingExam(true);
    setMessage("正在创建考试...");

    try {
      const startTimestamp = Math.floor(examData.startTime.getTime() / 1000);
      const endTimestamp = Math.floor(examData.endTime.getTime() / 1000);

      console.log("[useAnonExam] Calling contract.createExam with:", {
        title: examData.title,
        description: examData.description,
        startTimestamp,
        endTimestamp,
        duration: examData.duration,
        maxScore: examData.maxScore
      });

      // 1. 创建考试
      const createTx = await writeContract.createExam(
        examData.title,
        examData.description,
        startTimestamp,
        endTimestamp,
        examData.duration,
        examData.maxScore
      );

      setMessage(`等待考试创建确认: ${createTx.hash}`);
      const createReceipt = await createTx.wait();
      console.log("[useAnonExam] Exam created:", createReceipt);

      // 2. 获取新创建的考试ID
      const totalExams = await writeContract.getTotalExams();
      const newExamId = totalExams;
      console.log("[useAnonExam] New exam ID:", newExamId.toString());

        // 3. 添加题目（如果有）
        if (examData.questions && examData.questions.length > 0) {
          setMessage(`正在添加 ${examData.questions.length} 道题目...`);
          
          // 确保FHEVM实例可用
          if (!instance) {
            throw new Error("FHEVM实例未准备就绪，请稍后重试");
          }
          
          if (!signer) {
            throw new Error("钱包签名器未准备就绪");
          }
          
          for (let i = 0; i < examData.questions.length; i++) {
            const question = examData.questions[i];
            console.log(`[useAnonExam] Adding question ${i + 1}:`, question);
            
            // 创建加密的正确答案
            const userAddress = await signer.getAddress();
            const correctAnswerInput = instance.createEncryptedInput(contractAddress!, userAddress);
          
          if (typeof question.correctAnswer === 'number') {
            correctAnswerInput.add32(question.correctAnswer);
          } else {
            // 字符串答案转为数字hash或使用简单编码
            const answerCode = question.correctAnswer.toString().length; // 简化：使用长度作为编码
            correctAnswerInput.add32(answerCode);
          }
          
          const correctAnswerEnc = await correctAnswerInput.encrypt();
          
          // 创建加密的分值
          const pointsInput = instance.createEncryptedInput(contractAddress!, userAddress);
          pointsInput.add8(question.points);
          const pointsEnc = await pointsInput.encrypt();
          
          // 确定题目类型
          let questionType = 0; // 默认选择题
          if (question.type === 'fill-blank') questionType = 1;
          if (question.type === 'short-answer') questionType = 2;
          
          // 添加题目到合约
          const addQuestionTx = await writeContract.addQuestion(
            newExamId,
            questionType,
            question.question,
            question.options || [],
            correctAnswerEnc.handles[0],
            correctAnswerEnc.inputProof,
            pointsEnc.handles[0],
            pointsEnc.inputProof
          );
          
          await addQuestionTx.wait();
          console.log(`[useAnonExam] Question ${i + 1} added successfully`);
        }
        
        // 4. 发布考试
        setMessage("正在发布考试...");
        const publishTx = await writeContract.publishExam(newExamId);
        await publishTx.wait();
        console.log("[useAnonExam] Exam published");
      }

      setMessage(`考试创建成功！考试ID: ${newExamId}`);
      
      // 刷新考试列表
      await loadExams();
      
      return newExamId;
    } catch (err) {
      console.error("[useAnonExam] Failed to create exam:", err);
      setMessage(`创建失败: ${err instanceof Error ? err.message : "未知错误"}`);
      throw err;
    } finally {
      setIsCreatingExam(false);
    }
  }, [writeContract, isCreatingExam, loadExams]);

  // 自动初始化
  useEffect(() => {
    if (contract && !isLoadingRef.current) {
      loadExams();
    }
  }, [contract]); // 移除loadExams依赖，避免死循环

  // 计算派生状态
  const canSubmitAnswers = useMemo(() => {
    return !!(
      instance &&
      writeContract &&
      signer &&
      currentExam &&
      !isSubmitting &&
      !submissionStatus?.isSubmitted &&
      currentExam.isPublished
    );
  }, [instance, writeContract, signer, currentExam, isSubmitting, submissionStatus]);

  const canCreateExam = useMemo(() => {
    return !!(
      writeContract && 
      instance && 
      signer && 
      contractAddress && 
      !isCreatingExam
    );
  }, [writeContract, instance, signer, contractAddress, isCreatingExam]);

  return {
    // 数据
    exams,
    currentExam,
    questions,
    submissionStatus,
    
    // 状态
    isLoading,
    isSubmitting,
    isCreatingExam,
    isGrading,
    error,
    message,
    
    // 能力检查
    canSubmitAnswers,
    canCreateExam,
    
    // 方法
    loadExams,
    loadExamDetails,
    submitAnswers,
    decryptGrade,
    decryptStudentScore,
    createExam,
    
    // 设置器
    setCurrentExam,
    setError,
    setMessage,
  };
}
