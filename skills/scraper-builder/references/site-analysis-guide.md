# 网站分析指南

构建爬虫前分析任意网站的分步操作手册。此阶段至关重要：现在投入时间可以避免之后花数小时调试脆弱的选择器。

---

## 目录

- [步骤 1：初次获取页面](#步骤-1初次获取页面)
- [步骤 2：内容渲染检测](#步骤-2内容渲染检测)
- [步骤 3：发现隐藏 API](#步骤-3发现隐藏-api)
- [步骤 4：选择器策略](#步骤-4选择器策略)
- [步骤 5：分页分析](#第-5-步分页分析)
- [步骤 6：反机器人评估](#第-6-步反爬机制评估)
- [步骤 7：最终决策矩阵](#第-7-步最终决策矩阵)

---

## 步骤 1：初次获取页面

首先通过网络解锁器获取目标页面，以获得服务器返回的原始 HTML。

```python
import requests
import os

API_KEY = os.environ["BRIGHTDATA_API_KEY"]
ZONE = os.environ["BRIGHTDATA_UNLOCKER_ZONE"]

# Fetch raw HTML
response = requests.post(
    "https://api.brightdata.com/request",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={"zone": ZONE, "url": TARGET_URL, "format": "raw"}
)
html = response.text

# Also fetch as markdown for a quick readable overview
md_response = requests.post(
    "https://api.brightdata.com/request",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={"zone": ZONE, "url": TARGET_URL, "format": "raw", "data_format": "markdown"}
)
markdown = md_response.text
```

**需要在原始 HTML 中查找的内容：**
- 实际内容（产品名称、价格、文本）是否存在于 HTML 中？
- 还是 HTML 基本只有等待 JavaScript 填充的空容器？

---

## 步骤 2：内容渲染检测

确定网站是在服务器端渲染内容（SSR），还是在客户端渲染内容（CSR）。

### 服务器端渲染的迹象（使用网络解锁器即可）
- 你需要的数据直接出现在原始 HTML 中
- 源代码中可以看到产品名称、价格和描述
- HTML 包含带有结构化数据的 `<meta>` 标签（SEO 做得好的网站通常如此）
- JSON-LD 块（`<script type="application/ld+json">`）包含结构化产品/文章数据

### 客户端渲染的迹象（需要浏览器 API）
- HTML body 基本为空：`<div id="root"></div>` 或 `<div id="__next"></div>`
- 引用了大型 JavaScript 包，但 HTML 中没有内容
- 框架标记：`ng-app`、`data-reactroot`、`data-v-`（Vue）、`__NUXT__`
- HTML 包含加载骨架或占位文本

### 混合模式 / SSR + Hydration
许多现代网站（Next.js、Nuxt）采用 SSR + 客户端 hydration。初始 HTML 中包含内容（因此网络解锁器有效），但页面也会加载 JS 以实现交互。对于这类网站，网络解锁器是正确选择：无需承担浏览器开销即可获取数据。

**确认方法：** 如果原始 HTML 中存在数据，同时也能看到框架脚本，则它使用了带 hydration 的 SSR。使用网络解锁器即可。

### JSON-LD 提取（隐藏的宝藏）

许多电商和内容网站会嵌入 JSON-LD 格式的结构化数据，以用于 SEO。这通常是最干净的数据来源：已经结构化，无需解析选择器。

```python
from bs4 import BeautifulSoup
import json

soup = BeautifulSoup(html, "html.parser")
for script in soup.select('script[type="application/ld+json"]'):
    try:
        data = json.loads(script.string)
        print(json.dumps(data, indent=2))
    except (json.JSONDecodeError, TypeError):
        continue
```

常见的 JSON-LD 类型包括：
- `Product`：名称、价格、描述、图片、品牌、库存状态、评价
- `Article` / `NewsArticle`：标题、作者、datePublished、描述
- `Organization`：名称、地址、电话、社交资料
- `BreadcrumbList`：导航路径（适用于分类/层级结构）
- `ItemList`：列表页中的条目集合

---

## 步骤 3：发现隐藏 API

许多现代网站通过内部 API 获取数据。找到并直接使用这些端点通常是最简洁的方法：可以获得结构化 JSON，而无需解析 HTML。

### 在 HTML 中查找的位置

1. **`__NEXT_DATA__`（Next.js 网站）：**
   ```python
   next_data_script = soup.select_one('script#__NEXT_DATA__')
   if next_data_script:
       data = json.loads(next_data_script.string)
       # The page's props are in data["props"]["pageProps"]
       page_data = data["props"]["pageProps"]
   ```

2. **`__NUXT__` 或 `window.__NUXT__`（Nuxt.js 网站）：** 在 HTML 中查找 `<script>window.__NUXT__=`。

3. **嵌入式状态对象：** 在 HTML 中搜索以下模式：
   - `window.__INITIAL_STATE__`
   - `window.__PRELOADED_STATE__`
   - `window.__APP_STATE__`
   - `window.__data`

4. **脚本包中的 API URL：** 在 HTML 中搜索 `"/api/"`、`"graphql"` 或网站 API 子域名等模式。

### 使用网络解锁器直接访问 API

找到 API 端点后，请直接获取它：这比解析 HTML 更快且成本更低：

```python
# Example: hitting a discovered API endpoint
api_data = requests.post(
    "https://api.brightdata.com/request",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={
        "zone": ZONE,
        "url": "https://target-site.com/api/products?category=electronics&page=1",
        "format": "raw"
    }
)
products = json.loads(api_data.text)
```

---

## 步骤 4：选择器策略

需要解析 HTML 时，选择正确的选择器是确保爬虫长期稳定运行的最重要决策。

### 选择器可靠性排名（最佳 → 最差）

1. **数据属性**：`[data-testid="product-price"]`、`[data-product-id]`
   - 专为测试/自动化而创建
   - 能经受视觉设计改版
   - 在重构中很少发生变化

2. **语义数据属性**：`[data-price]`、`[data-sku]`、`[itemprop="price"]`
   - 承载与业务数据相关的语义
   - `itemprop` 属性是 Schema.org 微数据，非常稳定

3. **Aria/role 属性**：`[role="listitem"]`、`[aria-label="Price"]`
   - 无障碍属性非常稳定（删除它们会导致屏幕阅读器无法正常工作）

4. **特定类名**：`.product-card`、`.price-amount`
   - 当类名具有语义时很实用（描述内容而非样式）
   - 使用 CSS-in-JS 时可靠性较低（例如，`.css-1a2b3c` 在每次构建时都会变化）

5. **ID 选择器**：`#product-details`、`#price-section`
   - 具有唯一性，但许多现代框架不使用 ID
   - 通常自动生成且不稳定

6. **结构选择器**：`div > span:nth-child(2)`、`table tr td:last-child`
   - 最脆弱：添加或删除任何元素都可能导致其失效
   - 仅将其作为最后手段，并添加防御性检查

### 识别 CSS-in-JS（不可靠的类名）

如果看到以下类型的类名，请勿依赖它们：
- `css-1a2b3c`、`sc-bZQynM`、`jss123`（CSS Modules / styled-components / JSS）
- `_1Fk2e`、`_3xM2T`（带哈希值的 CSS Modules）
- 单字符或看起来随机的名称

应改为查找：
- 具有语义类名的父元素
- 相同或附近元素上的数据属性
- 文本内容匹配（通过元素的可见文本查找元素）

### 构建稳健的选择器

```python
from bs4 import BeautifulSoup

soup = BeautifulSoup(html, "html.parser")

# GOOD: Data attribute
price = soup.select_one('[data-testid="product-price"]')

# GOOD: Schema.org microdata
price = soup.select_one('[itemprop="price"]')

# GOOD: Semantic class with parent context
price = soup.select_one('.product-details .price')

# OK: Class name that looks semantic
price = soup.select_one('.product-price')

# BAD: Structural selector (fragile)
price = soup.select_one('.product-card > div:nth-child(3) > span')

# BAD: CSS-in-JS class (will break on next deploy)
price = soup.select_one('.css-1xk2y3z')
```

### 防御性提取模式

始终单独封装每个字段的提取逻辑，避免某个字段缺失导致爬虫崩溃：

```python
def safe_text(element, selector: str, default: str = "") -> str:
    """Safely extract text from a child element."""
    el = element.select_one(selector)
    return el.get_text(strip=True) if el else default

def safe_attr(element, selector: str, attr: str, default: str = "") -> str:
    """Safely extract an attribute from a child element."""
    el = element.select_one(selector)
    return el.get(attr, default) if el else default

# Usage
for card in soup.select(".product-card"):
    product = {
        "name": safe_text(card, ".product-title"),
        "price": safe_text(card, ".product-price"),
        "image": safe_attr(card, "img", "src"),
        "url": safe_attr(card, "a", "href"),
    }
```

---

## 第 5 步：分页分析

查看页面，了解分页的工作方式。

### 需要查找的内容

1. <strong>URL 参数：</strong>检查 URL 是否随页码变化：
   - `?page=2`、`?p=2`：页码分页
   - `?offset=20`、`?skip=20`：基于偏移量
   - `?cursor=abc123`：基于游标（常见于 API）
   - `?start=20`：基于起始索引

2. **HTML 分页控件：**
   ```python
   # Look for pagination elements
   pagination = soup.select_one('.pagination, .pager, nav[aria-label*="pagination"]')
   if pagination:
       links = pagination.select('a')
       for link in links:
           print(link.get_text(strip=True), link.get('href'))
   ```

3. <strong>“加载更多”按钮：</strong>页面上有一个用于获取更多项目的按钮，这通常意味着你可以直接复现相应的 API 调用，或者需要使用浏览器 API 点击该按钮。

4. <strong>无限滚动：</strong>完全没有分页控件；内容会在滚动时加载。检查：
   - 脚本中的 `IntersectionObserver` 模式
   - 滚动事件的事件监听器
   - 页面最初是否只显示部分项目

5. <strong>总数指示器：</strong>查找“正在显示第 1-20 条，共 1,234 条结果”之类的文本，这能告诉你总页数和当前位置。

### 分页决策

| 观察到的情况 | 策略 |
|-------------|----------|
| URL 随 `?page=N` 变化 | 使用网络解锁器遍历 URL |
| HTML 中有“下一页”链接 | 使用网络解锁器跟随链接 |
| “加载更多”按钮会触发 API 调用 | 使用网络解锁器直接调用 API |
| “加载更多”按钮没有可见 API | 浏览器 API：点击按钮 |
| 无限滚动 | 浏览器 API：滚动并采集 |
| 使用游标/令牌分页的 API | 直接调用 API，并传递游标 |

---

## 第 6 步：反爬机制评估

判断网站拦截爬虫的严格程度。

### 低级防护（网络解锁器可轻松处理）
- 标准网站、博客、新闻网站
- 具有基本速率限制的网站
- 向搜索引擎爬虫提供内容的网站

### 中级防护（网络解锁器通常可以处理）
- 具有机器人检测机制的电商网站
- 位于 Cloudflare、Akamai、PerimeterX 防护之后的网站
- 网络解锁器的自动绕过功能可以处理其中大多数情况

### 高级防护（可能需要浏览器 API）
- 需要执行 JavaScript 才能加载内容的网站
- 使用基于行为的机器人检测机制（鼠标移动、滚动模式）的网站
- 使用严格指纹识别的网站
- 需要破解多个验证码的网站

<strong>判断方法：</strong>如果网络解锁器返回完整内容，则说明它已足够。如果返回空白页面、拦截消息或 CAPTCHA 页面，请升级使用浏览器 API。

---

## 第 7 步：最终决策矩阵

完成分析后，使用以下矩阵：

| 内容是否在 HTML 中？ | 是否需要交互？ | 是否找到 API 端点？ | → 使用 |
|:-:|:-:|:-:|---|
| 是 | 否 | 否 | **网络解锁器** + HTML 解析 |
| 是 | 否 | 是 | **网络解锁器** → API 端点（首选） |
| 否 | 否 | 是 | **网络解锁器** → API 端点 |
| 否 | 否 | 否 | **浏览器 API**（需要 JS 渲染） |
| — | 是（点击/滚动） | 否 | **浏览器 API** |
| — | 是（无限滚动） | 是 | **网络解锁器** → API（复现滚动端点） |
| — | 是（无限滚动） | 否 | **浏览器 API** + 滚动自动化 |
