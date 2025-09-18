import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 确保截图目录存在
const screenshotsDir = path.join(__dirname, '../../public/screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

/**
 * 执行网页截图（支持登录）
 * @param {string} url - 要截图的网页URL
 * @param {string} testCaseId - 测试用例ID
 * @param {Object} options - 选项，包含登录信息、目标URL和执行模式
 * @returns {Promise<{success: boolean, screenshotPath?: string, error?: string}>}
 */
export const captureWebsiteScreenshot = async (url, testCaseId, options = {}) => {
  let browser = null;
  
  try {
    console.log(`开始为测试用例 ${testCaseId} 截图，URL: ${url}`);
    
    // 确定执行模式
    const executionMode = options.executionMode || 'headless';
    const isHeadless = executionMode === 'headless';
    const isDebug = executionMode === 'debug';
    
    console.log(`执行模式: ${executionMode} (headless: ${isHeadless})`);
    
    // 启动浏览器
    console.log('正在启动浏览器...');
    const launchOptions = {
      headless: isHeadless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    };
    
    // 调试模式特殊配置
    if (isDebug) {
      launchOptions.devtools = true;
      launchOptions.slowMo = 1000; // 慢速执行，便于观察
    }
    
    browser = await chromium.launch(launchOptions);
    console.log('浏览器启动成功');
    
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });
    
    const page = await context.newPage();
    
    // 设置超时时间
    page.setDefaultTimeout(30000);
    
    // 访问网页
    console.log(`正在访问网页: ${url}`);
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    console.log('网页访问成功，等待页面加载...');
    
    // 如果需要登录，执行登录流程
    if (options.needLogin) {
      console.log('检测到需要登录，开始执行登录流程...');
      await performLogin(page, options.loginCredentials);
      
      // 登录成功后，导航到真正的测试入口URL
      if (options.targetUrl && options.targetUrl !== url) {
        console.log(`登录成功，导航到目标URL: ${options.targetUrl}`);
        await page.goto(options.targetUrl, { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });
        console.log('导航到目标URL成功');
      }
    }
    
    // 等待页面完全加载
    await page.waitForTimeout(2000);
    console.log('页面加载完成，开始截图...');
    
    // 生成截图文件名
    const timestamp = Date.now();
    const screenshotFileName = `${testCaseId}_${timestamp}.png`;
    const screenshotPath = path.join(screenshotsDir, screenshotFileName);
    
    // 进行全页面截图
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
      type: 'png'
    });
    console.log(`截图完成，保存路径: ${screenshotPath}`);
    
    // 返回相对路径用于前端访问
    const relativePath = `/screenshots/${screenshotFileName}`;
    
    console.log(`测试用例 ${testCaseId} 截图成功完成`);
    return {
      success: true,
      screenshotPath: relativePath,
      screenshotFileName
    };
    
  } catch (error) {
    console.error(`测试用例 ${testCaseId} 截图失败:`, error.message);
    return {
      success: false,
      error: error.message
    };
  } finally {
    if (browser) {
      console.log('正在关闭浏览器...');
      await browser.close();
      console.log('浏览器已关闭');
    }
  }
};

/**
 * 执行登录流程
 * @param {Page} page - Playwright页面对象
 * @param {Object} credentials - 登录凭据
 */
const performLogin = async (page, credentials = {}) => {
  try {
    const { email = 'test@foryou56.com', password = '123456' } = credentials;
    
    console.log('开始执行登录流程...');
    
    // 等待登录表单加载
    await page.waitForTimeout(1000);
    
    // 查找并填写邮箱输入框
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[placeholder*="邮箱"]',
      'input[placeholder*="email"]',
      'input[placeholder*="Email"]'
    ];
    
    let emailInput = null;
    for (const selector of emailSelectors) {
      try {
        emailInput = await page.waitForSelector(selector, { timeout: 5000 });
        if (emailInput) break;
      } catch (e) {
        continue;
      }
    }
    
    if (emailInput) {
      await emailInput.fill(email);
      console.log('邮箱填写完成');
    } else {
      console.log('未找到邮箱输入框，跳过登录');
      return;
    }
    
    // 查找并填写密码输入框
    const passwordSelectors = [
      'input[type="password"]',
      'input[name="password"]',
      'input[placeholder*="密码"]',
      'input[placeholder*="password"]',
      'input[placeholder*="Password"]'
    ];
    
    let passwordInput = null;
    for (const selector of passwordSelectors) {
      try {
        passwordInput = await page.waitForSelector(selector, { timeout: 5000 });
        if (passwordInput) break;
      } catch (e) {
        continue;
      }
    }
    
    if (passwordInput) {
      await passwordInput.fill(password);
      console.log('密码填写完成');
    } else {
      console.log('未找到密码输入框，跳过登录');
      return;
    }
    
    // 查找并点击登录按钮
    const loginButtonSelectors = [
      'button[type="submit"]',
      'button:has-text("登录")',
      'button:has-text("Login")',
      'button:has-text("Sign in")',
      'input[type="submit"]',
      '.login-btn',
      '.btn-login'
    ];
    
    let loginButton = null;
    for (const selector of loginButtonSelectors) {
      try {
        loginButton = await page.waitForSelector(selector, { timeout: 5000 });
        if (loginButton) break;
      } catch (e) {
        continue;
      }
    }
    
    if (loginButton) {
      await loginButton.click();
      console.log('登录按钮点击完成');
      
      // 等待登录完成
      await page.waitForTimeout(3000);
      console.log('登录流程完成');
    } else {
      console.log('未找到登录按钮，跳过登录');
    }
    
  } catch (error) {
    console.error('登录流程执行失败:', error.message);
    // 登录失败不影响截图，继续执行
  }
};

/**
 * 执行测试步骤并截图
 * @param {string} url - 测试URL
 * @param {string} testCaseId - 测试用例ID
 * @param {Array} steps - 测试步骤
 * @returns {Promise<{success: boolean, screenshots?: Array, error?: string}>}
 */
export const executeTestSteps = async (url, testCaseId, steps = [], options = {}) => {
  let browser = null;
  
  try {
    // 确定执行模式
    const executionMode = options.executionMode || 'headless';
    const isHeadless = executionMode === 'headless';
    const isDebug = executionMode === 'debug';
    
    const launchOptions = {
      headless: isHeadless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    };
    
    // 调试模式特殊配置
    if (isDebug) {
      launchOptions.devtools = true;
      launchOptions.slowMo = 1000;
    }
    
    browser = await chromium.launch(launchOptions);
    
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    
    // 访问初始页面
    await page.goto(url, { waitUntil: 'networkidle' });
    
    const screenshots = [];
    const timestamp = Date.now();
    
    // 初始截图
    const initialScreenshotFileName = `${testCaseId}_${timestamp}_initial.png`;
    const initialScreenshotPath = path.join(screenshotsDir, initialScreenshotFileName);
    await page.screenshot({ path: initialScreenshotPath, fullPage: true });
    
    screenshots.push({
      step: 0,
      description: '初始页面',
      screenshotPath: `/screenshots/${initialScreenshotFileName}`,
      timestamp: Date.now()
    });
    
    // 执行测试步骤（如果有的话）
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      try {
        // 根据步骤类型执行操作
        switch (step.action) {
          case 'click':
            if (step.selector) {
              await page.click(step.selector);
            }
            break;
          case 'fill':
            if (step.selector && step.value) {
              await page.fill(step.selector, step.value);
            }
            break;
          case 'goto':
            await page.goto(step.value, { waitUntil: 'networkidle' });
            break;
          default:
            console.log(`未知的操作类型: ${step.action}`);
        }
        
        // 等待操作完成
        await page.waitForTimeout(1000);
        
        // 截图
        const stepScreenshotFileName = `${testCaseId}_${timestamp}_step${i + 1}.png`;
        const stepScreenshotPath = path.join(screenshotsDir, stepScreenshotFileName);
        await page.screenshot({ path: stepScreenshotPath, fullPage: true });
        
        screenshots.push({
          step: i + 1,
          description: step.description || `步骤 ${i + 1}`,
          screenshotPath: `/screenshots/${stepScreenshotFileName}`,
          timestamp: Date.now()
        });
        
      } catch (stepError) {
        console.error(`执行步骤 ${i + 1} 失败:`, stepError);
        // 继续执行下一步
      }
    }
    
    return {
      success: true,
      screenshots
    };
    
  } catch (error) {
    console.error('执行测试步骤失败:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};