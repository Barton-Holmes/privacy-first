"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CreateExamForm } from "./CreateExamForm";
import { ExamCard } from "@/components/exam/ExamCard";
import { ExamInfo } from "@/hooks/useAnonExam";
import { Plus, BookOpen, Users, BarChart3, Settings } from "lucide-react";

type TeacherView = "dashboard" | "create-exam" | "manage-exam" | "grading" | "analytics";

interface TeacherDashboardProps {
  exams: ExamInfo[];
  userAddress?: string;
  onCreateExam: (examData: any) => Promise<void>;
  onViewGrades: (examId: bigint) => void;
  onEditExam: (examId: bigint) => void;
  isCreatingExam?: boolean;
  onBack: () => void;
}

export function TeacherDashboard({
  exams,
  userAddress,
  onCreateExam,
  onViewGrades,
  onEditExam,
  isCreatingExam = false,
  onBack,
}: TeacherDashboardProps) {
  const [currentView, setCurrentView] = useState<TeacherView>("dashboard");

  // 过滤出当前教师创建的考试
  const myExams = exams.filter(exam => 
    exam.teacher.toLowerCase() === userAddress?.toLowerCase()
  );

  // 统计信息
  const stats = {
    totalExams: myExams.length,
    publishedExams: myExams.filter(exam => exam.isPublished).length,
    activeExams: myExams.filter(exam => {
      const now = Date.now() / 1000;
      return Number(exam.startTime) <= now && Number(exam.endTime) >= now;
    }).length,
    completedExams: myExams.filter(exam => exam.status === 3).length, // Graded
  };

  // 渲染统计卡片
  const renderStatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{stats.totalExams}</p>
              <p className="text-sm text-muted-foreground">总考试数</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Users className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{stats.publishedExams}</p>
              <p className="text-sm text-muted-foreground">已发布</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">{stats.activeExams}</p>
              <p className="text-sm text-muted-foreground">进行中</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Settings className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{stats.completedExams}</p>
              <p className="text-sm text-muted-foreground">已完成</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // 渲染主仪表板
  const renderDashboard = () => (
    <div>
      {renderStatsCards()}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">我的考试</h2>
        <Button onClick={() => setCurrentView("create-exam")}>
          <Plus className="h-4 w-4 mr-2" />
          创建考试
        </Button>
      </div>

      {myExams.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">还没有创建任何考试</h3>
            <p className="text-sm text-muted-foreground mb-4">
              开始创建您的第一个加密考试
            </p>
            <Button onClick={() => setCurrentView("create-exam")}>
              <Plus className="h-4 w-4 mr-2" />
              创建考试
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {myExams.map((exam) => (
            <ExamCard
              key={exam.examId.toString()}
              exam={exam}
              onEditExam={onEditExam}
              onViewGrades={onViewGrades}
              isTeacher={true}
              userAddress={userAddress}
            />
          ))}
        </div>
      )}
    </div>
  );

  // 渲染创建考试表单
  const renderCreateExam = () => (
    <div>
      <div className="mb-6">
        <Button variant="ghost" onClick={() => setCurrentView("dashboard")}>
          ← 返回仪表板
        </Button>
        <h2 className="text-2xl font-bold mt-2">创建新考试</h2>
      </div>
      
      <CreateExamForm
        onSubmit={async (examData) => {
          await onCreateExam(examData);
          setCurrentView("dashboard");
        }}
        onCancel={() => setCurrentView("dashboard")}
        isCreating={isCreatingExam}
      />
    </div>
  );

  // 主渲染逻辑
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack}>
                ← 返回首页
              </Button>
              <div>
                <h1 className="text-2xl font-bold">教师管理中心</h1>
                <p className="text-sm text-muted-foreground">
                  创建和管理您的加密考试
                </p>
              </div>
            </div>
            <Badge variant="secondary">
              教师: {userAddress?.slice(0, 6)}...{userAddress?.slice(-4)}
            </Badge>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="container mx-auto px-4 py-8">
        {currentView === "dashboard" && renderDashboard()}
        {currentView === "create-exam" && renderCreateExam()}
      </div>
    </div>
  );
}

