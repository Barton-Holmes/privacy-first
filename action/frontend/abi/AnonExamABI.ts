// This file is auto-generated. Do not edit manually.
// Generated from AnonExam.sol artifact

export const AnonExamABI = {
  abi: [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "examId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "student",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "submitTime",
        "type": "uint256"
      }
    ],
    "name": "AnswerSubmitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "examId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "teacher",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "title",
        "type": "string"
      }
    ],
    "name": "ExamCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "examId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "student",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "teacher",
        "type": "address"
      }
    ],
    "name": "ExamGraded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "examId",
        "type": "uint256"
      }
    ],
    "name": "ExamPublished",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "examId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "student",
        "type": "address"
      }
    ],
    "name": "GradePublished",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "examId",
        "type": "uint256"
      },
      {
        "internalType": "enum AnonExam.QuestionType",
        "name": "questionType",
        "type": "uint8"
      },
      {
        "internalType": "string",
        "name": "questionText",
        "type": "string"
      },
      {
        "internalType": "string[]",
        "name": "options",
        "type": "string[]"
      },
      {
        "internalType": "externalEuint32",
        "name": "correctAnswerInput",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "correctAnswerProof",
        "type": "bytes"
      },
      {
        "internalType": "externalEuint8",
        "name": "pointsInput",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "pointsProof",
        "type": "bytes"
      }
    ],
    "name": "addQuestion",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "teacher",
        "type": "address"
      }
    ],
    "name": "authorizeTeacher",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "authorizedTeachers",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "examId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "student",
        "type": "address"
      }
    ],
    "name": "autoGradeMultipleChoice",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "examId",
        "type": "uint256"
      }
    ],
    "name": "calculateClassAverage",
    "outputs": [
      {
        "internalType": "euint64",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "startTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "endTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "duration",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "maxScore",
        "type": "uint256"
      }
    ],
    "name": "createExam",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "examStudents",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "exams",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "examId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "teacher",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "startTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "endTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "duration",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "questionCount",
        "type": "uint8"
      },
      {
        "internalType": "bool",
        "name": "isPublished",
        "type": "bool"
      },
      {
        "internalType": "enum AnonExam.ExamStatus",
        "name": "status",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "maxScore",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "examId",
        "type": "uint256"
      }
    ],
    "name": "getExamInfo",
    "outputs": [
      {
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "teacher",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "startTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "endTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "duration",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "questionCount",
        "type": "uint8"
      },
      {
        "internalType": "bool",
        "name": "isPublished",
        "type": "bool"
      },
      {
        "internalType": "enum AnonExam.ExamStatus",
        "name": "status",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "examId",
        "type": "uint256"
      }
    ],
    "name": "getExamStudents",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "examId",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "questionIndex",
        "type": "uint8"
      }
    ],
    "name": "getQuestionInfo",
    "outputs": [
      {
        "internalType": "enum AnonExam.QuestionType",
        "name": "questionType",
        "type": "uint8"
      },
      {
        "internalType": "string",
        "name": "questionText",
        "type": "string"
      },
      {
        "internalType": "string[]",
        "name": "options",
        "type": "string[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "examId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "student",
        "type": "address"
      },
      {
        "internalType": "uint8",
        "name": "answerIndex",
        "type": "uint8"
      }
    ],
    "name": "getStudentAnswer",
    "outputs": [
      {
        "internalType": "euint32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "examId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "student",
        "type": "address"
      }
    ],
    "name": "getStudentAnswerCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "examId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "student",
        "type": "address"
      }
    ],
    "name": "getStudentGrade",
    "outputs": [
      {
        "internalType": "euint64",
        "name": "encryptedScore",
        "type": "bytes32"
      },
      {
        "internalType": "euint8",
        "name": "encryptedGradeLevel",
        "type": "bytes32"
      },
      {
        "internalType": "bool",
        "name": "isPublished",
        "type": "bool"
      },
      {
        "internalType": "string",
        "name": "comment",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "examId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "student",
        "type": "address"
      }
    ],
    "name": "getSubmissionStatus",
    "outputs": [
      {
        "internalType": "bool",
        "name": "isSubmitted",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "submitTime",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isGraded",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalExams",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "grades",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "examId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "student",
        "type": "address"
      },
      {
        "internalType": "euint64",
        "name": "encryptedScore",
        "type": "bytes32"
      },
      {
        "internalType": "euint8",
        "name": "encryptedGradeLevel",
        "type": "bytes32"
      },
      {
        "internalType": "bool",
        "name": "isPublished",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "gradedTime",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "teacherComment",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "examId",
        "type": "uint256"
      },
      {
        "internalType": "address[]",
        "name": "students",
        "type": "address[]"
      }
    ],
    "name": "grantExamAccess",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "examId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "student",
        "type": "address"
      }
    ],
    "name": "hasAccessToExam",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "examId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "student",
        "type": "address"
      },
      {
        "internalType": "externalEuint64",
        "name": "scoreInput",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "scoreProof",
        "type": "bytes"
      },
      {
        "internalType": "string",
        "name": "comment",
        "type": "string"
      }
    ],
    "name": "manualGrade",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "protocolId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "examId",
        "type": "uint256"
      }
    ],
    "name": "publishExam",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "examId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "student",
        "type": "address"
      }
    ],
    "name": "publishGrade",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "name": "questions",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "examId",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "questionIndex",
        "type": "uint8"
      },
      {
        "internalType": "enum AnonExam.QuestionType",
        "name": "questionType",
        "type": "uint8"
      },
      {
        "internalType": "string",
        "name": "questionText",
        "type": "string"
      },
      {
        "internalType": "euint32",
        "name": "correctAnswer",
        "type": "bytes32"
      },
      {
        "internalType": "euint8",
        "name": "points",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "studentExamAccess",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "submissions",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "examId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "student",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "submitTime",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isSubmitted",
        "type": "bool"
      },
      {
        "internalType": "euint64",
        "name": "totalScore",
        "type": "bytes32"
      },
      {
        "internalType": "bool",
        "name": "isGraded",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "examId",
        "type": "uint256"
      },
      {
        "internalType": "externalEuint32[]",
        "name": "encryptedAnswersInput",
        "type": "bytes32[]"
      },
      {
        "internalType": "bytes[]",
        "name": "answersProof",
        "type": "bytes[]"
      }
    ],
    "name": "submitAnswers",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]
} as const;

export type AnonExamABIType = typeof AnonExamABI.abi;

