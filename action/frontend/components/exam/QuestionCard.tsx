"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { QuestionInfo, QuestionType } from "@/hooks/useAnonExam";
import { useState } from "react";

interface QuestionCardProps {
  question: QuestionInfo;
  questionIndex: number;
  answer?: string | number | boolean;
  onAnswerChange: (index: number, answer: string | number | boolean) => void;
  disabled?: boolean;
}

export function QuestionCard({
  question,
  questionIndex,
  answer,
  onAnswerChange,
  disabled = false,
}: QuestionCardProps) {
  const [localAnswer, setLocalAnswer] = useState<string | number | boolean>(answer ?? "");

  const handleAnswerChange = (newAnswer: string | number | boolean) => {
    setLocalAnswer(newAnswer);
    onAnswerChange(questionIndex, newAnswer);
  };

  const renderQuestionInput = () => {
    const questionType = Number(question.questionType);
    console.log("Rendering input for question type:", questionType);
    
    switch (questionType) {
      case 0: // MultipleChoice
        return (
          <div className="space-y-3">
            {question.options.map((option, optionIndex) => (
              <label
                key={optionIndex}
                className={`flex items-center space-x-3 p-3 rounded-md border cursor-pointer transition-colors ${
                  localAnswer === optionIndex
                    ? "border-primary bg-primary/5"
                    : "border-input hover:bg-accent"
                } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <input
                  type="radio"
                  name={`question-${questionIndex}`}
                  value={optionIndex}
                  checked={localAnswer === optionIndex}
                  onChange={() => handleAnswerChange(optionIndex)}
                  disabled={disabled}
                  className="h-4 w-4 text-primary focus:ring-primary"
                />
                <span className="text-sm flex-1">{option}</span>
              </label>
            ))}
          </div>
        );

      case 1: // FillInBlank
        return (
          <div className="space-y-2">
            <Input
              placeholder="请输入答案..."
              value={localAnswer as string}
              onChange={(e) => handleAnswerChange(e.target.value)}
              disabled={disabled}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              填空题答案将被加密存储，只有教师可以查看
            </p>
          </div>
        );

      case 2: // ShortAnswer
        return (
          <div className="space-y-2">
            <Textarea
              placeholder="请输入您的答案..."
              value={localAnswer as string}
              onChange={(e) => handleAnswerChange(e.target.value)}
              disabled={disabled}
              rows={4}
              className="w-full resize-none"
            />
            <p className="text-xs text-muted-foreground">
              简答题答案将被加密存储，只有教师可以查看和评分
            </p>
          </div>
        );

      default:
        return (
          <div className="p-4 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground">
              未知题目类型
            </p>
          </div>
        );
    }
  };

  const getQuestionTypeLabel = (type: number) => {
    console.log("Question type received:", type, "Expected types:", { MultipleChoice: QuestionType.MultipleChoice, FillInBlank: QuestionType.FillInBlank, ShortAnswer: QuestionType.ShortAnswer });
    
    switch (Number(type)) {
      case 0: // MultipleChoice
        return "选择题";
      case 1: // FillInBlank
        return "填空题";
      case 2: // ShortAnswer
        return "简答题";
      default:
        return `未知类型(${type})`;
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <span>第 {questionIndex + 1} 题</span>
          <span className="text-sm font-normal text-muted-foreground">
            {getQuestionTypeLabel(question.questionType)}
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 题目内容 */}
        <div className="p-4 bg-muted/50 rounded-md">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {question.questionText}
          </p>
        </div>

        {/* 答题区域 */}
        <div>
          <h4 className="text-sm font-medium mb-3">请选择或输入您的答案：</h4>
          {renderQuestionInput()}
        </div>

        {/* 答案状态指示 */}
        {!disabled && (
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <div className={`h-2 w-2 rounded-full ${
              localAnswer !== "" && localAnswer !== undefined
                ? "bg-green-500"
                : "bg-gray-300"
            }`} />
            <span>
              {localAnswer !== "" && localAnswer !== undefined
                ? "已答题"
                : "未答题"}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
