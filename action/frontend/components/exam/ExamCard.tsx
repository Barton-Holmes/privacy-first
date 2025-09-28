"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ExamInfo, ExamStatus } from "@/hooks/useAnonExam";
import { Clock, Users, BookOpen, Calendar } from "lucide-react";
import { format } from "date-fns";

interface ExamCardProps {
  exam: ExamInfo;
  onEnterExam?: (examId: bigint) => void;
  onEditExam?: (examId: bigint) => void;
  onViewGrades?: (examId: bigint) => void;
  onViewScore?: (examId: bigint) => void;
  isTeacher?: boolean;
  userAddress?: string;
}

export function ExamCard({
  exam,
  onEnterExam,
  onEditExam,
  onViewGrades,
  onViewScore,
  isTeacher = false,
  userAddress,
}: ExamCardProps) {
  // 获取考试状态信息
  const getStatusInfo = (status: number, startTime: bigint, endTime: bigint) => {
    const now = Date.now() / 1000;
    const start = Number(startTime);
    const end = Number(endTime);

    if (now < start) {
      return {
        label: "未开始",
        variant: "outline" as const,
        color: "text-blue-600",
      };
    } else if (now >= start && now <= end) {
      return {
        label: "进行中",
        variant: "success" as const,
        color: "text-green-600",
      };
    } else if (now > end) {
      return {
        label: "已结束",
        variant: "secondary" as const,
        color: "text-gray-600",
      };
    } else {
      return {
        label: "未知",
        variant: "outline" as const,
        color: "text-gray-600",
      };
    }
  };

  const statusInfo = getStatusInfo(exam.status, exam.startTime, exam.endTime);
  const isOwner = isTeacher && userAddress?.toLowerCase() === exam.teacher.toLowerCase();

  // 格式化时间
  const formatTime = (timestamp: bigint) => {
    return format(new Date(Number(timestamp) * 1000), "yyyy-MM-dd HH:mm");
  };

  // 计算考试时长显示
  const formatDuration = (minutes: bigint) => {
    const mins = Number(minutes);
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    
    if (hours > 0) {
      return `${hours}小时${remainingMins > 0 ? `${remainingMins}分钟` : ''}`;
    }
    return `${remainingMins}分钟`;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{exam.title}</CardTitle>
            <CardDescription className="text-sm line-clamp-2">
              {exam.description}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <Badge variant={statusInfo.variant}>
              {statusInfo.label}
            </Badge>
            {!exam.isPublished && (
              <Badge variant="warning">草稿</Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>开始: {formatTime(exam.startTime)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>时长: {formatDuration(exam.duration)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4" />
            <span>题目: {exam.questionCount}题</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>教师: {exam.teacher.slice(0, 6)}...{exam.teacher.slice(-4)}</span>
          </div>
        </div>

        <div className="mt-4 p-3 bg-muted rounded-md">
          <div className="text-xs text-muted-foreground mb-1">考试时间</div>
          <div className="text-sm">
            {formatTime(exam.startTime)} - {formatTime(exam.endTime)}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <div className="flex space-x-2">
          {isTeacher ? (
            // 教师视图
            <>
              {isOwner && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditExam?.(exam.examId)}
                  >
                    编辑
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onViewGrades?.(exam.examId)}
                  >
                    查看成绩
                  </Button>
                </>
              )}
            </>
          ) : (
            // 学生视图
            <>
              {exam.isPublished && (
                <>
                  {exam.submissionStatus?.isSubmitted ? (
                    <div className="flex flex-col space-y-2">
                      <Badge variant="success" className="w-fit">
                        已提交
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        提交时间: {format(new Date(Number(exam.submissionStatus.submitTime) * 1000), "MM-dd HH:mm")}
                      </div>
                      {exam.submissionStatus.isGraded && (
                        <div className="flex flex-col space-y-2">
                          <Badge variant="secondary" className="w-fit">
                            已评分
                          </Badge>
                          {exam.studentScore !== undefined ? (
                            <div className="text-sm font-medium text-green-600">
                              分数: {exam.studentScore} / {exam.maxScore || 100}
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onViewScore?.(exam.examId)}
                            >
                              查看分数
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onEnterExam?.(exam.examId)}
                      disabled={statusInfo.label === "已结束"}
                    >
                      {statusInfo.label === "未开始" ? "查看详情" : 
                       statusInfo.label === "进行中" ? "进入考试" : "查看结果"}
                    </Button>
                  )}
                </>
              )}
            </>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          ID: {exam.examId.toString()}
        </div>
      </CardFooter>
    </Card>
  );
}
