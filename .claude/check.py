"""網站一致性檢查。

12 個頁面各自手寫 nav 與 footer，最容易出的錯是改了一頁忘了改其他頁。
改完內容跑一次：

    python3 .claude/check.py

檢查項目：
  1. 所有本地連結指向存在的檔案
  2. 每頁 nav 恰好 6 項；內頁恰好一個 is-current，首頁 0 個
  3. 語言切換指向對應的另一語言版本（不是首頁）
  4. hreflang alternate 成對且正確
  5. <html lang> 與檔名相符
  6. 中文全形字之間沒有換行造成的多餘空格（Chrome 不會移除它）
  7. 每頁都有 <head> 裡的 .js 啟動腳本，且 style.css 的 .reveal 隱藏規則
     只在 .js 之下生效 —— 否則 JS 一失效整頁就變空白
"""

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

PAGES = [
    'index.html', 'about.html', 'research.html',
    'publications.html', 'teaching.html', 'contact.html',
    'index-en.html', 'about-en.html', 'research-en.html',
    'publications-en.html', 'teaching-en.html', 'contact-en.html',
]

def counterpart(page):
    if page.endswith('-en.html'):
        return page.replace('-en.html', '.html')
    return page.replace('.html', '-en.html')

# 全形字（含全形標點）之間的空白
CJK = r'[　-〿㐀-鿿＀-￯]'
CJK_SPACE = re.compile(CJK + r'\s+' + CJK)

errors = []
warnings = []

for page in PAGES:
    if not os.path.exists(page):
        errors.append(f'{page}: 檔案不存在')
        continue

    html = open(page, encoding='utf-8').read()

    # 1. 本地連結
    for m in re.finditer(r'href="([^"]+)"', html):
        href = m.group(1)
        if href.startswith(('http', 'mailto:', '#')):
            continue
        target = href.split('#')[0]
        if target and not os.path.exists(target):
            errors.append(f'{page}: 連結指向不存在的檔案 -> {href}')

    # 2. nav 結構
    nav_match = re.search(r'<ul class="navlinks".*?</ul>', html, re.S)
    if not nav_match:
        errors.append(f'{page}: 找不到 navlinks')
        continue
    items = re.findall(r'<li><a href="([^"]+)"([^>]*)>', nav_match.group(0))

    if len(items) != 6:
        errors.append(f'{page}: nav 有 {len(items)} 項，應為 6')

    current = [h for h, attrs in items if 'is-current' in attrs]
    expected = 0 if page.startswith('index') else 1
    if len(current) != expected:
        errors.append(f'{page}: is-current 有 {len(current)} 個，應為 {expected}')

    # 3. 語言切換
    lang_links = [h for h, attrs in items if 'class="lang"' in attrs]
    if len(lang_links) != 1:
        errors.append(f'{page}: 語言切換連結有 {len(lang_links)} 個，應為 1')
    elif lang_links[0] != counterpart(page):
        errors.append(
            f'{page}: 語言切換指向 {lang_links[0]}，應為 {counterpart(page)}')

    # 4. hreflang
    alts = dict(re.findall(r'hreflang="([^"]+)" href="([^"]+)"', html))
    zh = page if not page.endswith('-en.html') else counterpart(page)
    en = counterpart(page) if not page.endswith('-en.html') else page
    if alts.get('zh-Hant') != zh or alts.get('en') != en:
        errors.append(f'{page}: hreflang 不正確 -> {alts}')

    # 5. html lang
    lang = re.search(r'<html lang="([^"]+)"', html).group(1)
    want = 'en' if page.endswith('-en.html') else 'zh-Hant'
    if lang != want:
        errors.append(f'{page}: <html lang="{lang}">，應為 "{want}"')

    # 6. 全形字之間的換行
    body = re.sub(r'<(script|style|head)[^>]*>.*?</\1>', '', html, flags=re.S)
    for node in re.split(r'<[^>]+>', body):
        hit = CJK_SPACE.search(node)
        if hit:
            warnings.append(
                f'{page}: 全形字之間有空白 {hit.group(0)!r} … {node.strip()[:26]!r}')

    # 7. .js 啟動腳本必須存在，且必須在 <head> 裡（放 body 尾端會先閃一下內容）
    head = re.search(r'<head>(.*?)</head>', html, re.S)
    if not head or "classList.add('js')" not in head.group(1):
        errors.append(f'{page}: <head> 缺少 .js 啟動腳本 —— JS 失效時整頁會空白')
    if 'reveal-ready' not in html:
        errors.append(f'{page}: 啟動腳本缺少 reveal-ready 保險絲')

# 8. CSS：.reveal 的 opacity:0 必須被 .js 前綴包住
css = open('assets/css/style.css', encoding='utf-8').read()
for m in re.finditer(r'(^|\n)([^\n{}]*\.reveal[^\n{}]*)\{([^}]*)\}', css):
    selector, block = m.group(2).strip(), m.group(3)
    if 'opacity: 0' in block or 'opacity:0' in block:
        if not selector.startswith('.js '):
            errors.append(
                f'style.css: `{selector}` 把 .reveal 設成 opacity:0 但沒有 .js 前綴 '
                '—— JS 失效時內容會永遠隱形')

# 9. main.js 必須在所有路徑標上 reveal-ready 或移除 .js
js = open('assets/js/main.js', encoding='utf-8').read()
if 'reveal-ready' not in js:
    errors.append('main.js: 沒有標記 reveal-ready，保險絲會誤觸發（動畫永遠不會跑）')

for w in warnings:
    print(f'  ⚠  {w}')
for e in errors:
    print(f'  ✗  {e}')

if errors:
    print(f'\n{len(errors)} 項錯誤。')
    sys.exit(1)

print(f'\n{len(PAGES)} 頁全部通過'
      + (f'（{len(warnings)} 項警告）' if warnings else '。'))
