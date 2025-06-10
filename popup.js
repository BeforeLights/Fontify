chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.scripting.executeScript({
    target: { tabId: tabs[0].id },
    func: () => window.lastFontifyFontInfo
  }, (results) => {
    if (results && results[0] && results[0].result) {
      const fontInfo = results[0].result;
      document.getElementById('font-info').textContent = `Font: ${fontInfo.family} | Weight: ${fontInfo.weight} | Style: ${fontInfo.style}`;
      const family = sanitizeFontFamily(fontInfo.family);
      showFontDownloads(family);
    } else {
      document.getElementById('font-info').textContent = 'Click on any text to get font info.';
      document.getElementById('font-downloads').innerHTML = '';
    }
  });
});

function sanitizeFontFamily(family) {
  // Remove quotes and extra fallbacks
  return family.split(',')[0].replace(/['"]/g, '').trim();
}

function showFontDownloads(family) {
  const downloadsDiv = document.getElementById('font-downloads');
  const sources = [
    {
      name: 'Google Fonts',
      url: `https://fonts.google.com/specimen/${encodeURIComponent(family)}`
    },
    {
      name: 'Adobe Fonts',
      url: `https://fonts.adobe.com/search?query=${encodeURIComponent(family)}`
    },
    {
      name: 'DaFont',
      url: `https://www.dafont.com/search.php?q=${encodeURIComponent(family)}`
    },
    {
      name: 'CufonFonts',
      url: `https://www.cufonfonts.com/search?query=${encodeURIComponent(family)}`
    },
    {
      name: 'Fontesk',
      url: `https://fontesk.com/?s=${encodeURIComponent(family)}`
    }
  ];
  downloadsDiv.innerHTML =
    '<div style="font-weight:bold;margin-bottom:8px;">Download this font family from trusted sources:</div>' +
    '<ul style="padding-left:18px;">' +
    sources.map(src => `<li><a href="${src.url}" target="_blank">${src.name}</a></li>`).join('') +
    '</ul>' +
    '<div style="font-size:12px;color:#888;margin-top:8px;">If the font is not available on one source, try the others.</div>';
}
