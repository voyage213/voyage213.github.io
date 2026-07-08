# 黃芳誼 個人網站

東吳大學社會學系副教授黃芳誼的個人網站。純靜態 HTML／CSS／JS，沒有建置流程，沒有相依套件。

## 檔案

```
index.html             中文首頁（Hero、簡介、研究、著作、教學、聯絡）
publications.html      中文著作與經歷
index-en.html          英文首頁
publications-en.html   英文著作與經歷
assets/css/style.css
assets/js/main.js      導覽列、行動選單、捲動揭露
images/                照片（放進去就會自動顯示，見 images/README.md）
```

中英文頁面**成對切換**：中文著作頁的 `EN` 直接跳到英文著作頁，不是回首頁。新增頁面時記得同時更新 `.lang` 連結與 `<link rel="alternate" hreflang>`。

## 本機預覽

```bash
python3 .claude/serve.py     # http://127.0.0.1:4173
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
