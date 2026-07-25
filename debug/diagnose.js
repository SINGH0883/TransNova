/**
 * TransNova Diagnostic Script
 * Paste this into WhatsApp Web's DevTools Console (F12 → Console)
 * to diagnose why the extension isn't working.
 */

(async function diagnoseTransNova() {
  const results = [];
  const log = (label, status, detail) => {
    const icon = status === 'OK' ? '✅' : status === 'WARN' ? '⚠️' : '❌';
    results.push(`${icon} ${label}: ${detail}`);
    console.log(`${icon} ${label}: ${detail}`);
  };

  console.log('═══════════════════════════════════════');
  console.log('  TransNova Diagnostic Report');
  console.log('═══════════════════════════════════════');

  // 1. Check if we're on WhatsApp Web
  log('URL', window.location.hostname === 'web.whatsapp.com' ? 'OK' : 'FAIL',
    window.location.href);

  // 2. Check if TransNova globals exist (content script loaded?)
  log('TransNovaTranslator loaded',
    typeof window.TransNovaTranslator !== 'undefined' ? 'OK' : 'FAIL',
    typeof window.TransNovaTranslator);
  
  log('TransNovaPlatforms loaded',
    typeof window.TransNovaPlatforms !== 'undefined' ? 'OK' : 'FAIL',
    typeof window.TransNovaPlatforms);

  // 3. Check DOM selectors
  console.log('\n── DOM Selector Tests ──');
  
  const selectorTests = {
    '#main': document.querySelector('#main'),
    'div[role="application"]': document.querySelector('div[role="application"]'),
    'div.message-in': document.querySelector('div.message-in'),
    'div.message-out': document.querySelector('div.message-out'),
    'span.selectable-text': document.querySelector('span.selectable-text'),
    'span.selectable-text span': document.querySelector('span.selectable-text span'),
    'div.copyable-text': document.querySelector('div.copyable-text'),
    'div[data-testid="conversation-compose-box-input"]': document.querySelector('div[data-testid="conversation-compose-box-input"]'),
    'div[contenteditable="true"][data-tab="10"]': document.querySelector('div[contenteditable="true"][data-tab="10"]'),
    'footer div[contenteditable="true"]': document.querySelector('footer div[contenteditable="true"]'),
    'span[data-testid="send"]': document.querySelector('span[data-testid="send"]'),
    'div[role="row"]': document.querySelector('div[role="row"]'),
    'div.copyable-area': document.querySelector('div.copyable-area'),
  };

  for (const [selector, element] of Object.entries(selectorTests)) {
    log(selector, element ? 'OK' : 'FAIL',
      element ? `Found (tag: ${element.tagName}, class: "${element.className?.substring?.(0,50) || ''}")` : 'NOT FOUND');
  }

  // 4. Find all contenteditable elements (to find the right input)
  console.log('\n── All ContentEditable Elements ──');
  const editables = document.querySelectorAll('[contenteditable="true"]');
  editables.forEach((el, i) => {
    console.log(`  [${i}] tag=${el.tagName} tab=${el.getAttribute('data-tab')} testid=${el.getAttribute('data-testid')} parent=${el.parentElement?.className?.substring(0,60)} text="${el.textContent?.substring(0,30)}"`);
  });
  log('ContentEditable count', editables.length > 0 ? 'OK' : 'FAIL', `${editables.length} found`);

  // 5. Find all data-testid elements related to messaging
  console.log('\n── Relevant data-testid Elements ──');
  const testIds = ['send', 'compose', 'conversation', 'msg', 'input', 'chat'];
  for (const keyword of testIds) {
    const matches = document.querySelectorAll(`[data-testid*="${keyword}"]`);
    if (matches.length > 0) {
      matches.forEach(el => {
        console.log(`  data-testid="${el.getAttribute('data-testid')}" tag=${el.tagName} class="${el.className?.substring?.(0,50) || ''}"`);
      });
    }
  }

  // 6. Examine message structure
  console.log('\n── Message Structure Analysis ──');
  const firstIncoming = document.querySelector('div.message-in');
  if (firstIncoming) {
    console.log('Incoming message HTML (first 500 chars):');
    console.log(firstIncoming.innerHTML.substring(0, 500));
    
    // Find text within it
    const allSpans = firstIncoming.querySelectorAll('span');
    console.log(`Contains ${allSpans.length} span elements:`);
    allSpans.forEach((span, i) => {
      if (span.textContent.trim()) {
        console.log(`  span[${i}] class="${span.className?.substring(0,50)}" text="${span.textContent.substring(0,50)}"`);
      }
    });
  } else {
    log('First incoming message', 'FAIL', 'No div.message-in found. Checking alternative selectors...');
    
    // Try finding messages by role
    const rows = document.querySelectorAll('div[role="row"]');
    log('div[role="row"] count', rows.length > 0 ? 'OK' : 'FAIL', `${rows.length} rows found`);
    
    if (rows.length > 0) {
      console.log('First row HTML (first 300 chars):');
      console.log(rows[0].innerHTML.substring(0, 300));
    }
  }

  // 7. Check if footer / input area exists
  console.log('\n── Footer / Input Area ──');
  const footer = document.querySelector('footer');
  if (footer) {
    console.log('Footer HTML (first 500 chars):');
    console.log(footer.innerHTML.substring(0, 500));
  } else {
    log('Footer element', 'FAIL', 'No <footer> found');
  }

  // 8. Test Chrome extension API
  console.log('\n── Chrome Extension API ──');
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      log('chrome.runtime.sendMessage', 'OK', 'Available');
      
      // Try sending a test message
      chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
        if (chrome.runtime.lastError) {
          console.log('❌ Service worker error:', chrome.runtime.lastError.message);
        } else {
          console.log('✅ Service worker responded:', JSON.stringify(response));
        }
      });
    } else {
      log('chrome.runtime', 'FAIL', 'Not available - extension may not be loaded');
    }
  } catch (e) {
    log('chrome.runtime', 'FAIL', e.message);
  }

  // 9. Test API directly
  console.log('\n── API Test ──');
  try {
    const testResponse = await fetch('https://api.mymemory.translated.net/get?q=hello&langpair=en|hi');
    const testData = await testResponse.json();
    log('MyMemory API', testData.responseStatus === 200 ? 'OK' : 'FAIL',
      `Status: ${testData.responseStatus}, Translation: "${testData.responseData?.translatedText}"`);
  } catch (e) {
    log('MyMemory API', 'FAIL', e.message);
  }

  console.log('\n═══════════════════════════════════════');
  console.log('  Diagnostic Complete. Copy everything');
  console.log('  above and share with the developer.');
  console.log('═══════════════════════════════════════');
})();
