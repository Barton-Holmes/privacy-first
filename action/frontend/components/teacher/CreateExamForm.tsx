"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { Calendar, Clock, BookOpen, Plus, Trash2 } from "lucide-react";

interface Question {
  id: string;
  type: 'multiple-choice' | 'fill-blank' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: string | number;
  points: number;
}

interface CreateExamFormProps {
  onSubmit: (examData: {
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
    duration: number;
    questions: Question[];
    maxScore: number;
  }) => void;
  onCancel: () => void;
  isCreating?: boolean;
}

export function CreateExamForm({ onSubmit, onCancel, isCreating = false }: CreateExamFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState(60);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    type: 'multiple-choice',
    options: ['', '', '', ''],
    points: 10,
  });

  // 计算结束时间
  const getEndTime = () => {
    if (!startDate || !startTime) return new Date();
    const start = new Date(`${startDate}T${startTime}`);
    return new Date(start.getTime() + duration * 60 * 1000);
  };

  // 添加题目
  const addQuestion = () => {
    if (!currentQuestion.question || !currentQuestion.correctAnswer) {
      alert("请填写完整的题目信息");
      return;
    }

    const newQuestion: Question = {
      id: Date.now().toString(),
      type: currentQuestion.type as Question['type'],
      question: currentQuestion.question,
      options: currentQuestion.type === 'multiple-choice' ? currentQuestion.options : undefined,
      correctAnswer: currentQuestion.correctAnswer,
      points: currentQuestion.points || 10,
    };

    setQuestions([...questions, newQuestion]);
    setCurrentQuestion({
      type: 'multiple-choice',
      options: ['', '', '', ''],
      points: 10,
    });
  };

  // 删除题目
  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  // 更新选项
  const updateOption = (index: number, value: string) => {
    const newOptions = [...(currentQuestion.options || ['', '', '', ''])];
    newOptions[index] = value;
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  // 提交表单
  const handleSubmit = () => {
    console.log("HandleSubmit called"); // 调试日志
    console.log("Form data:", { title, description, startDate, startTime, questionsLength: questions.length });
    
    if (!title || !description || !startDate || !startTime) {
      alert("请填写完整的考试信息");
      return;
    }

    if (questions.length === 0) {
      alert("请至少添加一道题目");
      return;
    }

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = getEndTime();
    const maxScore = questions.reduce((sum, q) => sum + q.points, 0);

    console.log("Submitting exam data:", {
      title,
      description,
      startTime: startDateTime,
      endTime: endDateTime,
      duration,
      questions,
      maxScore,
    });

    onSubmit({
      title,
      description,
      startTime: startDateTime,
      endTime: endDateTime,
      duration,
      questions,
      maxScore,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5" />
            <span>考试基本信息</span>
          </CardTitle>
          <CardDescription>设置考试的基本信息和时间安排</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">考试标题</label>
              <Input
                placeholder="请输入考试标题"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">考试时长（分钟）</label>
              <Input
                type="number"
                placeholder="60"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">考试描述</label>
            <Textarea
              placeholder="请输入考试描述和说明"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">开始日期</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">开始时间</label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
          </div>

          {startDate && startTime && (
            <div className="p-3 bg-muted rounded-md">
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>开始: {new Date(`${startDate}T${startTime}`).toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>结束: {getEndTime().toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 题目管理 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>题目管理</span>
            <Badge variant="outline">
              {questions.length} 题 | 总分: {questions.reduce((sum, q) => sum + q.points, 0)} 分
            </Badge>
          </CardTitle>
          <CardDescription>添加和管理考试题目</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 已添加的题目列表 */}
          {questions.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">已添加题目</h4>
              {questions.map((question, index) => (
                <div key={question.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant="secondary">
                        {question.type === 'multiple-choice' ? '选择题' : 
                         question.type === 'fill-blank' ? '填空题' : '简答题'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{question.points}分</span>
                    </div>
                    <p className="text-sm line-clamp-2">{question.question}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeQuestion(question.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* 添加新题目 */}
          <div className="border-t pt-6">
            <h4 className="font-medium mb-4">添加新题目</h4>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">题目类型</label>
                  <select
                    className="w-full h-10 px-3 py-2 border border-input rounded-md bg-background"
                    value={currentQuestion.type}
                    onChange={(e) => setCurrentQuestion({
                      ...currentQuestion,
                      type: e.target.value as Question['type'],
                      options: e.target.value === 'multiple-choice' ? ['', '', '', ''] : undefined
                    })}
                  >
                    <option value="multiple-choice">选择题</option>
                    <option value="fill-blank">填空题</option>
                    <option value="short-answer">简答题</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">分值</label>
                  <Input
                    type="number"
                    placeholder="10"
                    value={currentQuestion.points || ''}
                    onChange={(e) => setCurrentQuestion({
                      ...currentQuestion,
                      points: Number(e.target.value)
                    })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">题目内容</label>
                <Textarea
                  placeholder="请输入题目内容"
                  value={currentQuestion.question || ''}
                  onChange={(e) => setCurrentQuestion({
                    ...currentQuestion,
                    question: e.target.value
                  })}
                  rows={3}
                />
              </div>

              {/* 选择题选项 */}
              {currentQuestion.type === 'multiple-choice' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">选项设置</label>
                  <div className="space-y-2">
                    {(currentQuestion.options || ['', '', '', '']).map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="text-sm font-medium w-8">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <Input
                          placeholder={`选项 ${String.fromCharCode(65 + index)}`}
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 正确答案 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">正确答案</label>
                {currentQuestion.type === 'multiple-choice' ? (
                  <select
                    className="w-full h-10 px-3 py-2 border border-input rounded-md bg-background"
                    value={currentQuestion.correctAnswer || ''}
                    onChange={(e) => setCurrentQuestion({
                      ...currentQuestion,
                      correctAnswer: Number(e.target.value)
                    })}
                  >
                    <option value="">请选择正确答案</option>
                    {(currentQuestion.options || []).map((option, index) => (
                      <option key={index} value={index} disabled={!option.trim()}>
                        {String.fromCharCode(65 + index)}. {option || '(未填写)'}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    placeholder="请输入正确答案"
                    value={currentQuestion.correctAnswer || ''}
                    onChange={(e) => setCurrentQuestion({
                      ...currentQuestion,
                      correctAnswer: e.target.value
                    })}
                  />
                )}
              </div>

              <Button
                onClick={addQuestion}
                className="w-full"
                variant="outline"
                disabled={!currentQuestion.question || !currentQuestion.correctAnswer}
              >
                <Plus className="h-4 w-4 mr-2" />
                添加题目
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between">
            <Button variant="outline" onClick={onCancel}>
              取消
            </Button>
            <div className="space-y-2">
              <Button
                onClick={handleSubmit}
                disabled={isCreating}
                isLoading={isCreating}
                className="w-full"
              >
                {isCreating ? "创建中..." : "创建考试"}
              </Button>
              
              {/* 简化测试按钮 */}
              <Button
                onClick={() => {
                  console.log("Test button clicked");
                  onSubmit({
                    title: "测试考试",
                    description: "这是一个测试考试",
                    startTime: new Date(Date.now() + 60000), // 1分钟后
                    endTime: new Date(Date.now() + 3660000), // 1小时后
                    duration: 60,
                    questions: [],
                    maxScore: 100,
                  });
                }}
                variant="outline"
                disabled={isCreating}
                className="w-full"
              >
                快速测试创建
              </Button>
              
              <div className="text-xs text-muted-foreground">
                调试: 标题={title ? '✓' : '✗'} 描述={description ? '✓' : '✗'} 日期={startDate ? '✓' : '✗'} 时间={startTime ? '✓' : '✗'} 题目={questions.length}个
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
