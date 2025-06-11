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
    <div id="tab-buttons" style="position:relative;display:flex;gap:0;background:#f2f2f2;border-radius:6px 6px 0 0;overflow:hidden;margin-bottom:10px;height:38px;min-width:220px;">
      <div class="tab-highlight" style="left:0;"></div>
      <button class="tab-btn active" id="type-tab" style="min-width:110px;background:none;border:none;">Type</button>
      <button class="tab-btn" id="weight-style-tab" style="min-width:110px;background:none;border:none;">Weight/Style</button>
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
  // Position the panel next to the cursor, but keep it in the viewport
  setTimeout(() => {
    const panelRect = panel.getBoundingClientRect();
    let left = lastClickPosition.x + 20;
    let top = lastClickPosition.y + 20;
    if (left + panelRect.width > window.innerWidth) left = window.innerWidth - panelRect.width - 10;
    if (top + panelRect.height > window.innerHeight) top = window.innerHeight - panelRect.height - 10;
    panel.style.left = left + 'px';
    panel.style.top = top + 'px';
  }, 0);
  document.getElementById('fontify-close-btn').onclick = () => panel.remove();
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
