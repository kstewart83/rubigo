const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Capture console messages
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text()
    });
  });
  
  // Capture network requests
  const networkLogs = [];
  page.on('response', response => {
    const url = response.url();
    if (url.includes('glb') || url.includes('gltf')) {
      networkLogs.push({
        url: url,
        status: response.status(),
        type: response.headers()['content-type']
      });
    }
  });
  
  await page.goto('http://localhost:8081', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Click Sites tab
  await page.click('a[href="/sites"]');
  await page.waitForTimeout(5000);
  
  console.log('=== NETWORK REQUESTS FOR GLB ===');
  networkLogs.forEach(log => console.log(JSON.stringify(log)));
  
  console.log('\n=== CONSOLE MESSAGES ===');
  consoleLogs.forEach(log => {
    if (log.text.toLowerCase().includes('glb') || 
        log.text.toLowerCase().includes('gltf') ||
        log.text.toLowerCase().includes('load') ||
        log.text.toLowerCase().includes('error') ||
        log.text.toLowerCase().includes('asset')) {
      console.log(`[${log.type}] ${log.text}`);
    }
  });
  
  await browser.close();
})();
