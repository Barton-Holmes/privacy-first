"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { ExamInfo, SubmissionStatus } from "@/hooks/useAnonExam";
import { User, Users, Clock, CheckCircle, XCircle, FileText, Award } from "lucide-react";

interface StudentSubmission {
  studentAddress: string;
  submissionStatus: SubmissionStatus;
  encryptedAnswers?: string[];
  decryptedAnswers?: (string | number | boolean)[];
  currentScore?: number;
  maxScore: number;
}

interface GradingInterfaceProps {
  exam: ExamInfo;
  submissions: StudentSubmission[];
  onAutoGrade: (examId: bigint, studentAddress: string) => Promise<void>;
  onManualGrade: (examId: bigint, studentAddress: string, score: number, comment: string) => Promise<void>;
  onDecryptAnswers: (examId: bigint, studentAddress: string) => Promise<(string | number | boolean)[]>;
  onPublishGrade: (examId: bigint, studentAddress: string) => Promise<void>;
  onBack: () => void;
}

export function GradingInterface({
  exam,
  submissions,
  onAutoGrade,
  onManualGrade,
  onDecryptAnswers,
  onPublishGrade,
  onBack,
}: GradingInterfaceProps) {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [decryptedAnswers, setDecryptedAnswers] = useState<Record<string, (string | number | boolean)[]>>({});
  const [gradeScores, setGradeScores] = useState<Record<string, number>>({});
  const [gradeComments, setGradeComments] = useState<Record<string, string>>({});
  const [isGrading, setIsGrading] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState<Record<string, boolean>>({});

  // 解密学生答案
  const handleDecryptAnswers = async (studentAddress: string) => {
    if (decryptedAnswers[studentAddress]) return; // 已解密

    setIsDecrypting(prev => ({ ...prev, [studentAddress]: true }));
    
    try {
      const answers = await onDecryptAnswers(exam.examId, studentAddress);
      setDecryptedAnswers(prev => ({
        ...prev,
        [studentAddress]: answers
      }));
    } catch (error) {
      console.error("解密答案失败:", error);
      alert("解密答案失败: " + (error as Error).message);
    } finally {
      setIsDecrypting(prev => ({ ...prev, [studentAddress]: false }));
    }
  };

  // 自动评分
  const handleAutoGrade = async (studentAddress: string) => {
    setIsGrading(true);
    try {
      await onAutoGrade(exam.examId, studentAddress);
      alert("自动评分完成！");
    } catch (error) {
      console.error("自动评分失败:", error);
      alert("自动评分失败: " + (error as Error).message);
    } finally {
      setIsGrading(false);
    }
  };

  // 手动评分
  const handleManualGrade = async (studentAddress: string) => {
    const score = gradeScores[studentAddress];
    const comment = gradeComments[studentAddress] || "";

    if (score === undefined || score < 0 || score > (exam.maxScore || 100)) {
      alert(`请输入有效分数 (0-${exam.maxScore || 100})`);
      return;
    }

    setIsGrading(true);
    try {
      await onManualGrade(exam.examId, studentAddress, score, comment);
      alert("评分完成！");
    } catch (error) {
      console.error("评分失败:", error);
      alert("评分失败: " + (error as Error).message);
    } finally {
      setIsGrading(false);
    }
  };

  // 发布成绩
  const handlePublishGrade = async (studentAddress: string) => {
    try {
      await onPublishGrade(exam.examId, studentAddress);
      alert("成绩已发布！");
    } catch (error) {
      console.error("发布成绩失败:", error);
      alert("发布成绩失败: " + (error as Error).message);
    }
  };

  // 计算统计信息
  const stats = {
    totalSubmissions: submissions.length,
    gradedSubmissions: submissions.filter(s => s.submissionStatus.isGraded).length,
    averageScore: submissions.length > 0 
      ? submissions.reduce((sum, s) => sum + (s.currentScore || 0), 0) / submissions.length 
      : 0,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack}>
                ← 返回
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{exam.title} - 阅卷评分</h1>
                <p className="text-sm text-muted-foreground">{exam.description}</p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="outline">
                {submissions.length} 份答卷
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* 统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <FileText className="h-6 w-6 text-blue-500" />
                <div>
                  <p className="text-xl font-bold">{stats.totalSubmissions}</p>
                  <p className="text-sm text-muted-foreground">总提交数</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <div>
                  <p className="text-xl font-bold">{stats.gradedSubmissions}</p>
                  <p className="text-sm text-muted-foreground">已评分</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Award className="h-6 w-6 text-purple-500" />
                <div>
                  <p className="text-xl font-bold">{stats.averageScore.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">平均分</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 评分进度 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>评分进度</CardTitle>
            <CardDescription>
              已评分 {stats.gradedSubmissions} / {stats.totalSubmissions} 份答卷
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress 
              value={stats.totalSubmissions > 0 ? (stats.gradedSubmissions / stats.totalSubmissions) * 100 : 0}
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* 学生答卷列表 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">学生答卷</h3>
          
          {submissions.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Users className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">暂无学生提交答卷</p>
              </CardContent>
            </Card>
          ) : (
            submissions.map((submission) => (
              <Card key={submission.studentAddress} className="p-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    {/* 学生信息 */}
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {submission.studentAddress.slice(0, 6)}...{submission.studentAddress.slice(-4)}
                        </p>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            提交时间: {new Date(Number(submission.submissionStatus.submitTime) * 1000).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 状态和操作 */}
                    <div className="flex items-center space-x-3">
                      {submission.submissionStatus.isGraded ? (
                        <Badge variant="success">已评分</Badge>
                      ) : (
                        <Badge variant="outline">待评分</Badge>
                      )}

                      <div className="flex space-x-2">
                        {/* 解密答案按钮 */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDecryptAnswers(submission.studentAddress)}
                          disabled={isDecrypting[submission.studentAddress]}
                          isLoading={isDecrypting[submission.studentAddress]}
                        >
                          {decryptedAnswers[submission.studentAddress] ? "查看答案" : "解密答案"}
                        </Button>

                        {/* 自动评分按钮 */}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleAutoGrade(submission.studentAddress)}
                          disabled={submission.submissionStatus.isGraded || isGrading}
                          isLoading={isGrading}
                        >
                          自动评分
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* 展开的答案和评分区域 */}
                  {decryptedAnswers[submission.studentAddress] && (
                    <div className="mt-6 pt-6 border-t">
                      <h4 className="font-medium mb-4">学生答案</h4>
                      <div className="space-y-3 mb-6">
                        {decryptedAnswers[submission.studentAddress].map((answer, index) => (
                          <div key={index} className="p-3 bg-muted rounded-md">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-sm font-medium">第 {index + 1} 题</span>
                              <Badge variant="outline">10分</Badge>
                            </div>
                            <p className="text-sm">
                              答案: {typeof answer === 'boolean' ? (answer ? '是' : '否') : answer.toString()}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* 手动评分区域 */}
                      {!submission.submissionStatus.isGraded && (
                        <div className="space-y-4">
                          <h4 className="font-medium">手动评分</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">分数 (0-{exam.maxScore})</label>
                              <Input
                                type="number"
                                min="0"
                                max={exam.maxScore}
                                placeholder="请输入分数"
                                value={gradeScores[submission.studentAddress] || ''}
                                onChange={(e) => setGradeScores(prev => ({
                                  ...prev,
                                  [submission.studentAddress]: Number(e.target.value)
                                }))}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">评语</label>
                              <Textarea
                                placeholder="请输入评语（可选）"
                                value={gradeComments[submission.studentAddress] || ''}
                                onChange={(e) => setGradeComments(prev => ({
                                  ...prev,
                                  [submission.studentAddress]: e.target.value
                                }))}
                                rows={3}
                              />
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => handleManualGrade(submission.studentAddress)}
                              disabled={isGrading || gradeScores[submission.studentAddress] === undefined}
                              isLoading={isGrading}
                            >
                              提交评分
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* 已评分显示 */}
                      {submission.submissionStatus.isGraded && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                          <div className="flex items-center space-x-2 mb-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span className="font-medium text-green-700">已完成评分</span>
                          </div>
                          <p className="text-sm text-green-600">
                            分数: {submission.currentScore || 0} / {exam.maxScore}
                          </p>
                          <div className="mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePublishGrade(submission.studentAddress)}
                            >
                              发布成绩
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
