MATH QUEST — IPAD WEB APP

Files:
- index.html       Game and adaptive learning logic
- manifest.json    Makes it installable as a web app
- sw.js            Enables offline reuse after first load
- icon-192.png / icon-512.png  Home-screen icons

Recommended publishing method: GitHub Pages
1. Create a GitHub repository (for example: math-quest).
2. Upload all files in this folder to the repository root.
3. In GitHub: Settings > Pages > Deploy from a branch.
4. Choose your main branch and /(root), then Save.
5. Open the published URL in Safari on the iPad.
6. Tap Share > More > Add to Home Screen.
7. Turn on "Open as Web App" and tap Add.

Notes:
- No account or backend is required.
- Progress is stored locally on the iPad browser using localStorage.
- The game works offline after it has been opened once and cached.


V2 learning levels:
- Level 1: two-digit +/- one-digit, answer stays two-digit (10-20).
- Level 2: crossing-ten subtraction to a single-digit answer; inverse addition facts included because positive two-digit + positive one-digit cannot yield a single-digit answer.
- Level 3: three-number mixed +/- expressions, results kept within 0-20.
