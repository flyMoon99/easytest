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
 * 执行网页截图
 * @param {string} url - 要截图的网页URL
 * @param {string} testCaseId - 测试用例ID
 * @returns {Promise<{success: boolean, screenshotPath?: string, error?: string}>}
 */
export const captureWebsiteScreenshot = async (url, testCaseId) => {
  let browser = null;
  
  try {
    console.log(`开始为测试用例 ${testCaseId} 截图，URL: ${url}`);
    
    // 启动浏览器
    console.log('正在启动浏览器...');
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
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
 * 执行测试步骤并截图
 * @param {string} url - 测试URL
 * @param {string} testCaseId - 测试用例ID
 * @param {Array} steps - 测试步骤
 * @returns {Promise<{success: boolean, screenshots?: Array, error?: string}>}
 */
export const executeTestSteps = async (url, testCaseId, steps = []) => {
  let browser = null;
  
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
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