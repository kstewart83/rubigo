const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
  });
  
  const networkLogs = [];
  page.on('response', response => {
    const url = response.url();
    if (url.includes('glb') || url.includes('gltf') || url.includes('asset')) {
      networkLogs.push({
        url: url,
        status: response.status()
      });
    }
  });
  
  // Go directly to Sites page
  await page.goto('http://localhost:8081/sites', { waitUntil: 'networkidle' });
  await page.waitForTimeout(8000);  // Wait for assets to load
  
  console.log('=== NETWORK (GLB/GLTF) ===');
  networkLogs.forEach(log => console.log(JSON.stringify(log)));
  
  console.log('=== CONSOLE (filtered) ===');
  consoleLogs.forEach(log => {
    const t = log.text.toLowerCase();
    if (t.includes('glb') || t.includes('gltf') || t.includes('load') || 
        t.includes('error') || t.includes('fail') || t.includes('asset') ||
        t.includes('geo/')) {
      console.log(`[${log.type}] ${log.text.substring(0,200)}`);
    }
  });
  
  await browser.close();
})();
