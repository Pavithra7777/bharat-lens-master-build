import { chromium } from 'playwright';

const APP_URL = 'https://preview-7811cf60-888a-42f6-9f93-fdc42df1e566.doable.dev';
const RESULTS = [];

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('=== Testing Apply Button Navigation ===\n');
  
  try {
    // Step 1: Navigate to the Schemes list page
    console.log('Step 1: Navigating to Schemes list page...');
    await page.goto(`${APP_URL}/schemes`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000); // Wait for any JS to render
    
    const pageTitle = await page.title();
    console.log(`Page title: ${pageTitle}`);
    
    // Find all scheme cards
    const schemeCards = await page.locator('[class*="card"], [class*="scheme"], [data-scheme-id], a[href*="/schemes/"]').all();
    console.log(`Found ${schemeCards.length} scheme cards/links\n`);
    
    // If no scheme cards found, try to find any clickable elements
    if (schemeCards.length === 0) {
      // Try to get all links on the page
      const links = await page.locator('a[href]').all();
      console.log(`Found ${links.length} links total on the page`);
      
      for (let i = 0; i < links.length; i++) {
        const href = await links[i].getAttribute('href');
        const text = await links[i].textContent();
        console.log(`Link ${i + 1}: ${href} - "${text?.slice(0, 50)}"`);
      }
    }
    
    // Try to find scheme detail links
    const schemeLinks = await page.locator('a[href*="/schemes/"]').all();
    console.log(`Found ${schemeLinks.length} scheme detail links\n`);
    
    if (schemeLinks.length === 0) {
      // Try different patterns
      const allCards = await page.locator('.cursor-pointer, [role="button"], [onclick]').all();
      console.log(`Found ${allCards.length} clickable elements`);
    }
    
    // Get visible scheme card elements
    let schemeElements = [];
    
    // Try multiple selectors
    const selectors = [
      'a[href*="/schemes/"]',
      '[class*="cursor-pointer"]',
      '[class*="scheme-card"]',
      '[class*="Card"]',
      'article a',
      '.grid > *'
    ];
    
    for (const selector of selectors) {
      const elements = await page.locator(selector).all();
      if (elements.length > 0) {
        console.log(`Selector "${selector}" found ${elements.length} elements`);
        schemeElements = elements;
        break;
      }
    }
    
    // Test up to 5 schemes
    const maxTests = Math.min(schemeElements.length, 5);
    console.log(`\nTesting ${maxTests} schemes...\n`);
    
    // Get all scheme detail links
    const detailLinks = await page.locator('a[href*="/schemes/"]').all();
    const uniqueLinks = [];
    const seenHrefs = new Set();
    
    for (const link of detailLinks) {
      const href = await link.getAttribute('href');
      if (href && !seenHrefs.has(href) && href !== '/schemes') {
        seenHrefs.add(href);
        uniqueLinks.push(href);
      }
    }
    
    console.log(`Found ${uniqueLinks.length} unique scheme detail pages\n`);
    
    // Test each unique scheme
    for (let i = 0; i < Math.min(uniqueLinks.length, 5); i++) {
      const schemePath = uniqueLinks[i];
      console.log(`--- Testing Scheme ${i + 1}: ${schemePath} ---`);
      
      try {
        // Navigate to scheme detail page
        await page.goto(`${APP_URL}${schemePath}`, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);
        
        const schemeTitle = await page.locator('h1, h2, [class*="title"]').first().textContent().catch(() => 'Unknown');
        console.log(`Scheme title: ${schemeTitle?.slice(0, 50)}`);
        
        // Look for the Apply button
        const applyButtonSelectors = [
          'button:has-text("Apply")',
          'a:has-text("Apply")',
          '[class*="apply"]',
          'button[class*="green"]',
          'a[class*="green"]',
          'button:has-text("Official")',
          'a:has-text("Official")'
        ];
        
        let applyButton = null;
        let buttonText = '';
        
        for (const selector of applyButtonSelectors) {
          const buttons = await page.locator(selector).all();
          if (buttons.length > 0) {
            applyButton = buttons[0];
            buttonText = await applyButton.textContent();
            console.log(`Found Apply button with selector "${selector}": "${buttonText?.trim()}"`);
            break;
          }
        }
        
        if (applyButton) {
          // Check if button is disabled
          const isDisabled = await applyButton.getAttribute('disabled') !== null || 
                            await applyButton.getAttribute('aria-disabled') === 'true' ||
                            (await applyButton.getAttribute('class') || '').includes('disabled') ||
                            (await applyButton.getAttribute('class') || '').includes('opacity');
          
          const isHidden = await applyButton.isHidden();
          
          if (isDisabled || isHidden) {
            console.log('Apply button is disabled/hidden - "No Application Link Available" state');
            RESULTS.push({
              schemePath,
              schemeTitle: schemeTitle?.slice(0, 50),
              status: 'DISABLED',
              url: null,
              message: 'Apply button is disabled or hidden'
            });
          } else {
            // Get the button's href (if it's an anchor)
            const buttonHref = await applyButton.getAttribute('href');
            const buttonClass = await applyButton.getAttribute('class');
            
            // Check for "No Application Link Available" text
            const noLinkText = await page.locator('text="No Application Link Available"').count();
            
            if (noLinkText > 0) {
              console.log('Button shows "No Application Link Available" text');
              RESULTS.push({
                schemePath,
                schemeTitle: schemeTitle?.slice(0, 50),
                status: 'NO_LINK_AVAILABLE',
                url: null,
                message: 'No Application Link Available message shown'
              });
            } else if (buttonHref) {
              // If button has href, it's likely a link
              console.log(`Apply button href: ${buttonHref}`);
              
              // Test the link
              const isExternal = buttonHref.startsWith('http');
              const testUrl = isExternal ? buttonHref : `${APP_URL}${buttonHref}`;
              
              RESULTS.push({
                schemePath,
                schemeTitle: schemeTitle?.slice(0, 50),
                status: 'LINK_FOUND',
                url: buttonHref,
                isExternal,
                message: 'Apply link found'
              });
              
              console.log(`URL: ${buttonHref}`);
              
              // Verify if it's an application page vs homepage
              const isHomepage = isHomepageUrl(buttonHref);
              if (isHomepage) {
                console.log('⚠️  WARNING: Link appears to be a homepage, not an application page!');
              }
            } else {
              // Button might open new tab via JavaScript
              console.log('Apply button found but no direct href - testing click behavior');
              
              // Setup listener for new pages
              const [newPage] = await Promise.all([
                context.waitForEvent('page', { timeout: 5000 }).catch(() => null),
                applyButton.click()
              ]);
              
              if (newPage) {
                const newUrl = newPage.url();
                console.log(`New tab opened with URL: ${newUrl}`);
                
                const isHomepage = isHomepageUrl(newUrl);
                RESULTS.push({
                  schemePath,
                  schemeTitle: schemeTitle?.slice(0, 50),
                  status: 'NEW_TAB_OPENED',
                  url: newUrl,
                  isHomepage,
                  message: isHomepage ? 'WARNING: Opens homepage, not application page!' : 'Correctly opens external link'
                });
                
                await newPage.close();
              } else {
                // Check if button has onclick or navigate function
                const onclick = await applyButton.getAttribute('onclick');
                console.log(`Button onclick: ${onclick || 'none'}`);
                
                RESULTS.push({
                  schemePath,
                  schemeTitle: schemeTitle?.slice(0, 50),
                  status: 'NO_NAVIGATION',
                  url: null,
                  message: 'Button click did not navigate or open new tab'
                });
              }
            }
          }
        } else {
          console.log('No Apply button found on this page');
          RESULTS.push({
            schemePath,
            schemeTitle: schemeTitle?.slice(0, 50),
            status: 'NO_BUTTON',
            url: null,
            message: 'No Apply button found'
          });
        }
        
        console.log('');
      } catch (error) {
        console.log(`Error testing scheme ${schemePath}: ${error.message}\n`);
        RESULTS.push({
          schemePath,
          schemeTitle: 'Unknown',
          status: 'ERROR',
          url: null,
          message: error.message
        });
      }
    }
    
  } catch (error) {
    console.error('Test execution error:', error.message);
  } finally {
    await browser.close();
  }
  
  // Print summary
  printSummary();
}

function isHomepageUrl(url) {
  if (!url) return false;
  
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.toLowerCase();
    const hash = parsed.hash.toLowerCase();
    
    // Homepage indicators
    const homepagePatterns = [
      pathname === '/',
      pathname === '' && hash === '',
      pathname === '/home',
      pathname === '/index.html',
      pathname === '/index.htm',
      // GitHub/Gov pages
      pathname === '/pages',
      pathname.startsWith('/gov') && pathname.length <= 10
    ];
    
    return homepagePatterns.some(p => p);
  } catch {
    return false;
  }
}

function printSummary() {
  console.log('\n=== TEST RESULTS SUMMARY ===\n');
  
  let passCount = 0;
  let failCount = 0;
  let disabledCount = 0;
  let errorCount = 0;
  
  for (const result of RESULTS) {
    console.log(`Scheme: ${result.schemePath}`);
    console.log(`Title: ${result.schemeTitle}`);
    console.log(`Status: ${result.status}`);
    console.log(`URL: ${result.url || 'N/A'}`);
    console.log(`Message: ${result.message}`);
    
    if (result.isHomepage) {
      console.log('⚠️  ISSUE: URL is a homepage, not an application page!');
    }
    
    console.log('---');
    
    if (result.status === 'DISABLED' || result.status === 'NO_LINK_AVAILABLE') {
      disabledCount++;
    } else if (result.status === 'ERROR') {
      errorCount++;
    } else if (result.status === 'NO_NAVIGATION' || result.status === 'NO_BUTTON') {
      failCount++;
    } else if (result.isHomepage) {
      failCount++;
    } else {
      passCount++;
    }
  }
  
  console.log('\n=== STATISTICS ===');
  console.log(`Pass: ${passCount}`);
  console.log(`Fail: ${failCount}`);
  console.log(`Disabled/No Link: ${disabledCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Total: ${RESULTS.length}`);
  
  // Final verdict
  console.log('\n=== FINAL VERDICT ===');
  if (failCount === 0) {
    console.log('✅ All Apply buttons are functioning correctly');
  } else {
    console.log(`❌ ${failCount} issues found with Apply buttons`);
  }
  
  // Detailed findings
  console.log('\n=== DETAILED FINDINGS ===');
  for (const result of RESULTS) {
    if (result.isHomepage) {
      console.log(`❌ FAIL: ${result.schemeTitle} - Opens homepage instead of application page: ${result.url}`);
    } else if (result.status === 'NO_NAVIGATION') {
      console.log(`❌ FAIL: ${result.schemeTitle} - Button does nothing`);
    } else if (result.status === 'NEW_TAB_OPENED' && !result.isHomepage) {
      console.log(`✅ PASS: ${result.schemeTitle} - Correctly opens: ${result.url}`);
    } else if (result.status === 'LINK_FOUND') {
      console.log(`✅ PASS: ${result.schemeTitle} - Has valid apply link: ${result.url}`);
    } else if (result.status === 'DISABLED' || result.status === 'NO_LINK_AVAILABLE') {
      console.log(`ℹ️  INFO: ${result.schemeTitle} - No apply link available (correctly disabled)`);
    }
  }
}

runTests();
