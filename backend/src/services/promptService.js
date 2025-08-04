/**
 * AI提示词管理服务
 * 支持多种AI模型的提示词模板管理
 */

// 通义千问VL-Max提示词模板
const QWEN_PROMPTS = {
  // 基础图像分析提示词
  basic_analysis: `你是一个专业的Web自动化端到端的测试专家。请分析这个网页截图，结合测试描述，生成详细的Playwright测试脚本。

测试描述：{testDescription}

请按照以下要求：
1. 仔细分析截图中的页面元素（按钮、输入框、链接、表单等）
2. 根据测试描述理解测试目标和预期行为
3. 将测试步骤拆解为多个原子操作
4. 为每个操作生成对应的Playwright代码
5. 提供准确的元素选择器（优先使用data-testid、id、class等稳定选择器）
6. 考虑页面加载、元素等待等异步操作

请严格按照以下JSON格式返回结果，不要添加任何额外的文本或说明：

{
  "analysis": "页面分析结果，描述页面主要元素和布局",
  "playwrightScripts": [
    {
      "step": 1,
      "description": "步骤描述",
      "action": "playwright方法名（如click、fill、waitForSelector等）",
      "selector": "元素选择器",
      "value": "输入值（如果需要）",
      "explanation": "操作说明和注意事项"
    }
  ]
}

注意：
1. 必须返回有效的JSON格式
2. 不要添加任何markdown标记
3. 不要添加任何额外的说明文字
4. 确保JSON格式完全正确`,

  // 表单测试专用提示词
  form_testing: `你是一个专业的Web表单端到端的测试专家。请分析这个网页截图中的表单元素，结合测试描述生成表单测试脚本。

测试描述：{testDescription}

重点关注：
1. 识别所有表单字段（输入框、下拉框、单选框、复选框等）
2. 分析表单验证规则
3. 生成填写表单的测试步骤
4. 包含表单提交和验证步骤
5. 考虑错误处理和边界情况

请严格按照以下JSON格式返回结果：

{
  "analysis": "表单分析结果",
  "playwrightScripts": [
    {
      "step": 1,
      "description": "步骤描述",
      "action": "playwright方法名",
      "selector": "元素选择器",
      "value": "输入值",
      "explanation": "操作说明"
    }
  ]
}

注意：必须返回有效的JSON格式，不要添加任何额外文本。`,

  // 导航测试专用提示词
  navigation_testing: `你是一个专业的Web导航测试专家。请分析这个网页截图中的导航元素，生成导航测试脚本。

测试描述：{testDescription}

重点关注：
1. 识别导航菜单、链接、按钮
2. 分析页面跳转逻辑
3. 生成点击导航的测试步骤
4. 验证页面跳转结果
5. 考虑面包屑导航和返回操作

请严格按照以下JSON格式返回结果：

{
  "analysis": "导航分析结果",
  "playwrightScripts": [
    {
      "step": 1,
      "description": "步骤描述",
      "action": "playwright方法名",
      "selector": "元素选择器",
      "value": "输入值",
      "explanation": "操作说明"
    }
  ]
}

注意：必须返回有效的JSON格式，不要添加任何额外文本。`
};

// ChatGPT Vision提示词模板
const CHATGPT_PROMPTS = {
  basic_analysis: `You are a professional web automation testing expert. Please analyze this webpage screenshot and generate detailed Playwright test scripts based on the test description.

Test Description: {testDescription}

Requirements:
1. Carefully analyze page elements (buttons, inputs, links, forms, etc.)
2. Understand test objectives based on the description
3. Break down test steps into atomic operations
4. Generate corresponding Playwright code for each operation
5. Provide accurate element selectors
6. Consider async operations like page loading and element waiting

Return in JSON format with analysis and steps array.`,

  form_testing: `You are a web form testing expert. Analyze the form elements in this screenshot and generate form testing scripts.

Test Description: {testDescription}

Focus on form fields, validation rules, submission, and error handling.

Return in JSON format.`,

  navigation_testing: `You are a web navigation testing expert. Analyze navigation elements and generate navigation test scripts.

Test Description: {testDescription}

Focus on menus, links, page transitions, and navigation validation.

Return in JSON format.`
};

// 提示词模板映射
const PROMPT_TEMPLATES = {
  qwen: QWEN_PROMPTS,
  'qwen-vl-max': QWEN_PROMPTS,
  chatgpt: CHATGPT_PROMPTS
};

/**
 * 根据测试类型和AI模型获取提示词
 * @param {string} aiModel - AI模型名称
 * @param {string} testType - 测试类型（basic_analysis, form_testing, navigation_testing）
 * @param {string} testDescription - 测试描述
 * @returns {string} 格式化后的提示词
 */
export const getPrompt = (aiModel, testType = 'basic_analysis', testDescription = '') => {
  const templates = PROMPT_TEMPLATES[aiModel];
  
  if (!templates) {
    throw new Error(`不支持的AI模型: ${aiModel}`);
  }
  
  const template = templates[testType];
  
  if (!template) {
    throw new Error(`不支持的测试类型: ${testType}`);
  }
  
  // 替换模板中的变量
  return template.replace('{testDescription}', testDescription);
};

/**
 * 智能检测测试类型
 * @param {string} testDescription - 测试描述
 * @returns {string} 推荐的测试类型
 */
export const detectTestType = (testDescription) => {
  const description = testDescription.toLowerCase();
  
  // 表单相关关键词
  const formKeywords = ['表单', '填写', '输入', '提交', '注册', '登录', '搜索', 'form', 'input', 'submit', 'register', 'login'];
  
  // 导航相关关键词
  const navigationKeywords = ['导航', '菜单', '跳转', '链接', '页面', '返回', 'navigation', 'menu', 'link', 'page', 'redirect'];
  
  // 检测表单测试
  if (formKeywords.some(keyword => description.includes(keyword))) {
    return 'form_testing';
  }
  
  // 检测导航测试
  if (navigationKeywords.some(keyword => description.includes(keyword))) {
    return 'navigation_testing';
  }
  
  // 默认返回基础分析
  return 'basic_analysis';
};

/**
 * 获取所有可用的测试类型
 * @returns {Array} 测试类型列表
 */
export const getAvailableTestTypes = () => {
  return [
    {
      key: 'basic_analysis',
      name: '基础分析',
      description: '通用的页面元素分析和测试脚本生成'
    },
    {
      key: 'form_testing',
      name: '表单测试',
      description: '专门针对表单填写和提交的测试'
    },
    {
      key: 'navigation_testing',
      name: '导航测试',
      description: '专门针对页面导航和跳转的测试'
    }
  ];
};

/**
 * 添加自定义提示词模板
 * @param {string} aiModel - AI模型名称
 * @param {string} testType - 测试类型
 * @param {string} template - 提示词模板
 * @returns {boolean} 添加是否成功
 */
export const addCustomPrompt = (aiModel, testType, template) => {
  try {
    if (!PROMPT_TEMPLATES[aiModel]) {
      PROMPT_TEMPLATES[aiModel] = {};
    }
    
    PROMPT_TEMPLATES[aiModel][testType] = template;
    console.log(`已添加自定义提示词: ${aiModel}.${testType}`);
    return true;
  } catch (error) {
    console.error('添加自定义提示词失败:', error);
    return false;
  }
};

/**
 * 获取提示词模板
 * @param {string} aiModel - AI模型名称
 * @param {string} testType - 测试类型
 * @returns {string|null} 提示词模板
 */
export const getPromptTemplate = (aiModel, testType) => {
  const templates = PROMPT_TEMPLATES[aiModel];
  return templates ? templates[testType] : null;
};

/**
 * Gemini视频分析提示词模板
 */
const GEMINI_VIDEO_PROMPTS = {
  // 端到端测试专家视频分析
  e2e_testing_analysis: `你是一个专业的端到端测试专家。请分析这个视频内容，从测试专家的角度识别视频流程中的bug和改善建议。
视频名称：{videoName}

请从以下角度进行分析：

1. **功能测试角度**：
- 识别视频中展示的功能是否正常工作，如不能返回结果、无响应、报错等类似都为bug比较严重,设置为high
- 用户体验流程的完整性或者优化则为medium或者low



2. **界面测试角度**：
- 分析界面元素的布局和设计
- 识别UI/UX问题（如按钮位置、颜色对比、字体大小等）
- 评估界面的响应性和交互性

请严格按照以下JSON格式返回分析结果：

{
  "summary": "视频内容概述",
  "testAnalysis": {
    "functionalIssues": [
      {
        "issue": "问题描述",
        "severity": "high|medium|low",
        "impact": "影响说明",
        "recommendation": "改进建议"
      }
    ],
    "uiIssues": [
      {
        "issue": "UI问题描述",
        "severity": "high|medium|low",
        "impact": "用户体验影响",
        "recommendation": "设计改进建议"
      }
    ]
  }
  
  "testRecommendations": [
    {
      "testType": "功能测试|UI测试",
      "priority": "high|medium|low",
      "description": "具体测试建议",
      "expectedOutcome": "预期测试结果"
    }
  ]
}

注意：
1. 必须返回有效的JSON格式
2. 不要添加任何markdown标记
3. 不要添加任何额外的说明文字
4. 确保JSON格式完全正确
5. 根据视频内容提供具体的问题描述和建议`
};

/**
 * 获取Gemini视频分析提示词
 * @param {string} videoName - 视频名称
 * @param {string} analysisType - 分析类型（默认为e2e_testing_analysis）
 * @returns {string} 格式化后的提示词
 */
export const getGeminiVideoPrompt = (videoName, analysisType = 'e2e_testing_analysis') => {
  const template = GEMINI_VIDEO_PROMPTS[analysisType];
  
  if (!template) {
    throw new Error(`不支持的Gemini分析类型: ${analysisType}`);
  }
  
  // 替换模板中的变量
  return template.replace('{videoName}', videoName);
};

/**
 * 获取所有可用的Gemini分析类型
 * @returns {Array} 分析类型列表
 */
export const getAvailableGeminiAnalysisTypes = () => {
  return [
    {
      key: 'e2e_testing_analysis',
      name: '端到端测试分析',
      description: '从端到端测试专家角度分析视频中的产品问题'
    }
  ];
};