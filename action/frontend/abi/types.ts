// This file is auto-generated. Do not edit manually.
// Type definitions for AnonExam contracts

import type { AnonExamABIType } from './AnonExamABI';
import type { AnonExamAddressesType } from './AnonExamAddresses';

// 考试状态枚举
export enum ExamStatus {
  NotStarted = 0,
  InProgress = 1,
  Ended = 2,
  Graded = 3,
}

// 题目类型枚举
export enum QuestionType {
  MultipleChoice = 0,
  FillInBlank = 1,
  ShortAnswer = 2,
}

// 考试信息类型
export interface ExamInfo {
  title: string;
  description: string;
  teacher: string;
  startTime: bigint;
  endTime: bigint;
  duration: bigint;
  questionCount: number;
  isPublished: boolean;
  status: ExamStatus;
}

// 题目信息类型
export interface QuestionInfo {
  questionType: QuestionType;
  questionText: string;
  options: string[];
}

// 提交状态类型
export interface SubmissionStatus {
  isSubmitted: boolean;
  submitTime: bigint;
  isGraded: boolean;
}

// 成绩信息类型
export interface GradeInfo {
  encryptedScore: string; // 加密分数句柄
  encryptedGradeLevel: string; // 加密等级句柄
  isPublished: boolean;
  comment: string;
}

// 合约交互类型
export type AnonExamABI = AnonExamABIType;
export type AnonExamAddresses = AnonExamAddressesType;

// 事件类型
export interface ExamCreatedEvent {
  examId: bigint;
  teacher: string;
  title: string;
}

export interface AnswerSubmittedEvent {
  examId: bigint;
  student: string;
  submitTime: bigint;
}

export interface ExamGradedEvent {
  examId: bigint;
  student: string;
  teacher: string;
}

export interface GradePublishedEvent {
  examId: bigint;
  student: string;
}
