# Fontify - Identify and download fonts

![Fontify Icon](icon128.png)

Fontify is a browser extension for Firefox and Chromium that helps you identify and find download sources for fonts you encounter on the web.

## Features

*   🔍 **Font Identification on Hover:** Simply hover your cursor over any text element on a webpage to see a tooltip displaying its font family, weight, and style.
*   🖱️📄 **On-Click Font Details & Downloads:** Click on any text element to open a floating panel. This panel shows detailed font information and provides direct links to download the font family from various trusted sources.
*   📚 **Multiple Font Sources:** Includes links to:
    *   Google Fonts
    *   Adobe Fonts
    *   DaFont
    *   CufonFonts
    *   Fontesk
*   💡 **Toggle On/Off:** Easily enable or disable the extension by clicking its icon in the browser toolbar. The icon badge will indicate its current state (ON/OFF).
*   🎯 **Context-Aware:** Intelligently ignores images and other non-text elements, only activating for actual text content.
*   ✨ **User-Friendly UI:** The floating panel appears conveniently next to your cursor and is designed for a smooth user experience.

## How to Use

1.  **Enable the Extension:** Click the Fontify icon in your browser toolbar. The badge should display "ON".
2.  **Hover to Identify:** Move your mouse cursor over any text on a webpage. A small tooltip will appear showing the font's basic information.
3.  **Click for Details & Downloads:** Click on the text. A panel will appear near your cursor, displaying:
    *   Full font details (family, weight, style, size).
    *   A list of websites where you can find and download the font family.
4.  **Disable the Extension:** Click the Fontify icon again. The badge will change to "OFF", and all font identification features will be deactivated.

## Installation

You can install Fontify in your browser by following these steps:

1.  **Download the Latest Release:**
    *   Go to the [Fontify GitHub Releases page](https://github.com/BeforeLights/Fontify/releases/latest).
    *   Download the `Fontify-vX.X.X.zip` file (e.g., `Fontify-v1.0.0.zip`) from the latest release assets.

2.  **Extract the ZIP File:**
    *   Unzip the downloaded file to a permanent location on your computer. You will get a folder named `Fontify` (or similar).

3.  **Load the Extension in Your Browser:** 

    #### 🦊 Firefox
    *  Open Firefox.
    *  Type `about:debugging` in the address bar and press Enter.
    *  Click on "This Firefox" in the sidebar.
    *  Click the "Load Temporary Add-on..." button.
    *  Navigate to the directory where you unzipped Fontify and select the `manifest.json` file within that folder.

    #### 🌐 Chromium-based Browsers (Chrome, Edge, Opera, Vivaldi, etc.)
    *  Open your Chromium-based browser.
    *  Go to `chrome://extensions/` (or the equivalent for your browser, e.g., `edge://extensions/` for Edge, `opera://extensions` for Opera).
    *  Enable "Developer mode". This is usually a toggle switch in the top-right corner of the extensions page.
    *  Click the "Load unpacked" button.
    *  Select the folder where you unzipped Fontify.

The Fontify icon should now appear in your browser toolbar!

### 🛠️ For Development & Testing (from source code)

If you want to install Fontify from the source code for development or testing purposes, follow these steps:

1.  **Clone or Download the Repository:**
    *   Clone this repository to your local machine using Git, or download it as a ZIP file and extract it.

2.  **Open the Extension Management Page in Your Browser:**
    *   For Firefox, go to `about:debugging` > "This Firefox".
    *   For Chromium-based browsers, go to `chrome://extensions/`.

3.  **Enable Developer Mode:**
    *   In Firefox, check "Enable add-on debugging".
    *   In Chrome, toggle "Developer mode" on (usually in the top-right corner).

4.  **Load the Unpacked Extension:**
    *   Click "Load Temporary Add-on..." in Firefox or "Load unpacked" in Chrome.
    *   Select the `manifest.json` file or the folder containing the unpacked extension files.

5.  **Test the Extension:**
    *   The Fontify icon should appear in your browser toolbar. Test the extension by hovering over text and clicking to see font details.

6.  **Disable or Remove the Extension:**
    *   To disable, click the Fontify icon and toggle it off. To remove, go to the extension management page and uninstall it.

---

This extension is designed to respect user privacy and only interacts with font information available through standard web browser APIs.
