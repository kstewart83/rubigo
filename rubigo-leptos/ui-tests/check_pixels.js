const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:8081');
  await page.waitForTimeout(3000);
  
  // Click Sites tab
  await page.click('text=Sites');
  await page.waitForTimeout(5000);
  
  // Check canvas pixels
  const result = await page.evaluate(() => {
    const canvas = document.getElementById('viewer-canvas');
    if (!canvas) return { error: 'Canvas not found' };
    
    const ctx = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!ctx) return { error: 'No WebGL context' };
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Read pixels
    const pixels = new Uint8Array(width * height * 4);
    ctx.readPixels(0, 0, width, height, ctx.RGBA, ctx.UNSIGNED_BYTE, pixels);
    
    // Sample some pixels
    const samples = [];
    const positions = [
      { x: Math.floor(width/2), y: Math.floor(height/2), name: 'center' },
      { x: 10, y: 10, name: 'top-left' },
      { x: width-10, y: height-10, name: 'bottom-right' },
    ];
    
    let magentaCount = 0;
    let nonMagentaCount = 0;
    
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i], g = pixels[i+1], b = pixels[i+2];
      if (r > 200 && g < 50 && b > 200) {
        magentaCount++;
      } else {
        nonMagentaCount++;
      }
    }
    
    for (const pos of positions) {
      const idx = (pos.y * width + pos.x) * 4;
      samples.push({
        name: pos.name,
        r: pixels[idx], g: pixels[idx+1], b: pixels[idx+2], a: pixels[idx+3]
      });
    }
    
    return {
      canvasSize: { width, height },
      samples,
      magentaPixels: magentaCount,
      nonMagentaPixels: nonMagentaCount,
      totalPixels: width * height
    };
  });
  
  console.log(JSON.stringify(result, null, 2));
  
  await browser.close();
})();
