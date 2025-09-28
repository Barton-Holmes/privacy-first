#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 路径配置
const HARDHAT_TEMPLATE_PATH = join(__dirname, '../../fhevm-hardhat-template');
const DEPLOYMENTS_PATH = join(HARDHAT_TEMPLATE_PATH, 'deployments');
const ABI_OUTPUT_PATH = join(__dirname, '../abi');

// 确保输出目录存在
if (!existsSync(ABI_OUTPUT_PATH)) {
  mkdirSync(ABI_OUTPUT_PATH, { recursive: true });
}

// 生成ABI文件
function generateABI() {
  console.log('🔧 Generating ABI files...');
  
  try {
    // 读取编译后的合约ABI
    const artifactsPath = join(HARDHAT_TEMPLATE_PATH, 'artifacts/contracts');
    
    // AnonExam合约
    const anonExamArtifactPath = join(artifactsPath, 'AnonExam.sol/AnonExam.json');
    
    if (existsSync(anonExamArtifactPath)) {
      const anonExamArtifact = JSON.parse(readFileSync(anonExamArtifactPath, 'utf8'));
      
      const abiContent = `// This file is auto-generated. Do not edit manually.
// Generated from AnonExam.sol artifact

export const AnonExamABI = {
  abi: ${JSON.stringify(anonExamArtifact.abi, null, 2)}
} as const;

export type AnonExamABIType = typeof AnonExamABI.abi;
`;
      
      writeFileSync(join(ABI_OUTPUT_PATH, 'AnonExamABI.ts'), abiContent);
      console.log('✅ Generated AnonExamABI.ts');
    } else {
      console.warn('⚠️  AnonExam artifact not found. Run contract compilation first.');
    }
  } catch (error) {
    console.error('❌ Error generating ABI:', error.message);
  }
}

// 生成地址文件
function generateAddresses() {
  console.log('📍 Generating address files...');
  
  try {
    const addresses = {};
    
    // 检查部署文件
    if (existsSync(DEPLOYMENTS_PATH)) {
      const networks = ['localhost', 'sepolia', 'mainnet'];
      
      for (const network of networks) {
        const networkPath = join(DEPLOYMENTS_PATH, network);
        if (existsSync(networkPath)) {
          const anonExamPath = join(networkPath, 'AnonExam.json');
          
          if (existsSync(anonExamPath)) {
            const deployment = JSON.parse(readFileSync(anonExamPath, 'utf8'));
            
            // 获取链ID
            let chainId;
            switch (network) {
              case 'localhost':
                chainId = 31337;
                break;
              case 'sepolia':
                chainId = 11155111;
                break;
              case 'mainnet':
                chainId = 1;
                break;
              default:
                chainId = 0;
            }
            
            addresses[chainId] = {
              address: deployment.address,
              chainId: chainId,
              chainName: network.charAt(0).toUpperCase() + network.slice(1),
              blockNumber: deployment.receipt?.blockNumber,
              transactionHash: deployment.transactionHash,
            };
          }
        }
      }
    }
    
    const addressContent = `// This file is auto-generated. Do not edit manually.
// Generated from deployment artifacts

export const AnonExamAddresses = ${JSON.stringify(addresses, null, 2)} as const;

export type AnonExamAddressesType = typeof AnonExamAddresses;

// 辅助函数：根据链ID获取合约地址
export function getAnonExamAddress(chainId: number): string | undefined {
  const entry = AnonExamAddresses[chainId as keyof typeof AnonExamAddresses];
  return entry && 'address' in entry ? entry.address : undefined;
}

// 辅助函数：检查链是否支持
export function isSupportedChain(chainId: number): boolean {
  return chainId in AnonExamAddresses;
}

// 支持的链ID列表
export const SUPPORTED_CHAIN_IDS = Object.keys(AnonExamAddresses).map(Number);
`;
    
    writeFileSync(join(ABI_OUTPUT_PATH, 'AnonExamAddresses.ts'), addressContent);
    console.log('✅ Generated AnonExamAddresses.ts');
    
    if (Object.keys(addresses).length === 0) {
      console.warn('⚠️  No deployment addresses found. Deploy contracts first.');
    } else {
      console.log(`📍 Found deployments on chains: ${Object.keys(addresses).join(', ')}`);
    }
  } catch (error) {
    console.error('❌ Error generating addresses:', error.message);
  }
}

// 生成类型定义文件
function generateTypes() {
  console.log('📝 Generating type definitions...');
  
  const typesContent = `// This file is auto-generated. Do not edit manually.
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
`;
  
  writeFileSync(join(ABI_OUTPUT_PATH, 'types.ts'), typesContent);
  console.log('✅ Generated types.ts');
}

// 主函数
function main() {
  console.log('🚀 Starting ABI and address generation...');
  console.log(`📂 Hardhat template path: ${HARDHAT_TEMPLATE_PATH}`);
  console.log(`📂 Output path: ${ABI_OUTPUT_PATH}`);
  console.log('');
  
  generateABI();
  generateAddresses();
  generateTypes();
  
  console.log('');
  console.log('✨ Generation completed!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Make sure contracts are compiled: cd ../fhevm-hardhat-template && npm run build');
  console.log('2. Deploy contracts: npm run deploy:localhost');
  console.log('3. Re-run this script to update addresses: npm run genabi');
}

// 运行
main();

