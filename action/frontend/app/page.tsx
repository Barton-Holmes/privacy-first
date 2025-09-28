"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ExamCard } from "@/components/exam/ExamCard";
import { QuestionCard } from "@/components/exam/QuestionCard";
import { TeacherDashboard } from "@/components/teacher/TeacherDashboard";
import { GradingInterface } from "@/components/teacher/GradingInterface";
import { AccountSwitcher } from "@/components/ui/AccountSwitcher";
import { useMetaMaskProvider } from "@/hooks/metamask/useMetaMaskProvider";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useFhevm } from "@/fhevm/useFhevm";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { useAnonExam, ExamInfo, QuestionInfo } from "@/hooks/useAnonExam";
import { useResolvedSigner } from "@/hooks/useResolvedSigner";
import { Wallet, BookOpen, Users, GraduationCap, Shield, Zap, Eye, EyeOff, AlertCircle } from "lucide-react";

import { getAnonExamAddress } from "@/abi/AnonExamAddresses";
import { AnonExamABI } from "@/abi/AnonExamABI";

// 获取合约地址的辅助函数
function getContractAddress(chainId: number | undefined): string | undefined {
  return chainId ? getAnonExamAddress(chainId) : undefined;
}

type ViewMode = "home" | "student" | "teacher" | "exam" | "create" | "grading";

export default function HomePage() {
  const [viewMode, setViewMode] = useState<ViewMode>("home");
  const [selectedExam, setSelectedExam] = useState<ExamInfo | null>(null);
  const [answers, setAnswers] = useState<Record<number, string | number | boolean>>({});
  
  // 评分相关状态
  const [realSubmissions, setRealSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);

  // Hooks
  const { state: metaMaskState, connect: connectWallet } = useMetaMaskProvider();
  const { 
    provider: ethersProvider,
    readonlyProvider,
    signer: ethersSigner,
    address: userAddress,
    chainId,
    isConnected,
    sameChain,
    sameSigner,
  } = useMetaMaskEthersSigner();

  const { storage } = useInMemoryStorage();

  // 解析signer Promise
  const { signer: resolvedSigner, isResolving: isResolvingSigner } = useResolvedSigner(ethersSigner);

  const { 
    instance: fhevmInstance, 
    status: fhevmStatus, 
    error: fhevmError,
    refresh: refreshFhevm 
  } = useFhevm({
    provider: metaMaskState.provider, // 使用原始的EIP1193Provider
    chainId,
    initialMockChains: { 31337: "http://localhost:8545", 11155111: "https://ethereum-sepolia-rpc.publicnode.com" },
    enabled: isConnected,
  });

  const contractAddress = getContractAddress(chainId);

  const {
    exams,
    currentExam,
    questions,
    submissionStatus,
    isLoading,
    isSubmitting,
    isCreatingExam,
    error: examError,
    message,
    canSubmitAnswers,
    canCreateExam,
    loadExams,
    loadExamDetails,
    submitAnswers,
    decryptGrade,
    decryptStudentScore,
    createExam,
    setCurrentExam,
  } = useAnonExam({
    instance: fhevmInstance,
    storage,
    contractAddress,
    signer: resolvedSigner, // 使用解析后的signer
    readonlyProvider,
    chainId,
    sameChain,
    sameSigner,
    userAddress,
  });

  // 加载学生提交数据（仅在评分模式下）
  useEffect(() => {
    const loadSubmissions = async () => {
      if (viewMode !== "grading" || !currentExam || !contractAddress || !readonlyProvider) {
        return;
      }
      
      setLoadingSubmissions(true);
      try {
        const readContract = new ethers.Contract(contractAddress, AnonExamABI.abi, readonlyProvider);
        
        // 获取考试的所有学生
        const examStudents = await readContract.getExamStudents(currentExam.examId);
        console.log("Exam students:", examStudents);
        
        // 获取每个学生的提交状态和分数
        const submissionPromises = examStudents.map(async (studentAddress: string) => {
          try {
            const submissionStatus = await readContract.getSubmissionStatus(currentExam.examId, studentAddress);
            let currentScore: number | undefined;
            
            // 如果已评分，尝试获取和解密分数
            if (submissionStatus.isGraded) {
              try {
                // 获取加密的分数
                const gradeInfo = await readContract.getStudentGrade(currentExam.examId, studentAddress);
                
                // 解密分数
                if (fhevmInstance && resolvedSigner) {
                  const sig = await FhevmDecryptionSignature.loadOrSign(
                    fhevmInstance,
                    [contractAddress],
                    resolvedSigner,
                    storage
                  );
                  
                  if (sig) {
                    const decryptResults = await fhevmInstance.userDecrypt(
                      [{ handle: gradeInfo.encryptedScore, contractAddress }],
                      sig.privateKey,
                      sig.publicKey,
                      sig.signature,
                      sig.contractAddresses,
                      sig.userAddress,
                      sig.startTimestamp,
                      sig.durationDays
                    );
                    
                    currentScore = Number(decryptResults[gradeInfo.encryptedScore]);
                    console.log(`Decrypted score for ${studentAddress}:`, currentScore);
                  }
                }
              } catch (error) {
                console.log(`Failed to decrypt score for ${studentAddress}:`, error);
                // 如果是因为成绩未发布而失败，显示提示信息
                if (error instanceof Error && error.message.includes("Grade not published yet")) {
                  console.log(`Grade for ${studentAddress} is not published yet`);
                }
              }
            }
            
            return {
              studentAddress,
              submissionStatus: {
                isSubmitted: submissionStatus.isSubmitted,
                submitTime: submissionStatus.submitTime,
                isGraded: submissionStatus.isGraded,
              },
              currentScore,
              maxScore: 100, // 可以从合约获取
            };
          } catch (error) {
            console.log(`Failed to get submission status for ${studentAddress}:`, error);
            return null;
          }
        });
        
        const submissions = (await Promise.all(submissionPromises)).filter(Boolean);
        setRealSubmissions(submissions);
        console.log("Loaded submissions:", submissions);
        
      } catch (error) {
        console.error("Failed to load submissions:", error);
      } finally {
        setLoadingSubmissions(false);
      }
    };
    
    loadSubmissions();
  }, [viewMode, currentExam?.examId, contractAddress, readonlyProvider, fhevmInstance, resolvedSigner, storage]);

  // 调试信息
  console.log("[HomePage] useAnonExam params:", {
    hasInstance: !!fhevmInstance,
    instanceType: fhevmInstance ? fhevmInstance.constructor.name : 'undefined',
    fhevmStatus,
    fhevmError: fhevmError?.message,
    contractAddress,
    hasEthersSigner: !!ethersSigner,
    hasResolvedSigner: !!resolvedSigner,
    isResolvingSigner,
    hasReadonlyProvider: !!readonlyProvider,
    chainId,
  });

  // 处理答案变化
  const handleAnswerChange = (questionIndex: number, answer: string | number | boolean) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answer,
    }));
  };

  // 查看学生分数
  const handleViewScore = async (examId: bigint) => {
    try {
      const score = await decryptStudentScore(examId);
      if (score !== null) {
        alert(`您的分数: ${score}分`);
        // 刷新考试列表以显示分数
        await loadExams();
      } else {
        alert("无法获取分数，请稍后重试");
      }
    } catch (error) {
      console.error("查看分数失败:", error);
      alert("查看分数失败: " + (error as Error).message);
    }
  };

  // 提交答案
  const handleSubmitAnswers = async () => {
    console.log("HandleSubmitAnswers called");
    console.log("selectedExam:", selectedExam);
    console.log("currentExam:", currentExam);
    console.log("canSubmitAnswers:", canSubmitAnswers);
    console.log("answers:", answers);
    console.log("questions.length:", questions.length);

    const examToSubmit = currentExam || selectedExam;
    
    if (!examToSubmit) {
      alert("未选择考试");
      return;
    }

    if (!canSubmitAnswers) {
      alert("当前无法提交答案，请检查FHEVM连接状态");
      return;
    }

    const answerArray = Array.from({ length: questions.length }, (_, index) => 
      answers[index] ?? ""
    );

    console.log("Answer array to submit:", answerArray);
    console.log("Using exam:", examToSubmit);

    try {
      const result = await submitAnswers(examToSubmit.examId, answerArray);
      if (result?.success) {
        alert("答案提交成功！");
        // 提交成功后返回学生首页
        setViewMode("student");
        setCurrentExam(null);
        setSelectedExam(null);
        // 清空答案
        setAnswers({});
      }
    } catch (error) {
      console.error("提交答案失败:", error);
      alert("提交失败: " + (error as Error).message);
    }
  };

  // 渲染连接钱包界面
  const renderWalletConnection = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">连接钱包</CardTitle>
          <CardDescription>
            连接您的MetaMask钱包以开始使用AnonExam
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={connectWallet}
            className="w-full"
            size="lg"
            disabled={metaMaskState.isConnecting}
            isLoading={metaMaskState.isConnecting}
          >
            {metaMaskState.isConnecting ? "连接中..." : "连接MetaMask"}
          </Button>
          {metaMaskState.error && (
            <p className="mt-2 text-sm text-destructive text-center">
              {metaMaskState.error}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // 渲染FHEVM状态
  const renderFHEVMStatus = () => {
    if (fhevmStatus === "loading") {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
          <div className="flex items-center">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2" />
            <span className="text-sm text-blue-700">正在初始化FHEVM...</span>
          </div>
        </div>
      );
    }

    if (fhevmStatus === "error") {
      return (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
              <span className="text-sm text-red-700">FHEVM初始化失败</span>
            </div>
            <Button variant="outline" size="sm" onClick={refreshFhevm}>
              重试
            </Button>
          </div>
          {fhevmError && (
            <p className="text-xs text-red-600 mt-2">{fhevmError.message}</p>
          )}
        </div>
      );
    }

    if (fhevmStatus === "ready") {
      return (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
          <div className="flex items-center">
            <Shield className="h-4 w-4 text-green-500 mr-2" />
            <span className="text-sm text-green-700">FHEVM已就绪 - 隐私计算功能可用</span>
          </div>
        </div>
      );
    }

    return null;
  };

  // 渲染首页
  const renderHomePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            <span className="gradient-bg bg-clip-text text-transparent">AnonExam</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            基于FHEVM的匿名加密在线考试平台
            <br />
            保护隐私，确保公平，去中心化考试体验
          </p>
          
          {renderFHEVMStatus()}
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              onClick={() => setViewMode("student")}
              leftIcon={<BookOpen className="h-5 w-5" />}
            >
              学生入口
            </Button>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => setViewMode("teacher")}
              leftIcon={<GraduationCap className="h-5 w-5" />}
            >
              教师入口
            </Button>
          </div>
        </div>

        {/* 用户信息 */}
        {isConnected && (
          <Card className="max-w-md mx-auto mb-8">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">已连接钱包</p>
                  <p className="text-sm text-muted-foreground">
                    {userAddress?.slice(0, 6)}...{userAddress?.slice(-4)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    链ID: {chainId} {contractAddress ? "✓" : "⚠️ 合约未部署"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 特性介绍 */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle>隐私保护</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                使用FHEVM同态加密技术，答案在链上保持加密状态，确保隐私安全
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle>去中心化</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                无需传统后端服务，所有数据存储在区块链上，确保透明和不可篡改
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Eye className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle>匿名考试</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                支持匿名身份考试，教师和学生身份可选择性公开
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  // 渲染学生界面
  const renderStudentView = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => setViewMode("home")}>
                ← 返回首页
              </Button>
              <h1 className="text-2xl font-bold">学生考试中心</h1>
            </div>
            <Badge variant="outline">
              学生: {userAddress?.slice(0, 6)}...{userAddress?.slice(-4)}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {renderFHEVMStatus()}
        
        {!contractAddress ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">合约未部署</h3>
              <p className="text-sm text-muted-foreground">
                当前链上未找到AnonExam合约，请确保：
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>1. 已启动本地Hardhat节点</li>
                <li>2. 已部署智能合约</li>
                <li>3. 钱包连接到正确的网络</li>
              </ul>
            </CardContent>
          </Card>
        ) : (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">可参加的考试</h2>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-muted-foreground">加载考试列表...</p>
                </div>
              ) : exams.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">暂无可参加的考试</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {exams.map((exam) => (
                    <ExamCard
                      key={exam.examId.toString()}
                      exam={exam}
                      onEnterExam={(examId) => {
                        const exam = exams.find(e => e.examId === examId);
                        if (exam) {
                          setSelectedExam(exam);
                          loadExamDetails(examId);
                          setViewMode("exam");
                        }
                      }}
                      onViewScore={handleViewScore}
                      userAddress={userAddress}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // 渲染考试界面
  const renderExamView = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => setViewMode("student")}>
                ← 返回考试列表
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{currentExam?.title}</h1>
                <p className="text-sm text-muted-foreground">{currentExam?.description}</p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant={submissionStatus?.isSubmitted ? "success" : "outline"}>
                {submissionStatus?.isSubmitted ? "已提交" : "未提交"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {message && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <p className="text-sm">{message}</p>
            </CardContent>
          </Card>
        )}

        {questions.length > 0 ? (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">考试题目</h2>
              <p className="text-sm text-muted-foreground">
                共 {questions.length} 题 | 答题进度: {Object.keys(answers).length}/{questions.length}
              </p>
            </div>

            {questions.map((question, index) => (
              <QuestionCard
                key={index}
                question={question}
                questionIndex={index}
                answer={answers[index]}
                onAnswerChange={handleAnswerChange}
                disabled={submissionStatus?.isSubmitted}
              />
            ))}

            {!submissionStatus?.isSubmitted && (
              <Card className="mt-6">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">准备提交答案</p>
                      <p className="text-sm text-muted-foreground">
                        已答题: {Object.keys(answers).length}/{questions.length}
                      </p>
                    </div>
                            <Button
                              onClick={handleSubmitAnswers}
                              disabled={isSubmitting}
                              isLoading={isSubmitting}
                            >
                              {isSubmitting ? "提交中..." : "提交答案"}
                            </Button>
                            
                            {/* 完整合约提交测试按钮 */}
                            <Button
                              onClick={async () => {
                                console.log("=== 完整合约提交测试 ===");
                                
                                const examToSubmit = currentExam || selectedExam;
                                if (!examToSubmit) {
                                  alert("未选择考试");
                                  return;
                                }
                                
                                // 使用当前填写的答案，如果没有则使用默认答案
                                const testAnswers = [
                                  answers[0] ?? 2, // 选择题答案C
                                  answers[1] ?? "42", // 填空题答案
                                  answers[2] ?? "闭包是函数和其词法环境的组合" // 简答题答案
                                ];
                                
                                console.log("测试答案:", testAnswers);
                                
                                try {
                                  await submitAnswers(examToSubmit.examId, testAnswers);
                                  alert("完整合约提交测试成功！");
                                } catch (error) {
                                  console.error("完整合约提交测试失败:", error);
                                  alert("提交失败: " + (error as Error).message);
                                }
                              }}
                              variant="secondary"
                              disabled={isSubmitting}
                              className="ml-2"
                            >
                              完整合约测试
                            </Button>
                            
                            <div className="text-xs text-muted-foreground mt-2">
                              调试: canSubmitAnswers={canSubmitAnswers ? '✓' : '✗'} | 
                              hasInstance={!!fhevmInstance ? '✓' : '✗'} | 
                              hasContract={!!contractAddress ? '✓' : '✗'} | 
                              hasSigner={!!resolvedSigner ? '✓' : '✗'} |
                              FHEVM状态={fhevmStatus}
                            </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-4" />
              <p className="text-muted-foreground">暂无题目或正在加载中...</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  // 检查是否为授权教师（从合约读取）
  const [isAuthorizedTeacher, setIsAuthorizedTeacher] = useState<boolean>(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!contractAddress || !readonlyProvider || !userAddress) {
          setIsAuthorizedTeacher(false);
          return;
        }
        const readContract = new ethers.Contract(contractAddress, AnonExamABI.abi, readonlyProvider);
        const ok = await readContract.authorizedTeachers(userAddress);
        setIsAuthorizedTeacher(!!ok);
      } catch (e) {
        setIsAuthorizedTeacher(false);
      }
    };
    checkAuth();
  }, [contractAddress, readonlyProvider, userAddress]);

  // 渲染教师界面
  const renderTeacherView = () => {
    if (!contractAddress) {
      return (
        <div className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            {renderFHEVMStatus()}
            <Card>
              <CardContent className="pt-6 text-center">
                <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">合约未部署</h3>
                <p className="text-sm text-muted-foreground">
                  请确保FHEVM节点正在运行并已部署合约
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    // 检查教师权限
    if (!isAuthorizedTeacher) {
      return (
        <div className="min-h-screen bg-gray-50">
          <div className="bg-white shadow-sm border-b">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button variant="ghost" onClick={() => setViewMode("home")}>
                    ← 返回首页
                  </Button>
                  <h1 className="text-2xl font-bold">教师权限验证</h1>
                </div>
                <Badge variant="destructive">
                  未授权
                </Badge>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 py-8">
            {renderFHEVMStatus()}
            
            <Card className="mb-6">
              <CardContent className="pt-6 text-center">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">需要教师权限</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  当前账户 {userAddress} 没有教师权限。<br/>
                  请切换到授权的教师账户。
                </p>
              </CardContent>
            </Card>

            <AccountSwitcher currentAddress={userAddress} />
          </div>
        </div>
      );
    }

    return (
      <TeacherDashboard
        exams={exams}
        userAddress={userAddress}
        onCreateExam={createExam}
        onViewGrades={(examId) => {
          loadExamDetails(examId);
          setViewMode("grading");
        }}
        onEditExam={(examId) => {
          loadExamDetails(examId);
          // TODO: 实现编辑功能
          alert("编辑功能开发中");
        }}
        isCreatingExam={isCreatingExam}
        onBack={() => setViewMode("home")}
      />
    );
  };

  // 渲染评分界面
  const renderGradingView = () => {
    if (!currentExam) {
      return (
        <div className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <Card>
              <CardContent className="pt-6 text-center">
                <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-4" />
                <p className="text-muted-foreground">未选择考试</p>
                <Button variant="outline" onClick={() => setViewMode("teacher")}>
                  返回教师中心
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    // 从合约获取真实的学生提交数据

    if (loadingSubmissions) {
      return (
        <div className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-muted-foreground">加载学生提交数据...</p>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    return (
      <GradingInterface
        exam={currentExam}
        submissions={realSubmissions}
        onAutoGrade={async (examId, studentAddress) => {
          // TODO: 实现自动评分
          console.log("Auto grading:", examId, studentAddress);
        }}
        onManualGrade={async (examId, studentAddress, score, comment) => {
          // 实现真正的手动评分
          console.log("Manual grading:", examId, studentAddress, score, comment);
          
          if (!fhevmInstance || !contractAddress || !resolvedSigner) {
            throw new Error("FHEVM实例或合约未准备就绪");
          }

          try {
            // 1. 创建加密的分数
            const userAddress = await resolvedSigner.getAddress();
            const scoreInput = fhevmInstance.createEncryptedInput(contractAddress, userAddress);
            scoreInput.add64(score); // 使用64位整数存储分数
            const scoreEnc = await scoreInput.encrypt();

            // 2. 调用合约的manualGrade函数
            const writeContract = new ethers.Contract(contractAddress, AnonExamABI.abi, resolvedSigner);
            const tx = await writeContract.manualGrade(
              examId,
              studentAddress,
              scoreEnc.handles[0],
              scoreEnc.inputProof,
              comment || "" // 教师评语
            );

            console.log("Grading transaction:", tx.hash);
            const receipt = await tx.wait();
            console.log("Grading completed:", receipt);

            // 评分后立即发布成绩
            try {
              const publishTx = await writeContract.publishGrade(examId, studentAddress);
              await publishTx.wait();
              console.log("Grade published successfully");
            } catch (publishError) {
              console.error("Failed to publish grade:", publishError);
              // 如果已经发布过了，不算错误
              if (!(publishError as Error).message.includes("Already published")) {
                throw publishError;
              }
            }

            alert(`评分成功！分数: ${score}分`);
            
          } catch (error) {
            console.error("评分失败:", error);
            throw error;
          }
        }}
        onDecryptAnswers={async (examId, studentAddress) => {
          // 实现真正的答案解密
          console.log("Decrypting answers for:", examId, studentAddress);
          
          if (!fhevmInstance || !contractAddress || !resolvedSigner) {
            throw new Error("FHEVM实例或合约未准备就绪");
          }

          try {
            // 1. 获取学生的提交状态
            const readContract = new ethers.Contract(contractAddress, AnonExamABI.abi, readonlyProvider);
            const submissionStatus = await readContract.getSubmissionStatus(examId, studentAddress);
            
            if (!submissionStatus.isSubmitted) {
              throw new Error("学生尚未提交答案");
            }

            console.log("Student submission status:", submissionStatus);

            // 2. 获取学生答案数量
            const answerCount = await readContract.getStudentAnswerCount(examId, studentAddress);
            console.log("Student answer count:", answerCount.toString());

            // 3. 获取所有加密答案句柄
            const encryptedHandles: string[] = [];
            for (let i = 0; i < answerCount; i++) {
              const answerHandle = await readContract.getStudentAnswer(examId, studentAddress, i);
              encryptedHandles.push(answerHandle);
            }

            console.log("Encrypted answer handles:", encryptedHandles);

            // 4. 使用FHEVM解密签名来解密答案
            const sig = await FhevmDecryptionSignature.loadOrSign(
              fhevmInstance,
              [contractAddress],
              resolvedSigner,
              storage
            );

            if (!sig) {
              throw new Error("无法创建解密签名");
            }

            // 5. 批量解密所有答案
            const decryptRequests = encryptedHandles.map(handle => ({
              handle,
              contractAddress
            }));

            const decryptResults = await fhevmInstance.userDecrypt(
              decryptRequests,
              sig.privateKey,
              sig.publicKey,
              sig.signature,
              sig.contractAddresses,
              sig.userAddress,
              sig.startTimestamp,
              sig.durationDays
            );

            // 6. 提取解密后的答案
            const decryptedAnswers = encryptedHandles.map((handle, index) => {
              const rawValue = Number(decryptResults[handle]);
              console.log(`Answer ${index}: raw value = ${rawValue}`);
              
              // 直接显示原始值，让教师看到学生实际提交的数据
              return rawValue;
            });
            
            console.log("Decoded answers:", decryptedAnswers);
            return decryptedAnswers;
            
          } catch (error) {
            console.error("解密答案失败:", error);
            throw error;
          }
        }}
        onPublishGrade={async (examId, studentAddress) => {
          // 实现真正的成绩发布
          console.log("Publishing grade:", examId, studentAddress);
          
          if (!contractAddress || !resolvedSigner) {
            throw new Error("合约或签名器未准备就绪");
          }

          try {
            // 调用合约的publishGrade函数
            const writeContract = new ethers.Contract(contractAddress, AnonExamABI.abi, resolvedSigner);
            const tx = await writeContract.publishGrade(examId, studentAddress);

            console.log("Publish grade transaction:", tx.hash);
            const receipt = await tx.wait();
            console.log("Grade published:", receipt);

            alert("成绩发布成功！学生现在可以查看自己的分数了。");
            
          } catch (error) {
            console.error("发布成绩失败:", error);
            // 如果已经发布过了，显示友好的提示
            if ((error as Error).message.includes("Already published")) {
              alert("成绩已经发布过了！");
            } else {
              throw error;
            }
          }
        }}
        onBack={() => setViewMode("teacher")}
      />
    );
  };

  // 主渲染逻辑
  if (!isConnected) {
    return renderWalletConnection();
  }

  switch (viewMode) {
    case "student":
      return renderStudentView();
    case "teacher":
      return renderTeacherView();
    case "exam":
      return renderExamView();
    case "grading":
      return renderGradingView();
    default:
      return renderHomePage();
  }
}
