# Xarvis AI — Local Setup

## 📁 Folder Structure
```
xarvis-ai/
├── index.html          ← Landing page (splash + marketing)
├── app.html            ← AI chat dashboard
├── css/
│   └── style.css       ← All styles for app.html
└── js/
    ├── config.js       ← 🔑 YOUR API KEY LIVES HERE
    ├── gemini.js       ← Gemini API engine
    └── app.js          ← All app logic
```

## 🚀 How to Run
1. Copy the entire `xarvis-ai/` folder to your PC
2. Open `index.html` in Chrome — done!

## 🔑 Updating Your API Key
Open `js/config.js` and replace the key value:
```js
GEMINI_API_KEY: "YOUR_NEW_KEY_HERE",
```

Get a free key at: https://aistudio.google.com/app/apikey

## ⚠️ IMPORTANT
- NEVER share your API key publicly
- Rotate your key at aistudio.google.com if you ever leak it
