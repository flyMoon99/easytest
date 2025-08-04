import axios from 'axios';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAiConfig } from '../config/ai.js';
import { getPrompt, getGeminiVideoPrompt } from './promptService.js';
import { createTestResultsFromGeminiAnalysis } from './testResultService.js';

// 获取当前文件的目录路径（ES模块兼容）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 获取当前配置
const getCurrentConfig = () => {
  const config = getAiConfig();
  return {
    aiConfig: config,
    currentModel: config.defaultModel
  };
};

// 当前使用的AI模型
let CURRENT_AI_MODEL = getCurrentConfig().currentModel;

// 获取Gemini实例
const getGeminiInstance = () => {
  const config = getCurrentConfig().aiConfig;
  return new GoogleGenerativeAI(config.gemini.apiKey);
};

/**
 * 将图片转换为base64编码
 * @param {string} imagePath - 图片路径
 * @returns {string} base64编码的图片
 */
const imageToBase64 = (imagePath) => {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    return imageBuffer.toString('base64');
  } catch (error) {
    console.error('图片转换base64失败:', error);
    throw new Error(`图片转换失败: ${error.message}`);
  }
};

/**
 * 压缩图片尺寸（如果图片太大）
 * @param {string} imagePath - 图片路径
 * @returns {string} 压缩后的base64图片
 */
const compressImageIfNeeded = (imagePath) => {
  try {
    const stats = fs.statSync(imagePath);
    const fileSizeInMB = stats.size / (1024 * 1024);
    
    // 如果图片大于5MB，进行压缩
    if (fileSizeInMB > 5) {
      console.log(`图片大小 ${fileSizeInMB.toFixed(2)}MB，建议压缩`);
      // 这里可以添加图片压缩逻辑
      // 暂时返回原始图片，后续可以集成sharp等库进行压缩
    }
    
    return imageToBase64(imagePath);
  } catch (error) {
    console.error('图片处理失败:', error);
    throw new Error(`图片处理失败: ${error.message}`);
  }
};

/**
 * 带重试机制的API调用
 * @param {Function} apiCall - API调用函数
 * @param {number} maxRetries - 最大重试次数
 * @param {number} baseDelay - 基础延迟时间（毫秒）
 * @returns {Promise} API调用结果
 */
const retryApiCall = async (apiCall, maxRetries = 3, baseDelay = 2000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`API调用尝试 ${attempt}/${maxRetries}`);
      return await apiCall();
    } catch (error) {
      lastError = error;
      console.error(`API调用失败 (尝试 ${attempt}/${maxRetries}):`, error.message);
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1); // 指数退避
        console.log(`等待 ${delay}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

/**
 * 将视频文件转换为GenerativePart
 * @param {string} filePath - 视频文件路径
 * @param {string} mimeType - MIME类型
 * @returns {Object} GenerativePart对象
 */
const fileToGenerativePart = (filePath, mimeType) => {
  try {
    return {
      inlineData: {
        data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
        mimeType
      },
    };
  } catch (error) {
    console.error('视频文件转换失败:', error);
    throw new Error(`视频文件转换失败: ${error.message}`);
  }
};

/**
 * 获取视频的MIME类型
 * @param {string} filePath - 视频文件路径
 * @returns {string} MIME类型
 */
const getVideoMimeType = (filePath) => {
  const fileExtension = path.extname(filePath).toLowerCase();
  
  switch (fileExtension) {
    case '.mp4':
      return "video/mp4";
    case '.mov':
      return "video/mp4"; // Chrome不支持video/quicktime，使用video/mp4
    case '.avi':
      return "video/avi";
    case '.webm':
      return "video/webm";
    case '.mkv':
      return "video/x-matroska";
    default:
      return "video/mp4"; // 默认使用mp4
  }
};

/**
 * 创建默认的Gemini分析结果
 * @param {string} videoName - 视频名称
 * @param {string} message - 消息
 * @returns {Object} 默认分析结果
 */
const createDefaultGeminiAnalysis = (videoName, message = '') => {
  return {
    summary: `基于视频名称"${videoName}"的分析结果`,
    testAnalysis: {
      functionalIssues: [
        {
          issue: "无法直接分析视频内容，建议手动检查",
          severity: "medium",
          impact: "需要人工验证",
          recommendation: "建议上传视频截图或手动分析视频内容"
        }
      ],
      uiIssues: [],
      performanceIssues: [],
      compatibilityIssues: [],
      securityIssues: []
    },
    overallAssessment: {
      qualityScore: 50,
      criticalIssues: 0,
      majorIssues: 1,
      minorIssues: 0,
      recommendations: [
        "建议提供视频截图以便AI分析",
        "考虑手动进行端到端测试验证"
      ]
    },
    testRecommendations: [
      {
        testType: "功能测试",
        priority: "medium",
        description: "手动验证视频中展示的功能",
        expectedOutcome: "确认所有功能正常工作"
      }
    ],
    note: message || "此分析基于视频名称进行，建议提供视频截图以获得更准确的分析结果。"
  };
};

/**
 * 通义千问VL-Max图像分析
 * @param {string} screenshotPath - 截图路径
 * @param {string} testDescription - 测试描述
 * @param {string} testType - 测试类型
 * @returns {Promise<{success: boolean, analysis?: string, playwrightScripts?: Array, error?: string}>}
 */
export const analyzeWithQwen = async (screenshotPath, testDescription, testType = 'basic_analysis') => {
  try {
    console.log(`analyzeWithQwen called with testType: ${testType}`);
    const config = getCurrentConfig().aiConfig.qwen;
    
    // 将相对路径转换为绝对路径
    let fullImagePath;
    if (screenshotPath.startsWith('/screenshots/')) {
      // 如果是相对路径，转换为绝对路径
      fullImagePath = path.join(__dirname, '../../public', screenshotPath);
    } else {
      // 如果已经是绝对路径，直接使用
      fullImagePath = screenshotPath;
    }
    
    console.log(`Converting screenshot path: ${screenshotPath} -> ${fullImagePath}`);
    
    // 检查文件是否存在
    if (!fs.existsSync(fullImagePath)) {
      throw new Error(`截图文件不存在: ${fullImagePath}`);
    }
    
    // 读取截图并转换为base64（带压缩检查）
    const base64Image = compressImageIfNeeded(fullImagePath);
    console.log(`图片转换完成，大小: ${(base64Image.length * 0.75 / 1024).toFixed(2)}KB`);
    
    // 获取提示词
    console.log(`Getting prompt for model: qwen-vl-max, testType: ${testType}`);
    const prompt = getPrompt('qwen-vl-max', testType, testDescription);
    console.log('Prompt retrieved successfully');
    
    const requestData = {
      model: config.model,
      input: {
        messages: [
          {
            role: 'user',
            content: [
              {
                text: prompt
              },
              {
                image: `data:image/png;base64,${base64Image}`
              }
            ]
          }
        ]
      },
      parameters: {
        result_format: 'message',
        max_tokens: config.maxTokens,
        temperature: config.temperature
      }
    };
    
    console.log('发送请求到Qwen API...');
    
    // 使用重试机制调用API
    const response = await retryApiCall(async () => {
      return await axios.post(`${config.baseURL}/services/aigc/multimodal-generation/generation`, requestData, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: config.timeout || 60000 // 使用配置中的超时时间
      });
    }, config.maxRetries || 3, config.retryDelay || 2000);
    
    console.log('Qwen API响应状态:', response.status);
    console.log('Qwen API响应数据结构:', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.output && response.data.output.choices) {
      const analysisText = response.data.output.choices[0].message.content;
      console.log('AI分析原始文本:', analysisText);
      
      // 尝试解析AI返回的结果
      let analysisResult = null;
      let parseError = null;
      
      try {
        // 首先尝试直接解析JSON
        analysisResult = JSON.parse(analysisText);
        console.log('AI分析解析结果:', analysisResult);
      } catch (error) {
        parseError = error;
        console.log('JSON解析失败，尝试其他解析方法:', error.message);
        
              // 如果解析失败，尝试其他解析方法
        if (Array.isArray(analysisText) && analysisText.length > 0 && analysisText[0].text) {
          // 处理数组格式的返回结果
          const textContent = analysisText[0].text;
          console.log('AI返回的是数组格式，提取文本内容:', textContent);
          
          // 尝试清理markdown标记并解析JSON
          try {
            const cleanedText = textContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            analysisResult = JSON.parse(cleanedText);
            console.log('从数组格式解析JSON成功:', analysisResult);
          } catch (arrayParseError) {
            console.log('从数组格式解析JSON失败:', arrayParseError.message);
          }
        } else if (typeof analysisText === 'object' && analysisText !== null && !Array.isArray(analysisText)) {
          // 处理对象格式的返回结果
          analysisResult = analysisText;
          console.log('AI返回的是对象格式，直接使用:', analysisResult);
        } else {
          // 尝试清理文本并重新解析
          try {
            const cleanedText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            analysisResult = JSON.parse(cleanedText);
            console.log('清理后JSON解析成功:', analysisResult);
          } catch (cleanError) {
            console.log('清理后JSON解析仍然失败:', cleanError.message);
          }
        }
      }
      
      // 处理解析结果
      if (analysisResult && typeof analysisResult === 'object') {
        return {
          success: true,
          analysis: analysisResult.analysis || analysisResult.analysisText || analysisText,
          playwrightScripts: analysisResult.playwrightScripts || analysisResult.steps || analysisResult.scripts || [],
          testType: analysisResult.testType || testType,
          aiModel: 'qwen-vl-max'
        };
      } else {
        console.log('无法解析AI返回结果，使用原始文本');
        return {
          success: true,
          analysis: analysisText,
          playwrightScripts: [],
          testType: testType,
          aiModel: 'qwen-vl-max'
        };
      }
    }
    
    console.error('AI分析返回数据格式错误:', response.data);
    throw new Error('AI分析返回数据格式错误');
    
  } catch (error) {
    console.error('Qwen分析失败:', error);
    
    // 提供更详细的错误信息
    let errorMessage = 'AI分析失败';
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'AI分析超时，请稍后重试';
    } else if (error.response) {
      errorMessage = `AI服务错误: ${error.response.status} - ${error.response.statusText}`;
    } else if (error.request) {
      errorMessage = '网络连接错误，请检查网络连接';
    } else {
      errorMessage = `AI分析失败: ${error.message}`;
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * ChatGPT Vision图像分析（预留）
 * @param {string} screenshotPath - 截图路径
 * @param {string} testDescription - 测试描述
 * @returns {Promise<{success: boolean, scripts?: Array, error?: string}>}
 */
const analyzeWithChatGPT = async (screenshotPath, testDescription) => {
  // TODO: 实现ChatGPT Vision分析
  return {
    success: false,
    error: 'ChatGPT Vision分析功能尚未实现'
  };
};

/**
 * 测试Gemini API连接（仅文本）
 * @param {string} text - 测试文本
 * @returns {Promise<{success: boolean, response?: string, error?: string}>}
 */
export const testGeminiConnection = async (text = "Hello, how are you?") => {
  try {
    console.log('测试Gemini API连接');
    const config = getCurrentConfig().aiConfig.gemini;
    
    const requestData = {
      contents: [
        {
          parts: [
            {
              text: text
            }
          ]
        }
      ],
      generationConfig: {
        temperature: config.temperature,
        maxOutputTokens: config.maxTokens
      }
    };
    
    const apiCall = async () => {
      const response = await axios.post(
        `${config.baseURL}/models/${config.model}:generateContent`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': config.apiKey
          },
          timeout: config.timeout
        }
      );
      
      return response.data;
    };
    
    const result = await retryApiCall(apiCall, config.maxRetries, config.retryDelay);
    
    if (result.candidates && result.candidates[0] && result.candidates[0].content) {
      const responseText = result.candidates[0].content.parts[0].text;
      return {
        success: true,
        response: responseText
      };
    } else {
      throw new Error('Gemini API返回了无效的响应格式');
    }
    
  } catch (error) {
    console.error('Gemini连接测试失败:', error);
    
    let errorMessage = 'Gemini连接测试失败';
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Gemini连接测试超时';
    } else if (error.response) {
      errorMessage = `Gemini服务错误: ${error.response.status} - ${error.response.statusText}`;
    } else if (error.request) {
      errorMessage = '网络连接错误';
    } else {
      errorMessage = `Gemini连接测试失败: ${error.message}`;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Gemini 2.0 Flash视频内容分析（使用官方库）
 * @param {string} videoPath - 视频文件路径
 * @param {string} videoName - 视频名称
 * @param {string} memberId - 会员ID
 * @param {string} videoId - 视频ID
 * @returns {Promise<{success: boolean, analysis?: Object, rawResponse?: string, error?: string}>}
 */
export const analyzeVideoWithGemini = async (videoPath, videoName, memberId = null, videoId = null, testDescription = '') => {
  try {
    console.log(`开始使用Gemini分析视频: ${videoName}`);
    console.log(`测试说明: ${testDescription || '无'}`);
    
    // 将视频路径转换为绝对路径
    let fullVideoPath;
    if (videoPath.startsWith('/uploads/')) {
      fullVideoPath = path.join(__dirname, '../../public', videoPath);
    } else {
      fullVideoPath = path.resolve(videoPath);
    }
    
    // 检查视频文件是否存在
    if (!fs.existsSync(fullVideoPath)) {
      throw new Error(`视频文件不存在: ${fullVideoPath}`);
    }
    
    // 获取视频文件信息
    const stats = fs.statSync(fullVideoPath);
    const fileSizeInMB = stats.size / (1024 * 1024);
    console.log(`视频文件大小: ${fileSizeInMB.toFixed(2)}MB`);
    
    // 检查文件大小限制（Gemini API可能有文件大小限制）
    if (fileSizeInMB > 10) {
      console.log(`文件过大 (${fileSizeInMB.toFixed(2)}MB)，使用文本分析模式`);
      return {
        success: true,
        analysis: createDefaultGeminiAnalysis(videoName, `文件过大 (${fileSizeInMB.toFixed(2)}MB)，Gemini API可能不支持`),
        rawResponse: '文件过大，使用默认分析模式'
      };
    }
    
    // 获取MIME类型
    const mimeType = getVideoMimeType(fullVideoPath);
    console.log(`使用MIME类型: ${mimeType} 处理文件: ${fullVideoPath}`);
    
    // 获取提示词（包含测试说明）
    const prompt = getGeminiVideoPrompt(videoName, testDescription);
    
    // 创建模型实例
    const model = getGeminiInstance().getGenerativeModel({ model: getCurrentConfig().aiConfig.gemini.model });
    
    // 将视频文件转换为GenerativePart
    const videoPart = fileToGenerativePart(fullVideoPath, mimeType);
    
    try {
      console.log('调用Gemini API进行视频分析...');
      
      // 调用Gemini API
      const result = await model.generateContent([prompt, videoPart]);
      const response = await result.response;
      const analysisText = response.text();
      
      console.log('Gemini API响应成功，解析分析结果...');
      console.log('原始响应内容:', analysisText);
      
      // 尝试解析JSON响应
      let analysis;
      let isJsonResponse = false;
      let cleanedAnalysisText = analysisText;
      
      try {
        analysis = JSON.parse(analysisText);
        console.log('成功解析JSON响应');
        isJsonResponse = true;
      } catch (parseError) {
        console.log('直接JSON解析失败，尝试清理markdown标记:', parseError.message);
        
        // 尝试清理markdown代码块标记
        try {
          cleanedAnalysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          analysis = JSON.parse(cleanedAnalysisText);
          console.log('清理markdown后成功解析JSON响应');
          isJsonResponse = true;
        } catch (secondParseError) {
          console.log('清理后仍然解析失败，创建默认分析结果:', secondParseError.message);
          analysis = createDefaultGeminiAnalysis(videoName, 'AI返回的内容不是有效的JSON格式');
          cleanedAnalysisText = analysisText; // 保持原始内容
        }
      }
      
      // 确保分析结果符合MongoDB模型要求
      const validatedAnalysis = validateAndFixAnalysis(analysis, videoName);
      
      // 如果提供了memberId和videoId，创建TestResult记录
      if (memberId && videoId) {
        try {
          await createTestResultsFromGeminiAnalysis(memberId, videoId, validatedAnalysis);
          console.log('成功创建测试结果记录');
        } catch (testResultError) {
          console.error('创建测试结果记录失败:', testResultError);
        }
      }
      
      return {
        success: true,
        analysis: validatedAnalysis,
        rawResponse: analysisText,
        cleanedResponse: isJsonResponse ? cleanedAnalysisText : analysisText,
        isJsonResponse: isJsonResponse
      };
      
    } catch (videoError) {
      console.log('视频分析失败，尝试文本分析模式:', videoError.message);
      
      // 如果视频分析失败，尝试文本分析模式
      const textPrompt = `请分析视频"${videoName}"的内容，从端到端测试专家的角度提供分析报告。由于无法直接分析视频内容，请基于视频名称和文件信息提供一般性的测试建议。`;
      
      try {
        const textResult = await model.generateContent(textPrompt);
        const textResponse = await textResult.response;
        const textAnalysisText = textResponse.text();
        
        console.log('文本分析模式原始响应:', textAnalysisText);
        
        // 创建基于文本的分析结果
        const analysis = createDefaultGeminiAnalysis(videoName, '基于文本分析模式');
        
        // 如果提供了memberId和videoId，创建TestResult记录
        if (memberId && videoId) {
          try {
            await createTestResultsFromGeminiAnalysis(memberId, videoId, analysis);
            console.log('成功创建测试结果记录（文本分析模式）');
          } catch (testResultError) {
            console.error('创建测试结果记录失败:', testResultError);
          }
        }
        
        return {
          success: true,
          analysis: analysis,
          rawResponse: textAnalysisText,
          isJsonResponse: false
        };
      } catch (textError) {
        console.log('文本分析也失败了:', textError.message);
        
        // 返回默认分析结果
        const defaultAnalysis = createDefaultGeminiAnalysis(videoName, '所有分析模式都失败了');
        
        // 如果提供了memberId和videoId，创建TestResult记录
        if (memberId && videoId) {
          try {
            await createTestResultsFromGeminiAnalysis(memberId, videoId, defaultAnalysis);
            console.log('成功创建测试结果记录（默认模式）');
          } catch (testResultError) {
            console.error('创建测试结果记录失败:', testResultError);
          }
        }
        
        return {
          success: true,
          analysis: defaultAnalysis,
          rawResponse: '所有分析模式都失败了',
          isJsonResponse: false
        };
      }
    }
    
  } catch (error) {
    console.error('Gemini视频分析失败:', error);
    
    // 返回默认分析结果而不是抛出错误
    const errorAnalysis = createDefaultGeminiAnalysis(videoName, `分析失败: ${error.message}`);
    
    // 如果提供了memberId和videoId，创建TestResult记录
    if (memberId && videoId) {
      try {
        await createTestResultsFromGeminiAnalysis(memberId, videoId, errorAnalysis);
        console.log('成功创建测试结果记录（错误模式）');
      } catch (testResultError) {
        console.error('创建测试结果记录失败:', testResultError);
      }
    }
    
    return {
      success: true,
      analysis: errorAnalysis,
      rawResponse: `分析失败: ${error.message}`,
      isJsonResponse: false
    };
  }
};

/**
 * 验证和修复分析结果，确保符合MongoDB模型要求
 * @param {Object} analysis - 原始分析结果
 * @param {string} videoName - 视频名称
 * @returns {Object} 验证后的分析结果
 */
const validateAndFixAnalysis = (analysis, videoName) => {
  // 确保所有必需的字段都存在
  const validatedAnalysis = {
    summary: analysis.summary || `视频"${videoName}"的分析结果`,
    testAnalysis: {
      functionalIssues: Array.isArray(analysis.testAnalysis?.functionalIssues) 
        ? analysis.testAnalysis.functionalIssues 
        : [],
      uiIssues: Array.isArray(analysis.testAnalysis?.uiIssues) 
        ? analysis.testAnalysis.uiIssues 
        : [],
      performanceIssues: Array.isArray(analysis.testAnalysis?.performanceIssues) 
        ? analysis.testAnalysis.performanceIssues 
        : [],
      compatibilityIssues: Array.isArray(analysis.testAnalysis?.compatibilityIssues) 
        ? analysis.testAnalysis.compatibilityIssues 
        : [],
      securityIssues: Array.isArray(analysis.testAnalysis?.securityIssues) 
        ? analysis.testAnalysis.securityIssues 
        : []
    },
    overallAssessment: {
      qualityScore: analysis.overallAssessment?.qualityScore || 50,
      criticalIssues: analysis.overallAssessment?.criticalIssues || 0,
      majorIssues: analysis.overallAssessment?.majorIssues || 0,
      minorIssues: analysis.overallAssessment?.minorIssues || 0,
      recommendations: Array.isArray(analysis.overallAssessment?.recommendations) 
        ? analysis.overallAssessment.recommendations 
        : []
    },
    testRecommendations: Array.isArray(analysis.testRecommendations) 
      ? analysis.testRecommendations 
      : []
  };
  
  // 验证和修复每个问题项的字段
  const validateIssue = (issue) => {
    return {
      issue: issue.issue || '未指定问题',
      severity: ['high', 'medium', 'low'].includes(issue.severity) ? issue.severity : 'medium',
      impact: issue.impact || '影响未指定',
      recommendation: issue.recommendation || '建议未指定'
    };
  };
  
  // 验证和修复每个测试建议的字段
  const validateRecommendation = (rec) => {
    return {
      testType: ['功能测试', 'UI测试', '性能测试', '兼容性测试', '安全测试'].includes(rec.testType) 
        ? rec.testType 
        : '功能测试',
      priority: ['high', 'medium', 'low'].includes(rec.priority) ? rec.priority : 'medium',
      description: rec.description || '描述未指定',
      expectedOutcome: rec.expectedOutcome || '预期结果未指定'
    };
  };
  
  // 应用验证
  validatedAnalysis.testAnalysis.functionalIssues = validatedAnalysis.testAnalysis.functionalIssues.map(validateIssue);
  validatedAnalysis.testAnalysis.uiIssues = validatedAnalysis.testAnalysis.uiIssues.map(validateIssue);
  validatedAnalysis.testAnalysis.performanceIssues = validatedAnalysis.testAnalysis.performanceIssues.map(validateIssue);
  validatedAnalysis.testAnalysis.compatibilityIssues = validatedAnalysis.testAnalysis.compatibilityIssues.map(validateIssue);
  validatedAnalysis.testAnalysis.securityIssues = validatedAnalysis.testAnalysis.securityIssues.map(validateIssue);
  validatedAnalysis.testRecommendations = validatedAnalysis.testRecommendations.map(validateRecommendation);
  
  return validatedAnalysis;
};

/**
 * 主要的图像分析接口
 * @param {string} screenshotPath - 截图路径
 * @param {string} testDescription - 测试描述
 * @param {string} aiModel - AI模型名称（可选，默认使用配置的模型）
 * @returns {Promise<{success: boolean, analysis?: string, scripts?: Array, error?: string}>}
 */
export const analyzeScreenshotAndGenerateScripts = async (screenshotPath, testDescription, aiModel = CURRENT_AI_MODEL, testType = 'basic_analysis') => {
  console.log(`开始使用 ${aiModel} 分析截图并生成测试脚本`);
  
  try {
    return await analyzeWithModel(aiModel, screenshotPath, testDescription, testType);
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 获取可用的AI模型列表
 * @returns {Array} 可用模型列表
 */
export const getAvailableModels = () => {
  const config = getCurrentConfig().aiConfig;
  return config.supportedModels.map(model => ({
    ...model,
    current: model.id === CURRENT_AI_MODEL
  }));
};

/**
 * 设置当前使用的AI模型
 * @param {string} modelId - 模型ID
 * @returns {boolean} 设置是否成功
 */
export const setCurrentModel = (modelId) => {
  const config = getCurrentConfig().aiConfig;
  const model = config.supportedModels.find(m => m.id === modelId);
  if (model) {
    CURRENT_AI_MODEL = modelId;
    return true;
  }
  return false;
};

/**
 * 根据模型ID分析截图
 * @param {string} modelId - AI模型ID
 * @param {string} screenshotPath - 截图路径
 * @param {string} testDescription - 测试描述
 * @param {string} testType - 测试类型
 * @returns {Object} 分析结果
 */
export const analyzeWithModel = async (modelId, screenshotPath, testDescription, testType = 'basic_analysis') => {
  switch (modelId) {
    case 'qwen-vl-max':
      return await analyzeWithQwen(screenshotPath, testDescription, testType);
    case 'gpt-4-vision':
      // TODO: 实现ChatGPT Vision分析
      throw new Error('ChatGPT Vision模型暂未实现');
    case 'gemini-2.0-flash':
      // Gemini主要用于视频分析，图像分析暂不支持
      throw new Error('Gemini 2.0 Flash模型主要用于视频分析，图像分析请使用其他模型');
    default:
      throw new Error(`不支持的AI模型: ${modelId}`);
  }
};

/**
 * 获取当前AI模型
 * @returns {string} 当前AI模型ID
 */
export const getCurrentAIModel = () => {
  return CURRENT_AI_MODEL;
};