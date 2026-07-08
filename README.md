# 黃芳誼 個人網站

東吳大學社會學系副教授黃芳誼的個人網站。純靜態 HTML／CSS／JS，沒有建置流程，沒有相依套件。

## 檔案

六個頁面，中英文各一套，共 12 個 HTML 檔。

| 中文 | 英文 | 內容 |
|---|---|---|
| `index.html` | `index-en.html` | 首頁：hero + 四張章節卡 + 數字帶 |
| `about.html` | `about-en.html` | 學歷、學術任職、行政職務、研究經歷、獎項、學術服務 |
| `research.html` | `research-en.html` | 研究興趣、研究計畫、研討會發表、受邀演講 |
| `publications.html` | `publications-en.html` | 期刊論文、專書與專章 |
| `teaching.html` | `teaching-en.html` | 三個機構的授課紀錄 |
| `contact.html` | `contact-en.html` | 聯絡方式、學術聯繫 |

```
assets/css/style.css
assets/js/main.js      導覽列、行動選單、捲動揭露
images/                照片（放進去就會自動顯示，見 images/README.md）
```

中英文頁面**成對切換**：中文研究頁的 `EN` 直接跳到 `research-en.html`，不是回首頁。新增頁面時記得同時更新三處 —— nav 的 `.lang` 連結、`<link rel="alternate" hreflang>`、以及所有頁面 nav 裡的新項目。

> 12 份手寫的 nav/footer 很容易改到不一致。改完跑一次檢查（見下方「驗證」）。

## 本機預覽

```bash
python3 .claude/serve.py     # http://127.0.0.1:4173
```

## 驗證

改完內容跑一次，會檢查連結、nav 一致性、語言切換配對、hreflang，以及中文的多餘空格：

```bash
python3 .claude/check.py
```

不要用 `python3 -m http.server`：它的 `__main__` 會在 argparse 建立預設值時呼叫 `os.getcwd()`，在受限環境下會直接噴 `PermissionError`。

## 改內容時要注意的兩件事

**1. 中文段落請寫成單行。**

Chrome 不會移除兩個全形字之間的換行，會把它算成一個半形空格。所以這樣寫會多出空白：

```html
<!-- ✗ 「秘書長，」和「並擔任」之間會多一個空格 -->
<p>現為 IPSA 第 25 研究委員會秘書長，
   並擔任期刊 Health Politics 副主編。</p>

<!-- ✓ -->
<p>現為 IPSA 第 25 研究委員會秘書長，並擔任期刊 <em>Health Politics</em> 副主編。</p>
```

（全形字接拉丁字母時，換行變成的空格反而是想要的，可以保留。）

**2. 刊名格式。** 拉丁文刊名用 `<em>` 斜體；中文刊名用《》，不加斜體。

**3. 英文頁的字距。** 全站 `letter-spacing` 是為中文方塊字調的。英文頁靠 `html[lang="en"]` 選擇器整組收緊 —— 新增英文頁時 `<html lang="en">` 不能漏。

## 部署到 GitHub Pages

推上 GitHub 後，到 repo 的 Settings → Pages，Source 選 `Deploy from a branch`，branch 選 `main` / `(root)`。

若想用 `你的帳號.github.io` 這個網址，repo 名稱必須正好是 `你的帳號.github.io`。

## 還沒做的

- 照片（目前是漸層佔位色塊，不影響版面）。把檔案放進 `images/` 即可，見 [images/README.md](images/README.md)。
