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

注意：必须返回有效的JSON格式，不要添加任何额外文本。`,

  // 自然语言理解分析提示词
  nlu_analysis: `你是一个专业的测试用例分析专家。请分析以下测试用例的自然语言描述，提取关键信息并理解测试意图。

测试描述：{testDescription}

请按照以下要求进行分析：
1. 理解测试用例的主要目标和预期结果
2. 识别需要执行的主要操作步骤
3. 分析测试类型和复杂度
4. 评估测试的优先级和重要性
5. 识别可能的风险点和注意事项

请严格按照以下JSON格式返回结果：

{
  "testObjective": "测试的主要目标",
  "mainActions": [
    {
      "action": "操作类型（如click、fill、navigate等）",
      "target": "操作目标",
      "expectedResult": "预期结果"
    }
  ],
  "testType": "测试类型（functional、ui、navigation、form、api、performance）",
  "complexity": "复杂度（low、medium、high）",
  "estimatedDuration": 30,
  "priority": "优先级（high、medium、low）",
  "riskPoints": ["潜在风险点1", "潜在风险点2"],
  "prerequisites": ["前置条件1", "前置条件2"]
}

注意：
1. 必须返回有效的JSON格式
2. 不要添加任何markdown标记
3. 不要添加任何额外的说明文字
4. 确保JSON格式完全正确`,

  // 代码生成提示词
  code_generation: `你是一个专业的Playwright测试代码生成专家。请根据测试用例描述生成完整的Playwright测试代码。

测试描述：{testDescription}

请按照以下要求生成代码：
1. 生成完整的Playwright测试脚本
2. 包含适当的错误处理和重试机制
3. 添加详细的注释说明
4. 使用稳定的元素选择器
5. 包含页面加载等待和元素等待
6. 添加适当的断言验证
7. 考虑测试的健壮性和可维护性

请严格按照以下JSON格式返回结果：

{
  "analysis": "代码生成分析",
  "playwrightScripts": [
    {
      "step": 1,
      "description": "步骤描述",
      "action": "playwright方法名",
      "selector": "元素选择器",
      "value": "输入值",
      "explanation": "操作说明"
    }
  ],
  "fullCode": "完整的Playwright测试代码",
  "testFunction": "测试函数代码",
  "setupCode": "设置代码",
  "teardownCode": "清理代码",
  "dependencies": ["依赖项列表"],
  "codeQuality": {
    "score": 85,
    "suggestions": ["优化建议1", "优化建议2"]
  }
}

注意：
1. 必须返回有效的JSON格式
2. 生成的代码必须是可执行的Playwright代码
3. 包含完整的错误处理机制
4. 代码应该具有良好的可读性和可维护性
5. 确保JSON格式完全正确`
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
  e2e_testing_analysis: `你是一个专业的端到端测试专家。请分析这个视频内容，结合测试用例信息和测试说明，从测试专家的角度识别视频操作中的bug。

视频名称：{videoName}
测试说明：{testDescription}

请根据测试用例信息和测试说明的要求，从以下角度进行分析：

1. **功能测试角度**：
- 根据测试用例描述和测试说明中的功能要求，识别视频中展示的功能是否正常工作
- 重点关注测试用例中提到的具体功能点和预期行为
- 关注视频内用户操作和测试要求不一致及识别功能缺陷（如不能返回结果、无响应、报错等），严重问题设置为high，其他忽略不用返回


2. **界面测试角度**：
- 分析界面元素的布局和设计
- 识别UI/UX问题（如按钮位置、颜色对比、字体大小等）
- 根据测试用例描述和测试说明中的界面不一致时，设置为high，其他忽略不用返回


请严格按照以下JSON格式返回分析结果：

{
  "summary": "视频内容概述",
  "testAnalysis": {
    "functionalIssues": [
      {
        "issue": "问题描述",
        "severity": "high|medium|low",
        "impact": "影响说明",
        "recommendation": "改进建议",
        "relatedToTestDescription": "是否与测试说明相关"
      }
    ],
    "uiIssues": [
      {
        "issue": "UI问题描述",
        "severity": "high|medium|low",
        "impact": "用户体验影响",
        "recommendation": "设计改进建议",
        "relatedToTestDescription": "是否与测试说明相关"
      }
    ]
  },
  "testCaseCompliance": {
    "coveredPoints": ["已覆盖的测试点"],
    "missingPoints": ["未覆盖的测试点"],
    "complianceScore": "符合度评分(0-100)",
    "suggestions": ["改进建议"],
    "testCaseAlignment": "与测试用例的符合度评估"
  }
}

注意：
1. 必须返回有效的JSON格式
2. 不要添加任何markdown标记
3. 不要添加任何额外的说明文字
4. 返回数据中，去除掉影响范围为：用户体验不佳、需要进步验证的部分
5. 剔除high级别的问题不要重复返回`
};

/**
 * 获取Gemini视频分析提示词
 * @param {string} videoName - 视频名称
 * @param {string} testDescription - 测试说明
 * @param {string} analysisType - 分析类型（默认为e2e_testing_analysis）
 * @returns {string} 格式化后的提示词
 */
export const getGeminiVideoPrompt = (videoName, testDescription = '', analysisType = 'e2e_testing_analysis') => {
  const template = GEMINI_VIDEO_PROMPTS[analysisType];
  
  if (!template) {
    throw new Error(`不支持的Gemini分析类型: ${analysisType}`);
  }
  
  // 替换模板中的变量
  return template
    .replace('{videoName}', videoName)
    .replace('{testDescription}', testDescription || '无具体测试说明');
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