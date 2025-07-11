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
  // Don't show tooltip if mouse is over the font panel or bulk download panel
  const panel = document.getElementById('fontify-font-panel');
  const bulkPanel = document.getElementById('fontifyx-bulk-panel');
  if ((panel && panel.contains(e.target)) || (bulkPanel && bulkPanel.contains(e.target))) {
    hideTooltip();
    return;
  }
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
    <link href="https://fonts.googleapis.com/css?family=Playfair+Display:700&display=swap" rel="stylesheet">
    <div class="fontify-panel-header">
      <span style="font-family:'Playfair Display',serif;font-weight:700;font-size:22px;letter-spacing:1px;">FONTIFY</span>
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
    <div style="display:flex;justify-content:center;margin-top:24px;">
      <button id="fontifyx-bulk-btn" style="font-family:'Inter',Arial,sans-serif;font-size:16px;padding:10px 48px;border-radius:6px;background:#222;color:#fff;border:none;cursor:pointer;width:100%;max-width:260px;box-shadow:0 2px 8px rgba(0,0,0,0.07);">Bulk Download</button>
    </div>
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
  // Allow drag from header or any whitespace (background) of the panel, including the right side, but not on text, buttons, or links
  const header = panel.querySelector('.fontify-panel-header');
  panel.style.position = 'fixed';
  header.style.cursor = 'move';
  panel.style.cursor = 'default';
  // Add a transparent overlay for dragging on whitespace
  const dragOverlay = document.createElement('div');
  dragOverlay.style.position = 'absolute';
  dragOverlay.style.top = '0';
  dragOverlay.style.left = '0';
  dragOverlay.style.width = '100%';
  dragOverlay.style.height = '100%';
  dragOverlay.style.zIndex = '10';
  dragOverlay.style.pointerEvents = 'none';
  dragOverlay.style.background = 'transparent';
  panel.appendChild(dragOverlay);
  let isDragging = false, dragOffsetX = 0, dragOffsetY = 0;
  let dragPointerMove, dragPointerUp;
  function isDraggableArea(e) {
    // Allow drag if on header
    if (header.contains(e.target)) return true;
    // Allow drag if on panel background (not on any child element)
    if (e.target === panel) return true;
    // Allow drag if on overlay and underlying element is panel (not a child)
    if (e.target === dragOverlay) {
      // Use elementFromPoint to check if the underlying element is the panel itself
      const rect = panel.getBoundingClientRect();
      const x = e.clientX, y = e.clientY;
      const underlying = document.elementFromPoint(x, y);
      if (underlying === panel) return true;
    }
    return false;
  }
  panel.addEventListener('pointerdown', function(e) {
    if (e.button !== 0) return;
    if (!isDraggableArea(e)) return;
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
  // Overlay pointer events: only catch events when mouse is over panel background (not children)
  panel.addEventListener('mousemove', function(e) {
    // If mouse is over the panel background (not a child), enable overlay pointer events
    if (e.target === panel) {
      dragOverlay.style.pointerEvents = 'auto';
    } else {
      dragOverlay.style.pointerEvents = 'none';
    }
  });

  // After appending panel to body, add direct font download links if available
  // --- Hoist foundFontFiles to outer scope so async fetches update the same array ---
  let foundFontFiles = [];
  setTimeout(() => {
    // Find all font-face src URLs on the website (not just the current family)
    const styleSheets = Array.from(document.styleSheets);
    foundFontFiles.length = 0; // clear in case of panel reopen
    for (const sheet of styleSheets) {
      let rules;
      try { rules = sheet.cssRules || sheet.rules; } catch (e) { continue; }
      if (!rules) continue;
      for (const rule of rules) {
        if (rule.type === CSSRule.FONT_FACE_RULE) {
          const ruleFamily = rule.style.fontFamily.replace(/['"]/g, '').trim();
          // Find ALL fonts, not just the clicked family
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
                  const famMatch = block.match(/font-family\s*:\s*['\"]?([^;'"]+)/i);
                  if (!famMatch) continue;
                  const ruleFamily = famMatch[1].trim();
                  // Find ALL fonts, not just the clicked family
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
            const famMatch = block.match(/font-family\s*:\s*['\"]?([^;'"]+)/i);
            if (!famMatch) continue;
            const ruleFamily = famMatch[1].trim();
            // Find ALL fonts, not just the clicked family
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
      // Normalize family names for comparison (remove quotes, extra spaces, make lowercase)
      const normalizedClickedFamily = family.replace(/['"]/g, '').trim().toLowerCase();
      const matchingFonts = foundFontFiles.filter(file => {
        const normalizedRuleFamily = file.family.replace(/['"]/g, '').trim().toLowerCase();
        return normalizedRuleFamily === normalizedClickedFamily;
      });
      
      if (matchingFonts.length > 0) {
        directSection.innerHTML = `
          <div style="font-weight:bold;margin:10px 0 4px 0;">Download used font file(s) from this website:</div>
          <ul style="padding-left:18px; margin:0; max-height:180px; overflow:auto;">
            ${matchingFonts.map(file => `<li><a href="${file.url}" download style="word-break:break-all;">${getFriendlyFontName(file)}</a></li>`).join('')}
          </ul>
        `;
      } else {
        directSection.innerHTML = `<div style="font-size:13px;color:#888;margin:10px 0 0 0;">No downloadable font file found for this font family.</div>`;
      }
      // --- Update bulk button state based on ALL fonts found ---
      const bulkBtn = panel.querySelector('#fontifyx-bulk-btn');
      if (bulkBtn) {
        if (foundFontFiles.length > 0) {
          bulkBtn.disabled = false;
          bulkBtn.style.opacity = '';
          bulkBtn.onclick = function() {
            showFontifyxBulkDownloadPanel(foundFontFiles);
          };
        } else {
          bulkBtn.disabled = true;
          bulkBtn.style.opacity = '0.5';
          bulkBtn.onclick = null;
        }
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

// Update showFontifyxBulkDownloadPanel to use foundFontFiles structure
function showFontifyxBulkDownloadPanel(fontFiles) {
  // Remove any existing bulk panel
  const oldBulkPanel = document.getElementById('fontifyx-bulk-panel');
  if (oldBulkPanel) oldBulkPanel.remove();

  // Helper function to get font type format
  function getFontTypeFormat(file) {
    const weight = (file.weight || '').toLowerCase();
    const style = (file.style || '').toLowerCase();
    const isBold = weight === 'bold' || weight === '700' || parseInt(weight) >= 600;
    const isItalic = style === 'italic' || style === 'oblique';
    
    if (isBold && isItalic) return 'Bold Italic';
    if (isBold) return 'Bold';
    if (isItalic) return 'Italic';
    return 'Regular';
  }

  // Create panel
  const bulkPanel = document.createElement('div');
  bulkPanel.id = 'fontifyx-bulk-panel';
  bulkPanel.innerHTML = `
    <link href="https://fonts.googleapis.com/css?family=Playfair+Display:700&family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
    <div class="fontify-panel-header" style="display:flex;align-items:center;justify-content:space-between;padding:0 0 8px 0;">
      <span style="font-family:'Playfair Display',serif;font-weight:700;font-size:22px;letter-spacing:1px;">Bulk Download</span>
      <button id="fontifyx-bulk-close-btn" title="Close" style="background:none;border:none;font-size:22px;color:#888;cursor:pointer;line-height:1;padding:0 4px;border-radius:4px;transition:background 0.15s;">&times;</button>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:12px;">
      <button id="fontifyx-select-all-btn" style="font-family:'Inter',Arial,sans-serif;font-size:14px;font-weight:500;padding:8px 16px;border-radius:6px;background:#f8f9fa;color:#495057;border:1px solid #dee2e6;cursor:pointer;flex:1;transition:all 0.15s;box-shadow:0 1px 3px rgba(0,0,0,0.05);">Select All</button>
      <button id="fontifyx-deselect-all-btn" style="font-family:'Inter',Arial,sans-serif;font-size:14px;font-weight:500;padding:8px 16px;border-radius:6px;background:#f8f9fa;color:#495057;border:1px solid #dee2e6;cursor:pointer;flex:1;transition:all 0.15s;box-shadow:0 1px 3px rgba(0,0,0,0.05);">Deselect All</button>
    </div>
    <div id="fontifyx-bulk-list" style="margin-bottom:16px;max-height:220px;overflow:auto;">
      ${fontFiles.map((file, i) => `
        <label class="fontifyx-bulk-item" style="display:flex;align-items:center;margin-bottom:8px;gap:10px;cursor:pointer;">
          <input type="checkbox" class="fontifyx-bulk-checkbox" value="${file.url}" checked style="accent-color:#222;width:18px;height:18px;border-radius:4px;box-shadow:0 1px 2px rgba(0,0,0,0.07);margin:0;">
          <span style="font-family:'Inter',Arial,sans-serif;font-size:15px;">${file.family} | Type: ${getFontTypeFormat(file)}</span>
        </label>
      `).join('')}
    </div>
    <div style="display:flex;justify-content:center;">
      <button id="fontifyx-bulk-download-btn" style="font-family:'Inter',Arial,sans-serif;font-size:16px;padding:10px 48px;border-radius:6px;background:#222;color:#fff;border:none;cursor:pointer;width:100%;max-width:260px;box-shadow:0 2px 8px rgba(0,0,0,0.07);">Download Selected</button>
    </div>
  `;
  // Style and position
  bulkPanel.style.position = 'fixed';
  bulkPanel.style.left = '50%';
  bulkPanel.style.top = '50%';
  bulkPanel.style.transform = 'translate(-50%, -50%) scale(0.98)';
  bulkPanel.style.opacity = '0';
  bulkPanel.style.background = '#fff';
  bulkPanel.style.borderRadius = '12px';
  bulkPanel.style.boxShadow = '0 4px 24px rgba(0,0,0,0.18)';
  bulkPanel.style.zIndex = '1000001';
  bulkPanel.style.padding = '22px 28px 18px 28px';
  bulkPanel.style.minWidth = '320px';
  bulkPanel.style.maxWidth = '400px';
  bulkPanel.style.fontFamily = "'Playfair Display', 'Inter', Arial, sans-serif";
  bulkPanel.style.fontSize = '15px';
  bulkPanel.style.border = '1px solid #e0e0e0';
  bulkPanel.style.transition = 'transform 0.18s cubic-bezier(.4,1,.6,1), opacity 0.18s cubic-bezier(.4,1,.6,1)';

  // Prevent click events from propagating
  bulkPanel.addEventListener('mousedown', e => e.stopPropagation());
  bulkPanel.addEventListener('mouseup', e => e.stopPropagation());
  bulkPanel.addEventListener('click', e => e.stopPropagation());
  bulkPanel.addEventListener('dblclick', e => e.stopPropagation());
  bulkPanel.addEventListener('pointerdown', e => e.stopPropagation());

  document.body.appendChild(bulkPanel);

  // Stop propagation for all interactive elements
  bulkPanel.addEventListener('pointerdown', function(e) {
    // Stop propagation for interactive elements
    if (e.target.tagName === 'BUTTON' || 
        e.target.tagName === 'INPUT' || 
        e.target.tagName === 'LABEL' ||
        e.target.type === 'checkbox' ||
        e.target.closest('button') ||
        e.target.closest('label') ||
        e.target.closest('input')) {
      e.stopPropagation();
    }
  });

  // --- Animate in like the main panel (no bounce, just fade/scale in) ---
  setTimeout(() => {
    bulkPanel.style.transform = 'translate(-50%, -50%) scale(1)';
    bulkPanel.style.opacity = '1';
  }, 10);

  // --- Make the bulk panel draggable like the main panel ---
  const header = bulkPanel.querySelector('.fontify-panel-header');
  bulkPanel.style.cursor = 'default';
  header.style.cursor = 'move';
  // Add a transparent overlay for dragging on whitespace
  const dragOverlay = document.createElement('div');
  dragOverlay.style.position = 'absolute';
  dragOverlay.style.top = '0';
  dragOverlay.style.left = '0';
  dragOverlay.style.width = '100%';
  dragOverlay.style.height = '100%';
  dragOverlay.style.zIndex = '10';
  dragOverlay.style.pointerEvents = 'none';
  dragOverlay.style.background = 'transparent';
  bulkPanel.appendChild(dragOverlay);
  let isDragging = false, dragOffsetX = 0, dragOffsetY = 0;
  let dragPointerMove, dragPointerUp;
  function isDraggableArea(e) {
    // Allow drag if on header
    if (header.contains(e.target)) return true;
    // Allow drag if on panel background (not on any child element)
    if (e.target === bulkPanel) return true;
    // Allow drag if on overlay and underlying element is panel (not a child)
    if (e.target === dragOverlay) {
      // Use elementFromPoint to check if the underlying element is the panel itself
      const rect = bulkPanel.getBoundingClientRect();
      const x = e.clientX, y = e.clientY;
      const underlying = document.elementFromPoint(x, y);
      if (underlying === bulkPanel) return true;
    }
    return false;
  }
  bulkPanel.addEventListener('pointerdown', function(e) {
    if (e.button !== 0) return;
    if (!isDraggableArea(e)) return;
    
    // Get current visual position
    const rect = bulkPanel.getBoundingClientRect();
    
    // Remove transform and set to current visual position
    bulkPanel.style.transform = '';
    bulkPanel.style.left = rect.left + 'px';
    bulkPanel.style.top = rect.top + 'px';
    bulkPanel.style.margin = '0';
    bulkPanel.style.right = '';
    bulkPanel.style.bottom = '';
    
    isDragging = true;
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    document.body.style.userSelect = 'none';
    dragPointerMove = function(e) {
      let left = e.clientX - dragOffsetX;
      let top = e.clientY - dragOffsetY;
      left = Math.max(0, Math.min(left, window.innerWidth - bulkPanel.offsetWidth));
      top = Math.max(0, Math.min(top, window.innerHeight - bulkPanel.offsetHeight));
      bulkPanel.style.left = left + 'px';
      bulkPanel.style.top = top + 'px';
      bulkPanel.style.right = '';
      bulkPanel.style.bottom = '';
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
  // Overlay pointer events: only catch events when mouse is over panel background (not children)
  bulkPanel.addEventListener('mousemove', function(e) {
    // If mouse is over the panel background (not a child), enable overlay pointer events
    if (e.target === bulkPanel) {
      dragOverlay.style.pointerEvents = 'auto';
    } else {
      dragOverlay.style.pointerEvents = 'none';
    }
  });
  // Close logic
  const closeBtn = document.getElementById('fontifyx-bulk-close-btn');
  closeBtn.onclick = (e) => {
    e.stopPropagation();
    bulkPanel.remove();
  };
  // Add hover effect to match main panel
  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.background = '#f0f0f0';
    closeBtn.style.color = '#222';
  });
  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.background = 'none';
    closeBtn.style.color = '#888';
  });

  // Select/Deselect all logic
  const selectAllBtn = document.getElementById('fontifyx-select-all-btn');
  const deselectAllBtn = document.getElementById('fontifyx-deselect-all-btn');
  
  selectAllBtn.onclick = function(e) {
    e.stopPropagation();
    const checkboxes = bulkPanel.querySelectorAll('.fontifyx-bulk-checkbox');
    checkboxes.forEach(cb => cb.checked = true);
  };
  
  deselectAllBtn.onclick = function(e) {
    e.stopPropagation();
    const checkboxes = bulkPanel.querySelectorAll('.fontifyx-bulk-checkbox');
    checkboxes.forEach(cb => cb.checked = false);
  };

  // Add hover effects for select/deselect buttons
  [selectAllBtn, deselectAllBtn].forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      btn.style.background = '#e9ecef';
      btn.style.borderColor = '#adb5bd';
      btn.style.transform = 'translateY(-1px)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = '#f8f9fa';
      btn.style.borderColor = '#dee2e6';
      btn.style.transform = 'translateY(0)';
    });
  });

  // Download logic
  document.getElementById('fontifyx-bulk-download-btn').onclick = function(e) {
    e.stopPropagation();
    const checked = Array.from(bulkPanel.querySelectorAll('.fontifyx-bulk-checkbox:checked'));
    const selectedUrls = checked.map(cb => cb.value);
    if (selectedUrls.length === 0) {
      alert('Please select at least one font to download.');
      return;
    }
    
    // Show downloading message
    this.textContent = `Downloading ${selectedUrls.length} fonts...`;
    this.disabled = true;
    this.style.opacity = '0.7';
    
    // Download each selected font file with a delay to prevent browser blocking
    selectedUrls.forEach((url, index) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = url;
        a.download = url.split('/').pop().split('?')[0];
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Close panel after last download
        if (index === selectedUrls.length - 1) {
          setTimeout(() => {
            bulkPanel.remove();
          }, 500);
        }
      }, index * 300); // 300ms delay between downloads
    });
  };
}
