const { chromium } = require('playwright');

/**
 * Scrape a product page
 * The site is designed to be difficult: prices change frequently,
 * some content loads asynchronously after a short delay, 
 * and responses are occasionally slow or return errors.
 */
async function scrapeProduct(url, { headless = true } = {}) {
  const maxRetries = 3;
  let attempt = 0;
  let status = 'failed';
  
  while (attempt < maxRetries) {
    attempt++;
    const browser = await chromium.launch({ headless, slowMo: headless ? 0 : 500 });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();
    
    try {
      // 1. Navigate to the URL
      // Use domcontentloaded or load, and add timeout
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // 2. Wait for the product content to appear.
      // Since it's a SPA and content loads async, we must wait for a selector.
      // The assignment says "content loads asynchronously after a short delay".
      // We will look for elements that typically represent price.
      // Update these selectors based on actual site structure!
      // Here we assume standard class names like '.price', '.product-price', etc.
      
      // Wait for price selector or the "REVEAL PRICE" overlay to be attached to DOM
      await page.waitForTimeout(2000); // Wait for initial render

      // Check if there is a "REVEAL PRICE" element
      const revealLocator = page.locator('text=REVEAL PRICE');
      if (await revealLocator.count() > 0) {
        // Hover to trigger the fetch
        await revealLocator.first().hover();
        // Wait for the mock delay
        await page.waitForTimeout(3000);
      }

      const priceSelector = '[class*="price"], [id*="price"], h2:has-text("$"), span:has-text("$"), div:has-text("$")'; 
      const stockSelector = '[class*="stock"], [id*="stock"], div:has-text("In Stock"), div:has-text("Out of Stock"), span:has-text("In Stock"), span:has-text("Out of Stock")';
      
      let priceText = '';
      try {
        const priceEls = await page.locator(priceSelector).allInnerTexts();
        const moneyText = priceEls.find(t => t.includes('$'));
        if (moneyText) priceText = moneyText;
        else priceText = await page.locator(priceSelector).first().innerText();
      } catch(e) {
        // If selectors fail, just scan the whole body for $
        const bodyText = await page.innerText('body');
        const match = bodyText.match(/\$([0-9]+\.[0-9]{2})/);
        if (match) priceText = match[0];
      }

      // Clean up price (e.g., "$19.99" -> 19.99)
      const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
      
      let stock = 'Unknown';
      try {
        const stockText = await page.innerText('body');
        if (stockText.includes('Out of Stock')) stock = 'Out of Stock';
        else if (stockText.includes('In Stock')) stock = 'In Stock';
      } catch (e) {
        // Stock element might not be found or visible, that's okay
      }
      
      await browser.close();
      
      // Validation
      if (isNaN(price)) {
        throw new Error('Extracted price is not a valid number. Extracted text: ' + priceText);
      }
      
      return {
        status: attempt > 1 ? 'retried' : 'success',
        price,
        stock: stock.trim()
      };
      
    } catch (error) {
      console.error(`Attempt ${attempt} failed for ${url}:`, error.message);
      await browser.close();
      
      if (attempt >= maxRetries) {
        return {
          status: 'failed',
          error: error.message
        };
      }
      // Wait before retrying (exponential backoff)
      await new Promise(res => setTimeout(res, 2000 * attempt));
    }
  }
}

module.exports = { scrapeProduct };
