// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, euint64, euint8, ebool, externalEuint32, externalEuint64, externalEuint8} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title AnonExam - Anonymous Encrypted Online Exam Platform
/// @author AnonExam Team
/// @notice A decentralized exam platform using FHEVM for privacy-preserving education
contract AnonExam is SepoliaConfig {
    
    // 考试状态枚举
    enum ExamStatus {
        NotStarted,
        InProgress, 
        Ended,
        Graded
    }
    
    // 题目类型枚举
    enum QuestionType {
        MultipleChoice,  // 选择题
        FillInBlank,    // 填空题
        ShortAnswer     // 简答题
    }
    
    // 考试结构体
    struct Exam {
        uint256 examId;
        string title;
        string description;
        address teacher;
        uint256 startTime;
        uint256 endTime;
        uint256 duration; // 考试时长(分钟)
        uint8 questionCount;
        bool isPublished;
        ExamStatus status;
        uint256 maxScore; // 总分
    }
    
    // 题目结构体
    struct Question {
        uint256 examId;
        uint8 questionIndex;
        QuestionType questionType;
        string questionText;
        string[] options; // 选择题选项
        euint32 correctAnswer; // 加密的正确答案
        euint8 points; // 分值
    }
    
    // 学生答案提交结构体
    struct Submission {
        uint256 examId;
        address student;
        uint256 submitTime;
        bool isSubmitted;
        euint32[] encryptedAnswers; // 加密答案数组
        euint64 totalScore; // 加密总分
        bool isGraded;
    }
    
    // 成绩结构体
    struct Grade {
        uint256 examId;
        address student;
        euint64 encryptedScore;
        euint8 encryptedGradeLevel; // A/B/C/D/F (0-4)
        bool isPublished;
        uint256 gradedTime;
        string teacherComment;
    }

    // 状态变量
    uint256 private examCounter;
    mapping(uint256 => Exam) public exams;
    mapping(uint256 => mapping(uint8 => Question)) public questions; // examId => questionIndex => Question
    mapping(uint256 => mapping(address => Submission)) public submissions; // examId => student => Submission
    mapping(uint256 => mapping(address => Grade)) public grades; // examId => student => Grade
    mapping(address => bool) public authorizedTeachers;
    mapping(uint256 => address[]) public examStudents; // examId => student addresses
    
    // 权限控制
    mapping(address => mapping(uint256 => bool)) public studentExamAccess; // student => examId => hasAccess
    
    // 事件
    event ExamCreated(uint256 indexed examId, address indexed teacher, string title);
    event ExamPublished(uint256 indexed examId);
    event AnswerSubmitted(uint256 indexed examId, address indexed student, uint256 submitTime);
    event ExamGraded(uint256 indexed examId, address indexed student, address indexed teacher);
    event GradePublished(uint256 indexed examId, address indexed student);
    
    // 修饰符
    modifier onlyTeacher() {
        require(authorizedTeachers[msg.sender], "Only authorized teachers can perform this action");
        _;
    }
    
    modifier onlyExamTeacher(uint256 examId) {
        require(exams[examId].teacher == msg.sender, "Only exam creator can perform this action");
        _;
    }
    
    modifier examExists(uint256 examId) {
        require(examId > 0 && examId <= examCounter, "Exam does not exist");
        _;
    }
    
    modifier examInProgress(uint256 examId) {
        require(block.timestamp >= exams[examId].startTime, "Exam has not started yet");
        require(block.timestamp <= exams[examId].endTime, "Exam has ended");
        _;
    }
    
    modifier hasExamAccess(uint256 examId) {
        require(exams[examId].isPublished, "Exam is not published");
        _;
    }

    constructor() {
        // 初始化时授权部署者为教师
        authorizedTeachers[msg.sender] = true;
    }
    
    /// @notice 授权教师权限
    /// @param teacher 教师地址
    function authorizeTeacher(address teacher) external onlyTeacher {
        authorizedTeachers[teacher] = true;
    }
    
    /// @notice 创建新考试
    /// @param title 考试标题
    /// @param description 考试描述
    /// @param startTime 开始时间
    /// @param endTime 结束时间
    /// @param duration 考试时长(分钟)
    /// @param maxScore 总分
    function createExam(
        string memory title,
        string memory description,
        uint256 startTime,
        uint256 endTime,
        uint256 duration,
        uint256 maxScore
    ) external onlyTeacher returns (uint256) {
        require(startTime > block.timestamp, "Start time must be in the future");
        require(endTime > startTime, "End time must be after start time");
        require(duration > 0, "Duration must be positive");
        
        examCounter++;
        
        exams[examCounter] = Exam({
            examId: examCounter,
            title: title,
            description: description,
            teacher: msg.sender,
            startTime: startTime,
            endTime: endTime,
            duration: duration,
            questionCount: 0,
            isPublished: false,
            status: ExamStatus.NotStarted,
            maxScore: maxScore
        });
        
        emit ExamCreated(examCounter, msg.sender, title);
        return examCounter;
    }
    
    /// @notice 添加题目到考试
    /// @param examId 考试ID
    /// @param questionType 题目类型
    /// @param questionText 题目内容
    /// @param options 选择题选项
    /// @param correctAnswerInput 加密的正确答案
    /// @param correctAnswerProof 正确答案的证明
    /// @param pointsInput 分值输入
    /// @param pointsProof 分值证明
    function addQuestion(
        uint256 examId,
        QuestionType questionType,
        string memory questionText,
        string[] memory options,
        externalEuint32 correctAnswerInput,
        bytes calldata correctAnswerProof,
        externalEuint8 pointsInput,
        bytes calldata pointsProof
    ) external examExists(examId) onlyExamTeacher(examId) {
        require(!exams[examId].isPublished, "Cannot modify published exam");
        
        euint32 correctAnswer = FHE.fromExternal(correctAnswerInput, correctAnswerProof);
        euint8 points = FHE.fromExternal(pointsInput, pointsProof);
        
        uint8 questionIndex = exams[examId].questionCount;
        
        questions[examId][questionIndex] = Question({
            examId: examId,
            questionIndex: questionIndex,
            questionType: questionType,
            questionText: questionText,
            options: options,
            correctAnswer: correctAnswer,
            points: points
        });
        
        exams[examId].questionCount++;
        
        // 设置ACL权限
        FHE.allowThis(correctAnswer);
        FHE.allow(correctAnswer, msg.sender);
        FHE.allowThis(points);
        FHE.allow(points, msg.sender);
    }
    
    /// @notice 发布考试
    /// @param examId 考试ID
    function publishExam(uint256 examId) external examExists(examId) onlyExamTeacher(examId) {
        require(!exams[examId].isPublished, "Exam already published");
        require(exams[examId].questionCount > 0, "Exam must have at least one question");
        
        exams[examId].isPublished = true;
        emit ExamPublished(examId);
    }
    
    
    /// @notice 提交考试答案
    /// @param examId 考试ID
    /// @param encryptedAnswersInput 加密答案数组
    /// @param answersProof 答案证明数组
    function submitAnswers(
        uint256 examId,
        externalEuint32[] memory encryptedAnswersInput,
        bytes[] calldata answersProof
    ) external examExists(examId) examInProgress(examId) hasExamAccess(examId) {
        require(!submissions[examId][msg.sender].isSubmitted, "Already submitted");
        require(encryptedAnswersInput.length == exams[examId].questionCount, "Answer count mismatch");
        require(answersProof.length == encryptedAnswersInput.length, "Proof count mismatch");
        
        euint32[] memory encryptedAnswers = new euint32[](encryptedAnswersInput.length);
        
        // 转换外部加密输入为内部类型
        for (uint i = 0; i < encryptedAnswersInput.length; i++) {
            encryptedAnswers[i] = FHE.fromExternal(encryptedAnswersInput[i], answersProof[i]);
            // 设置ACL权限
            FHE.allowThis(encryptedAnswers[i]);
            FHE.allow(encryptedAnswers[i], msg.sender);
            FHE.allow(encryptedAnswers[i], exams[examId].teacher);
        }
        
        submissions[examId][msg.sender] = Submission({
            examId: examId,
            student: msg.sender,
            submitTime: block.timestamp,
            isSubmitted: true,
            encryptedAnswers: encryptedAnswers,
            totalScore: FHE.asEuint64(0),
            isGraded: false
        });
        
        // 自动添加学生到考试学生列表
        examStudents[examId].push(msg.sender);
        
        emit AnswerSubmitted(examId, msg.sender, block.timestamp);
    }
    
    /// @notice 自动评分选择题
    /// @param examId 考试ID
    /// @param student 学生地址
    function autoGradeMultipleChoice(uint256 examId, address student) 
        external examExists(examId) onlyExamTeacher(examId) {
        require(submissions[examId][student].isSubmitted, "Student has not submitted");
        require(!submissions[examId][student].isGraded, "Already graded");
        
        euint64 totalScore = FHE.asEuint64(0);
        
        for (uint8 i = 0; i < exams[examId].questionCount; i++) {
            Question storage question = questions[examId][i];
            if (question.questionType == QuestionType.MultipleChoice) {
                euint32 studentAnswer = submissions[examId][student].encryptedAnswers[i];
                euint32 correctAnswer = question.correctAnswer;
                
                // 比较答案是否正确
                ebool isCorrect = FHE.eq(studentAnswer, correctAnswer);
                
                // 如果正确，加上分数
                euint8 points = question.points;
                euint64 pointsAsEuint64 = FHE.asEuint64(points);
                euint64 earnedPoints = FHE.select(isCorrect, pointsAsEuint64, FHE.asEuint64(0));
                totalScore = FHE.add(totalScore, earnedPoints);
            }
        }
        
        submissions[examId][student].totalScore = totalScore;
        submissions[examId][student].isGraded = true;
        
        // 设置ACL权限
        FHE.allowThis(totalScore);
        FHE.allow(totalScore, student);
        FHE.allow(totalScore, msg.sender);
        
        emit ExamGraded(examId, student, msg.sender);
    }
    
    /// @notice 手动评分（适用于简答题）
    /// @param examId 考试ID
    /// @param student 学生地址
    /// @param scoreInput 加密分数
    /// @param scoreProof 分数证明
    /// @param comment 教师评语
    function manualGrade(
        uint256 examId,
        address student,
        externalEuint64 scoreInput,
        bytes calldata scoreProof,
        string memory comment
    ) external examExists(examId) onlyExamTeacher(examId) {
        require(submissions[examId][student].isSubmitted, "Student has not submitted");
        
        euint64 encryptedScore = FHE.fromExternal(scoreInput, scoreProof);
        
        // 计算等级 (A: 90-100, B: 80-89, C: 70-79, D: 60-69, F: <60)
        euint64 score90 = FHE.asEuint64(90);
        euint64 score80 = FHE.asEuint64(80);
        euint64 score70 = FHE.asEuint64(70);
        euint64 score60 = FHE.asEuint64(60);
        
        ebool isA = FHE.ge(encryptedScore, score90);
        ebool isB = FHE.and(FHE.ge(encryptedScore, score80), FHE.lt(encryptedScore, score90));
        ebool isC = FHE.and(FHE.ge(encryptedScore, score70), FHE.lt(encryptedScore, score80));
        ebool isD = FHE.and(FHE.ge(encryptedScore, score60), FHE.lt(encryptedScore, score70));
        
        euint8 gradeLevel = FHE.select(isA, FHE.asEuint8(0), // A
                            FHE.select(isB, FHE.asEuint8(1), // B  
                            FHE.select(isC, FHE.asEuint8(2), // C
                            FHE.select(isD, FHE.asEuint8(3), // D
                            FHE.asEuint8(4))))); // F
        
        grades[examId][student] = Grade({
            examId: examId,
            student: student,
            encryptedScore: encryptedScore,
            encryptedGradeLevel: gradeLevel,
            isPublished: false,
            gradedTime: block.timestamp,
            teacherComment: comment
        });
        
        submissions[examId][student].totalScore = encryptedScore;
        submissions[examId][student].isGraded = true;
        
        // 设置ACL权限
        FHE.allowThis(encryptedScore);
        FHE.allow(encryptedScore, student);
        FHE.allow(encryptedScore, msg.sender);
        FHE.allowThis(gradeLevel);
        FHE.allow(gradeLevel, student);
        FHE.allow(gradeLevel, msg.sender);
        
        emit ExamGraded(examId, student, msg.sender);
    }
    
    /// @notice 发布成绩
    /// @param examId 考试ID
    /// @param student 学生地址
    function publishGrade(uint256 examId, address student) 
        external examExists(examId) onlyExamTeacher(examId) {
        require(submissions[examId][student].isGraded, "Not graded yet");
        require(!grades[examId][student].isPublished, "Already published");
        
        grades[examId][student].isPublished = true;
        emit GradePublished(examId, student);
    }
    
    /// @notice 获取考试基本信息
    /// @param examId 考试ID
    function getExamInfo(uint256 examId) external view examExists(examId) 
        returns (
            string memory title,
            string memory description,
            address teacher,
            uint256 startTime,
            uint256 endTime,
            uint256 duration,
            uint8 questionCount,
            bool isPublished,
            ExamStatus status
        ) {
        Exam storage exam = exams[examId];
        return (
            exam.title,
            exam.description,
            exam.teacher,
            exam.startTime,
            exam.endTime,
            exam.duration,
            exam.questionCount,
            exam.isPublished,
            exam.status
        );
    }
    
    /// @notice 获取题目信息（不包含正确答案）
    /// @param examId 考试ID
    /// @param questionIndex 题目索引
    function getQuestionInfo(uint256 examId, uint8 questionIndex) 
        external view examExists(examId) hasExamAccess(examId)
        returns (
            QuestionType questionType,
            string memory questionText,
            string[] memory options
        ) {
        Question storage question = questions[examId][questionIndex];
        return (
            question.questionType,
            question.questionText,
            question.options
        );
    }
    
    /// @notice 获取学生提交状态
    /// @param examId 考试ID
    /// @param student 学生地址
    function getSubmissionStatus(uint256 examId, address student) 
        external view examExists(examId) 
        returns (bool isSubmitted, uint256 submitTime, bool isGraded) {
        Submission storage submission = submissions[examId][student];
        return (submission.isSubmitted, submission.submitTime, submission.isGraded);
    }
    
    /// @notice 获取学生成绩（仅学生本人或教师可查看）
    /// @param examId 考试ID
    /// @param student 学生地址
    function getStudentGrade(uint256 examId, address student) 
        external view examExists(examId)
        returns (euint64 encryptedScore, euint8 encryptedGradeLevel, bool isPublished, string memory comment) {
        require(
            msg.sender == student || msg.sender == exams[examId].teacher,
            "Only student or teacher can view grade"
        );
        require(grades[examId][student].isPublished, "Grade not published yet");
        
        Grade storage grade = grades[examId][student];
        return (grade.encryptedScore, grade.encryptedGradeLevel, grade.isPublished, grade.teacherComment);
    }
    
    /// @notice 获取考试总数
    function getTotalExams() external view returns (uint256) {
        return examCounter;
    }
    
    /// @notice 检查是否有考试访问权限
    /// @param examId 考试ID
    function hasAccessToExam(uint256 examId, address /* student */) external view returns (bool) {
        return exams[examId].isPublished;
    }
    
    /// @notice 获取考试的所有学生
    /// @param examId 考试ID
    function getExamStudents(uint256 examId) external view examExists(examId) 
        onlyExamTeacher(examId) returns (address[] memory) {
        return examStudents[examId];
    }
    
    /// @notice 获取学生的加密答案句柄（教师专用）
    /// @param examId 考试ID
    /// @param student 学生地址
    /// @param answerIndex 答案索引
    function getStudentAnswer(uint256 examId, address student, uint8 answerIndex) 
        external view examExists(examId) onlyExamTeacher(examId) returns (euint32) {
        require(submissions[examId][student].isSubmitted, "Student has not submitted");
        require(answerIndex < submissions[examId][student].encryptedAnswers.length, "Invalid answer index");
        
        return submissions[examId][student].encryptedAnswers[answerIndex];
    }
    
    /// @notice 获取学生答案数量
    /// @param examId 考试ID
    /// @param student 学生地址
    function getStudentAnswerCount(uint256 examId, address student) 
        external view examExists(examId) onlyExamTeacher(examId) returns (uint256) {
        require(submissions[examId][student].isSubmitted, "Student has not submitted");
        
        return submissions[examId][student].encryptedAnswers.length;
    }
    
    /// @notice 计算班级平均分（加密计算）
    /// @param examId 考试ID
    function calculateClassAverage(uint256 examId) external examExists(examId) 
        onlyExamTeacher(examId) returns (euint64) {
        address[] memory students = examStudents[examId];
        require(students.length > 0, "No students in exam");
        
        euint64 totalScore = FHE.asEuint64(0);
        uint256 gradedCount = 0;
        
        for (uint i = 0; i < students.length; i++) {
            if (submissions[examId][students[i]].isGraded) {
                totalScore = FHE.add(totalScore, submissions[examId][students[i]].totalScore);
                gradedCount++;
            }
        }
        
        require(gradedCount > 0, "No graded submissions");
        
        // 计算平均分 (简化处理，避免类型转换问题)
        // 在实际应用中可以使用更复杂的计算方式
        euint64 average = totalScore; // 暂时返回总分，实际应用中需要正确的平均值计算
        
        // 设置ACL权限
        FHE.allowThis(average);
        FHE.allow(average, msg.sender);
        
        return average;
    }
}
