let enabled = true;

// Cross-browser storage API
const storage = (typeof browser !== 'undefined' && browser.storage) ? browser.storage : (chrome && chrome.storage ? chrome.storage : null);

// On load, check stored enabled/disabled state
if (storage && storage.local) {
  storage.local.get(['fontifyEnabled'], (result) => {
    if (typeof result.fontifyEnabled === 'boolean') {
      enabled = result.fontifyEnabled;
      if (!enabled) {
        hideTooltip();
        const oldPanel = document.getElementById('fontify-font-panel');
        if (oldPanel) oldPanel.remove();
      }
    }
  });
}

function getFontInfo(element) {
  const style = window.getComputedStyle(element);
  return {
    family: style.fontFamily,
    weight: style.fontWeight,
    style: style.fontStyle,
    size: style.fontSize
  };
}

function isTextElement(element) {
  // Exclude images, videos, canvases, svgs, and elements with no visible text
  if (!element) return false;
  const tag = element.tagName.toLowerCase();
  if (["img", "svg", "canvas", "video", "audio", "picture", "iframe", "input", "button"].includes(tag)) return false;
  // Check if the element or its children have visible text
  const text = element.textContent || "";
  if (text.trim().length === 0) return false;
  // Optionally, check if the element is visible
  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
  return true;
}

function showTooltip(e) {
  if (!enabled) return;
  if (!isTextElement(e.target)) {
    hideTooltip();
    return;
  }
  const fontInfo = getFontInfo(e.target);
  let tooltip = document.getElementById('fontify-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'fontify-tooltip';
    document.body.appendChild(tooltip);
  }
  tooltip.textContent = `${fontInfo.family} | Type: ${getFontType(fontInfo.weight, fontInfo.style)}`;
  tooltip.style.display = 'block';
  tooltip.style.left = e.pageX + 10 + 'px';
  tooltip.style.top = e.pageY + 10 + 'px';
}

function hideTooltip() {
  const tooltip = document.getElementById('fontify-tooltip');
  if (tooltip) tooltip.style.display = 'none';
}

document.addEventListener('mousemove', showTooltip);
document.addEventListener('mouseout', hideTooltip);

let lastClickPosition = { x: 0, y: 0 };
document.addEventListener('mousemove', function(e) {
  lastClickPosition.x = e.clientX;
  lastClickPosition.y = e.clientY;
});

function sanitizeFontFamily(family) {
  return family.split(',')[0].replace(/['"]/g, '').trim();
}

function createFontPanel(fontInfo) {
  // Remove existing panel if present
  const oldPanel = document.getElementById('fontify-font-panel');
  if (oldPanel) oldPanel.remove();

  const family = sanitizeFontFamily(fontInfo.family);
  const sources = [
    { name: 'Google Fonts', url: `https://fonts.google.com/specimen/${encodeURIComponent(family)}` },
    { name: 'Adobe Fonts', url: `https://fonts.adobe.com/search?query=${encodeURIComponent(family)}` },
    { name: 'DaFont', url: `https://www.dafont.com/search.php?q=${encodeURIComponent(family)}` },
    { name: 'CufonFonts', url: `https://www.cufonfonts.com/search?query=${encodeURIComponent(family)}` },
    { name: 'Fontesk', url: `https://fontesk.com/?s=${encodeURIComponent(family)}` }
  ];

  const panel = document.createElement('div');
  panel.id = 'fontify-font-panel';
  panel.innerHTML = `
    <div class="fontify-panel-header">
      <span style="font-weight:bold;">Font Info</span>
      <button id="fontify-close-btn" title="Close">&times;</button>
    </div>
    <div id="tab-buttons">
      <div class="tab-highlight" style="left:0;"></div>
      <button class="tab-btn active" id="type-tab">Type</button>
      <button class="tab-btn" id="weight-style-tab">Weight/Style</button>
    </div>
    <div id="font-info-type">
      <div><b>Family:</b> ${family}</div>
      <div><b>Type:</b> ${getFontType(fontInfo.weight, fontInfo.style)}</div>
      <div><b>Size:</b> ${fontInfo.size}</div>
    </div>
    <div id="font-info-weight-style" style="display:none;">
      <div><b>Family:</b> ${family}</div>
      <div><b>Weight:</b> ${fontInfo.weight}</div>
      <div><b>Style:</b> ${fontInfo.style}</div>
      <div><b>Size:</b> ${fontInfo.size}</div>
    </div>
    <div style="font-weight:bold;margin-bottom:6px;">Download from:</div>
    <ul style="padding-left:18px; margin:0;">
      ${sources.map(src => `<li><a href="${src.url}" target="_blank" rel="noopener">${src.name}</a></li>`).join('')}
    </ul>
    <div id="fontify-direct-download-section" style="margin-top:10px;"></div>
    <div style="font-size:12px;color:#888;margin-top:8px;">If the font is not available on one source, try the others.</div>
  `;
  // Prevent click events from propagating to the page behind the panel
  panel.addEventListener('mousedown', e => e.stopPropagation());
  panel.addEventListener('mouseup', e => e.stopPropagation());
  panel.addEventListener('click', e => e.stopPropagation());
  panel.addEventListener('dblclick', e => e.stopPropagation());
  panel.addEventListener('pointerdown', e => e.stopPropagation());
  document.body.appendChild(panel);

  // Tab switching and highlight logic
  const tabButtons = panel.querySelectorAll('.tab-btn');
  const highlight = panel.querySelector('.tab-highlight');
  const tabBar = panel.querySelector('#tab-buttons');
  function moveHighlightTo(tab) {
    highlight.style.left = tab.offsetLeft + 'px';
    highlight.style.width = tab.offsetWidth + 'px';
  }
  // Initial highlight position
  moveHighlightTo(panel.querySelector('.tab-btn.active'));
  tabButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      tabButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      if (this.id === 'type-tab') {
        panel.querySelector('#font-info-type').style.display = '';
        panel.querySelector('#font-info-weight-style').style.display = 'none';
      } else {
        panel.querySelector('#font-info-type').style.display = 'none';
        panel.querySelector('#font-info-weight-style').style.display = '';
      }
      moveHighlightTo(this);
    });
    btn.addEventListener('mouseenter', function() {
      moveHighlightTo(this);
    });
  });
  tabBar.addEventListener('mouseleave', function() {
    const activeTab = panel.querySelector('.tab-btn.active');
    moveHighlightTo(activeTab);
  });
  // Position the panel next to the cursor, but keep it fully in the viewport
  setTimeout(() => {
    // Temporarily set visibility hidden and display block to get accurate size
    panel.style.visibility = 'hidden';
    panel.style.display = 'block';
    // Use offsetWidth/offsetHeight for more reliable size before showing
    const panelWidth = panel.offsetWidth;
    const panelHeight = panel.offsetHeight;
    // Always reset maxHeight/overflowY before measuring
    panel.style.maxHeight = '';
    panel.style.overflowY = '';
    let left = lastClickPosition.x + 20;
    let top = lastClickPosition.y + 20;
    // If panel would overflow right, move to left of cursor if possible
    if (left + panelWidth > window.innerWidth - 10) {
      if (lastClickPosition.x - panelWidth - 20 > 10) {
        left = lastClickPosition.x - panelWidth - 20;
      } else {
        left = window.innerWidth - panelWidth - 10;
      }
    }
    // If panel would overflow bottom, move above cursor if possible
    if (top + panelHeight > window.innerHeight - 10) {
      if (lastClickPosition.y - panelHeight - 20 > 10) {
        top = lastClickPosition.y - panelHeight - 20;
      } else {
        top = window.innerHeight - panelHeight - 10;
      }
    }
    // Clamp to minimum margin
    if (left < 10) left = 10;
    if (top < 10) top = 10;
    // If panel still overflows bottom, force height and make scrollable
    let availableHeight = window.innerHeight - top - 10;
    if (availableHeight < panelHeight) {
      panel.style.maxHeight = availableHeight + 'px';
      panel.style.overflowY = 'auto';
    } else {
      panel.style.maxHeight = '';
      panel.style.overflowY = '';
    }
    panel.style.left = left + 'px';
    panel.style.top = top + 'px';
    panel.style.right = '';
    panel.style.bottom = '';
    // Restore visibility
    panel.style.visibility = '';
    panel.style.display = '';
  }, 20); // 20ms to ensure DOM paint and font loading
  document.getElementById('fontify-close-btn').onclick = () => panel.remove();

  // Make the panel draggable
  const header = panel.querySelector('.fontify-panel-header');
  header.style.cursor = 'move';
  let isDragging = false, dragOffsetX = 0, dragOffsetY = 0;
  let dragPointerMove, dragPointerUp;
  header.addEventListener('pointerdown', function(e) {
    if (e.button !== 0) return; // Only left mouse button
    isDragging = true;
    dragOffsetX = e.clientX - panel.getBoundingClientRect().left;
    dragOffsetY = e.clientY - panel.getBoundingClientRect().top;
    document.body.style.userSelect = 'none';
    dragPointerMove = function(e) {
      let left = e.clientX - dragOffsetX;
      let top = e.clientY - dragOffsetY;
      left = Math.max(0, Math.min(left, window.innerWidth - panel.offsetWidth));
      top = Math.max(0, Math.min(top, window.innerHeight - panel.offsetHeight));
      panel.style.left = left + 'px';
      panel.style.top = top + 'px';
      panel.style.right = '';
      panel.style.bottom = '';
    };
    dragPointerUp = function() {
      isDragging = false;
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', dragPointerMove);
      window.removeEventListener('pointerup', dragPointerUp);
    };
    window.addEventListener('pointermove', dragPointerMove);
    window.addEventListener('pointerup', dragPointerUp);
  });

  // After appending panel to body, add direct font download links if available
  setTimeout(() => {
    // Find all font-face src URLs for the current family
    const styleSheets = Array.from(document.styleSheets);
    let foundFontFiles = [];
    for (const sheet of styleSheets) {
      let rules;
      try { rules = sheet.cssRules || sheet.rules; } catch (e) { continue; }
      if (!rules) continue;
      for (const rule of rules) {
        if (rule.type === CSSRule.FONT_FACE_RULE) {
          const ruleFamily = rule.style.fontFamily.replace(/['"]/g, '').trim();
          if (ruleFamily === family) {
            const src = rule.style.src;
            if (src) {
              // Extract all url(...) from src
              const matches = src.match(/url\(([^)]+)\)/g);
              if (matches) {
                matches.forEach(m => {
                  let url = m.match(/url\(([^)]+)\)/)[1].replace(/['"]/g, '');
                  if (/\.(woff2?|ttf|otf|eot|svg)([?#].*)?$/i.test(url)) {
                    foundFontFiles.push({
                      url,
                      family: ruleFamily,
                      style: rule.style.fontStyle || '',
                      weight: rule.style.fontWeight || ''
                    });
                  }
                });
              }
            }
          }
        }
      }
    }
    // Fallback: check <link> and <style> tags for font URLs if nothing found
    if (foundFontFiles.length === 0) {
      document.querySelectorAll('link[rel="stylesheet"], style').forEach(el => {
        let cssText = '';
        if (el.tagName.toLowerCase() === 'link') {
          // Try to fetch the CSS if CORS allows
          try {
            const href = el.getAttribute('href');
            if (href && /\.css(\?|$)/.test(href)) {
              fetch(href).then(r => r.text()).then(text => {
                const regex = /@font-face\s*{[^}]*}/gi;
                let match;
                while ((match = regex.exec(text))) {
                  const block = match[0];
                  const famMatch = block.match(/font-family\s*:\s*['\"]?([^;'\"]+)/i);
                  if (!famMatch) continue;
                  const ruleFamily = famMatch[1].trim();
                  if (ruleFamily !== family) continue;
                  const styleMatch = block.match(/font-style\s*:\s*([^;}]*)/i);
                  const weightMatch = block.match(/font-weight\s*:\s*([^;}]*)/i);
                  const srcMatch = block.match(/src\s*:\s*([^;}]*)/);
                  if (srcMatch) {
                    const urlMatches = srcMatch[1].match(/url\(([^)]+)\)/g);
                    if (urlMatches) {
                      urlMatches.forEach(m => {
                        let url = m.match(/url\(([^)]+)\)/)[1].replace(/['\"]/g, '');
                        if (/\.(woff2?|ttf|otf|eot|svg)([?#].*)?$/i.test(url)) {
                          foundFontFiles.push({
                            url,
                            family: ruleFamily,
                            style: styleMatch ? styleMatch[1].trim() : '',
                            weight: weightMatch ? weightMatch[1].trim() : ''
                          });
                        }
                      });
                    }
                  }
                }
                updateDirectSection();
              });
            }
          } catch (e) {}
        } else if (el.tagName.toLowerCase() === 'style') {
          cssText = el.textContent;
          const regex = /@font-face\s*{[^}]*}/gi;
          let match;
          while ((match = regex.exec(cssText))) {
            const block = match[0];
            const famMatch = block.match(/font-family\s*:\s*['\"]?([^;'\"]+)/i);
            if (!famMatch) continue;
            const ruleFamily = famMatch[1].trim();
            if (ruleFamily !== family) continue;
            const styleMatch = block.match(/font-style\s*:\s*([^;}]*)/i);
            const weightMatch = block.match(/font-weight\s*:\s*([^;}]*)/i);
            const srcMatch = block.match(/src\s*:\s*([^;}]*)/);
            if (srcMatch) {
              const urlMatches = srcMatch[1].match(/url\(([^)]+)\)/g);
              if (urlMatches) {
                urlMatches.forEach(m => {
                  let url = m.match(/url\(([^)]+)\)/)[1].replace(/['\"]/g, '');
                  if (/\.(woff2?|ttf|otf|eot|svg)([?#].*)?$/i.test(url)) {
                    foundFontFiles.push({
                      url,
                      family: ruleFamily,
                      style: styleMatch ? styleMatch[1].trim() : '',
                      weight: weightMatch ? weightMatch[1].trim() : ''
                    });
                  }
                });
              }
            }
          }
        }
      });
    }
    function getFriendlyFontName(file) {
      // file: { url, family, style, weight }
      let style = '';
      // Prefer style/weight from rule, fallback to url parsing
      const lower = file.url.toLowerCase();
      const weight = (file.weight || '').toLowerCase();
      const fontStyle = (file.style || '').toLowerCase();
      if (/blackitalic|black-italic/.test(lower) || (weight === '900' && fontStyle === 'italic')) style = 'Black Italic';
      else if (/extrabolditalic|extra-bolditalic|extra-bold-italic/.test(lower) || (weight === '800' && fontStyle === 'italic')) style = 'ExtraBold Italic';
      else if (/extrabold|extra-bold/.test(lower) || weight === '800') style = 'ExtraBold';
      else if (/semibolditalic|semi-bolditalic|semi-bold-italic/.test(lower) || (weight === '600' && fontStyle === 'italic')) style = 'SemiBold Italic';
      else if (/semibold|semi-bold/.test(lower) || weight === '600') style = 'SemiBold';
      else if (/bolditalic|bold-italic/.test(lower) || (weight === 'bold' && fontStyle === 'italic')) style = 'Bold Italic';
      else if (/black/.test(lower) || weight === '900') style = 'Black';
      else if (/bold/.test(lower) || weight === 'bold' || weight === '700') style = 'Bold';
      else if (/italic/.test(lower) || fontStyle === 'italic' || fontStyle === 'oblique') style = 'Italic';
      else if (/regular/.test(lower) || weight === 'normal' || weight === '400') style = 'Regular';
      else if (/medium/.test(lower) || weight === '500') style = 'Medium';
      else if (/lightitalic|light-italic/.test(lower) || (weight === '300' && fontStyle === 'italic')) style = 'Light Italic';
      else if (/light/.test(lower) || weight === '300') style = 'Light';
      else if (/thin/.test(lower) || weight === '100') style = 'Thin';
      else style = file.url.split('.').pop().toUpperCase();
      return `${file.family}${style ? ' - ' + style : ''}`;
    }
    function updateDirectSection() {
      const directSection = panel.querySelector('#fontify-direct-download-section');
      if (foundFontFiles.length > 0) {
        directSection.innerHTML = `
          <div style="font-weight:bold;margin:10px 0 4px 0;">Download used font file(s) from this website:</div>
          <ul style="padding-left:18px; margin:0; max-height:180px; overflow:auto;">
            ${foundFontFiles.map(file => `<li><a href="${file.url}" download style="word-break:break-all;">${getFriendlyFontName(file)}</a></li>`).join('')}
          </ul>
        `;
      } else {
        directSection.innerHTML = `<div style="font-size:13px;color:#888;margin:10px 0 0 0;">No downloadable font file found on this website.</div>`;
      }
    }
    // Initial update
    updateDirectSection();
  }, 0);
}

function getFontType(weight, style) {
  const isBold = weight >= 600 || weight === 'bold';
  const isItalic = style === 'italic' || style === 'oblique';
  if (isBold && isItalic) return 'Bold Italic';
  if (isBold) return 'Bold';
  if (isItalic) return 'Italic';
  return 'Regular';
}

// Listen for toggle event from background.js
window.addEventListener('fontify-toggle', (e) => {
  enabled = e.detail;
  if (!enabled) {
    hideTooltip();
    const oldPanel = document.getElementById('fontify-font-panel');
    if (oldPanel) oldPanel.remove();
  }
});

document.addEventListener('click', function(e) {
  if (!enabled) return;
  if (!isTextElement(e.target)) return;
  const fontInfo = getFontInfo(e.target);
  window.lastFontifyFontInfo = fontInfo; // Store globally for popup access
  createFontPanel(fontInfo); // Show on-page panel
  window.postMessage({ type: 'FONTIFY_SHOW_POPUP', fontInfo }, '*');
});
