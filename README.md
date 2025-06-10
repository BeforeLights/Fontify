=======
# Fontify - Font Finder & Downloader

Fontify is a browser extension for Firefox and Chromium that helps you identify and find download sources for fonts you encounter on the web.

## Features

*   **Font Identification on Hover:** Simply hover your cursor over any text element on a webpage to see a tooltip displaying its font family, weight, and style.
*   **On-Click Font Details & Downloads:** Click on any text element to open a floating panel. This panel shows detailed font information and provides direct links to download the font family from various trusted sources.
*   **Multiple Font Sources:** Includes links to:
    *   Google Fonts
    *   Adobe Fonts
    *   DaFont
    *   CufonFonts
    *   Fontesk
*   **Toggle On/Off:** Easily enable or disable the extension by clicking its icon in the browser toolbar. The icon badge will indicate its current state (ON/OFF).
*   **Context-Aware:** Intelligently ignores images and other non-text elements, only activating for actual text content.
*   **User-Friendly UI:** The floating panel appears conveniently next to your cursor and is designed for a smooth user experience.

## How to Use

1.  **Enable the Extension:** Click the Fontify icon in your browser toolbar. The badge should display "ON".
2.  **Hover to Identify:** Move your mouse cursor over any text on a webpage. A small tooltip will appear showing the font's basic information.
3.  **Click for Details & Downloads:** Click on the text. A panel will appear near your cursor, displaying:
    *   Full font details (family, weight, style, size).
    *   A list of websites where you can find and download the font family.
4.  **Disable the Extension:** Click the Fontify icon again. The badge will change to "OFF", and all font identification features will be deactivated.

## Installation (for Development/Testing)

### Firefox

1.  Clone or download this repository to your local machine.
2.  Open Firefox.
3.  Type `about:debugging` in the address bar and press Enter.
4.  Click on "This Firefox" in the sidebar.
5.  Click the "Load Temporary Add-on..." button.
6.  Navigate to the directory where you saved the Fontify files and select the `manifest.json` file.

The Fontify icon should now appear in your Firefox toolbar.

### Chromium

1.  Clone or download this repository to your local machine.
2.  Open any Chromium browsers.
3.  Go to `chrome://extensions/` in the address bar.
4.  Enable "Developer mode" (toggle in the top right).
5.  Click the "Load unpacked" button.
6.  Select the directory where you saved the Fontify files.

The Fontify icon should now appear in your Chrome toolbar.

## Project Files

*   `manifest.json`: The core file that defines the extension's properties, permissions, and components.
*   `background.js`: Handles the extension's enable/disable state, toolbar icon clicks, and badge text updates.
*   `content.js`: Injected into web pages to detect fonts on hover, handle clicks on text elements, and display the font information tooltip and the detailed floating panel.
*   `styles.css`: Contains the CSS rules for styling the on-page tooltip and the floating font information panel.
*   `popup.html` & `popup.js`: (Currently unused for the main toggle functionality but kept for potential future use or alternative UI). The `default_popup` in `manifest.json` has been removed so clicking the action button toggles the extension.
*   `icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`: Icons for the extension at various sizes.
*   `README.md`: This file.

---

This extension is designed to respect user privacy and only interacts with font information available through standard web browser APIs.
>>>>>>> 8258263 (Initial release of Fontify)
