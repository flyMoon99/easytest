import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { OpenAI } from 'openai';

// OpenAI客户端配置
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// MCP服务器配置
const MCP_SERVER_URL = 'http://localhost:8931/mcp';

/**
 * MCP Playwright服务类
 */
class MCPPlaywrightService {
  constructor() {
    this.client = null;
    this.tools = [];
    this.isConnected = false;
  }

  /**
   * 连接到MCP服务器
   */
  async connect() {
    try {
      console.log('正在连接到Playwright MCP服务器...');
      
      this.client = new Client({
        name: 'easytest-playwright-client',
        version: '1.0.0'
      });

      const transport = new StreamableHTTPClientTransport(new URL(MCP_SERVER_URL));
      await this.client.connect(transport);
      
      console.log('MCP服务器连接成功');
      this.isConnected = true;

      // 获取可用工具
      await this.loadTools();
      
      return true;
    } catch (error) {
      console.error('连接MCP服务器失败:', error);
      this.isConnected = false;
      throw new Error(`MCP连接失败: ${error.message}`);
    }
  }

  /**
   * 加载可用的MCP工具
   */
  async loadTools() {
    try {
      console.log('正在获取MCP工具列表...');
      
      const toolsResponse = await this.client.listTools();
      this.tools = Array.isArray(toolsResponse) ? toolsResponse : (toolsResponse.tools || []);
      
      console.log(`成功加载 ${this.tools.length} 个MCP工具`);
      
      // 记录可用工具
      this.tools.forEach(tool => {
        console.log(`- ${tool.name}: ${tool.description || '无描述'}`);
      });
      
      return this.tools;
    } catch (error) {
      console.error('获取MCP工具失败:', error);
      throw new Error(`获取工具失败: ${error.message}`);
    }
  }

  /**
   * 断开MCP连接
   */
  async disconnect() {
    try {
      if (this.client && this.isConnected) {
        await this.client.close();
        console.log('MCP连接已断开');
      }
      this.isConnected = false;
      this.client = null;
      this.tools = [];
    } catch (error) {
      console.error('断开MCP连接失败:', error);
    }
  }

  /**
   * 检查连接状态
   */
  checkConnection() {
    if (!this.isConnected || !this.client) {
      throw new Error('MCP服务器未连接，请先调用connect()方法');
    }
  }

  /**
   * 执行测试用例
   * @param {Object} testCase - 测试用例对象
   * @param {Object} options - 执行选项
   * @param {Function} logCallback - 日志回调函数
   * @returns {Promise<Object>} 执行结果
   */
  async executeTestCase(testCase, options = {}, logCallback = null) {
    const log = (message) => {
      console.log(`[MCP执行] ${message}`);
      if (logCallback) {
        logCallback(`LOG: ${message}\n`);
      }
    };

    let client = null;
    
    try {
      log('开始执行测试用例...');
      
      // 建立连接
      client = new Client({
        name: 'easytest-playwright-client',
        version: '1.0.0'
      });
      
      const transport = new StreamableHTTPClientTransport(new URL(MCP_SERVER_URL));
      await client.connect(transport);
      log('MCP服务器连接成功');

      // 获取工具
      const toolsResponse = await client.listTools();
      const tools = Array.isArray(toolsResponse) ? toolsResponse : (toolsResponse.tools || []);
      log(`获取到 ${tools.length} 个可用工具`);

      // 构建测试提示词
      const prompt = this.buildTestPrompt(testCase);
      log('开始AI分析测试需求...');

      // 准备OpenAI消息
      let messages = [
        { 
          role: 'system', 
          content: `你是一个专业的Web自动化测试助手，使用Playwright MCP工具来执行测试。

测试执行规则：
1. 根据测试用例的描述和入口URL，理解测试目标
2. 使用提供的MCP工具来操作浏览器
3. 按照逻辑顺序执行操作：导航 -> 交互 -> 验证
4. 每个操作后等待页面稳定
5. 记录执行过程和结果
6. 最后总结测试是否成功

可用的主要工具：
- browser_navigate: 导航到指定URL
- browser_click: 点击页面元素
- browser_type: 在输入框中输入文本
- browser_snapshot: 获取页面快照
- browser_wait_for: 等待元素或时间
- browser_take_screenshot: 截取页面截图

请根据测试需求，合理使用这些工具完成测试。`
        },
        { role: 'user', content: prompt }
      ];

      // 开始AI指导的测试执行
      let executionSteps = [];
      let currentStep = 1;

      while (true) {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages,
          tools: tools.map(tool => ({
            type: 'function',
            function: {
              name: tool.name,
              description: tool.description || '',
              parameters: tool.inputSchema || { type: 'object', properties: {}, required: [] }
            }
          })),
          tool_choice: 'auto',
        });

        const message = completion.choices[0].message;
        messages.push(message);

        if (message.content) {
          log(`AI分析: ${message.content}`);
        }

        // 如果没有工具调用，说明测试完成
        if (!message.tool_calls) {
          log('测试执行完成');
          break;
        }

        // 执行工具调用
        for (const toolCall of message.tool_calls) {
          const functionName = toolCall.function.name;
          const args = JSON.parse(toolCall.function.arguments);

          log(`步骤 ${currentStep}: 执行 ${functionName}`);
          log(`参数: ${JSON.stringify(args)}`);

          try {
            const toolResponse = await client.callTool({
              name: functionName,
              arguments: args
            });

            log(`步骤 ${currentStep} 执行成功`);
            
            // 记录执行步骤
            executionSteps.push({
              step: currentStep,
              action: functionName,
              arguments: args,
              result: toolResponse,
              timestamp: new Date().toISOString()
            });

            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: functionName,
              content: JSON.stringify(toolResponse)
            });

            currentStep++;

          } catch (toolError) {
            log(`步骤 ${currentStep} 执行失败: ${toolError.message}`);
            
            executionSteps.push({
              step: currentStep,
              action: functionName,
              arguments: args,
              error: toolError.message,
              timestamp: new Date().toISOString()
            });

            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: functionName,
              content: JSON.stringify({ error: toolError.message })
            });

            currentStep++;
          }
        }
      }

      // 获取最终页面快照
      try {
        log('获取最终页面快照...');
        const finalSnapshot = await client.callTool({
          name: 'browser_snapshot',
          arguments: {}
        });
        
        executionSteps.push({
          step: currentStep,
          action: 'browser_snapshot',
          arguments: {},
          result: finalSnapshot,
          timestamp: new Date().toISOString()
        });
      } catch (snapshotError) {
        log(`获取最终快照失败: ${snapshotError.message}`);
      }

      log('测试执行完成');

      return {
        success: true,
        executionSteps,
        totalSteps: currentStep - 1,
        completedAt: new Date().toISOString(),
        summary: this.generateExecutionSummary(executionSteps)
      };

    } catch (error) {
      log(`测试执行失败: ${error.message}`);
      
      return {
        success: false,
        error: error.message,
        executionSteps: [],
        completedAt: new Date().toISOString()
      };
    } finally {
      if (client) {
        try {
          await client.close();
          log('MCP连接已关闭');
        } catch (closeError) {
          console.error('关闭MCP连接失败:', closeError);
        }
      }
    }
  }

  /**
   * 构建测试提示词
   * @param {Object} testCase - 测试用例
   * @returns {string} 提示词
   */
  buildTestPrompt(testCase) {
    return `
请执行以下Web自动化测试：

测试用例信息：
- 标题: ${testCase.title}
- 入口URL: ${testCase.entryUrl}
- 测试描述: ${testCase.description}
- 用例等级: ${testCase.level || '中'}

测试要求：
1. 访问入口URL: ${testCase.entryUrl}
2. 根据测试描述执行相应的操作: ${testCase.description}
3. 验证页面行为是否符合预期
4. 记录执行过程和结果

请使用可用的MCP工具来完成这个测试，并在最后总结测试结果。
    `.trim();
  }

  /**
   * 生成执行摘要
   * @param {Array} executionSteps - 执行步骤
   * @returns {Object} 执行摘要
   */
  generateExecutionSummary(executionSteps) {
    const totalSteps = executionSteps.length;
    const successfulSteps = executionSteps.filter(step => !step.error).length;
    const failedSteps = totalSteps - successfulSteps;

    return {
      totalSteps,
      successfulSteps,
      failedSteps,
      successRate: totalSteps > 0 ? Math.round((successfulSteps / totalSteps) * 100) : 0,
      actions: executionSteps.map(step => ({
        step: step.step,
        action: step.action,
        success: !step.error,
        timestamp: step.timestamp
      }))
    };
  }

  /**
   * 调用MCP工具
   * @param {string} toolName - 工具名称
   * @param {Object} args - 工具参数
   * @returns {Promise<Object>} 工具执行结果
   */
  async callTool(toolName, args = {}) {
    this.checkConnection();
    
    try {
      console.log(`调用MCP工具: ${toolName}`, args);
      
      const result = await this.client.callTool({
        name: toolName,
        arguments: args
      });
      
      console.log(`工具 ${toolName} 执行成功`);
      return result;
    } catch (error) {
      console.error(`工具 ${toolName} 执行失败:`, error);
      throw new Error(`工具执行失败: ${error.message}`);
    }
  }

  /**
   * 获取可用工具列表
   * @returns {Array} 工具列表
   */
  getAvailableTools() {
    return this.tools;
  }

  /**
   * 检查MCP服务器健康状态
   * @returns {Promise<boolean>} 健康状态
   */
  async healthCheck() {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      
      // 尝试获取工具列表来验证连接
      await this.client.listTools();
      return true;
    } catch (error) {
      console.error('MCP健康检查失败:', error);
      return false;
    }
  }
}

// 创建单例实例
const mcpPlaywrightService = new MCPPlaywrightService();

export default mcpPlaywrightService;

// 导出主要方法
export const {
  connect,
  disconnect,
  executeTestCase,
  callTool,
  getAvailableTools,
  healthCheck
} = mcpPlaywrightService;

