;(() => {
  const input = document.getElementById("local-search-input")
  const resultContainer = document.getElementById("local-search-result")
  const clearBtn = document.getElementById("search-clear-btn")
  const searchPath = "/search.xml"
  let searchData = []

  // 天蓝色主题的高亮颜色
  const colors = ["#87ceeb", "#4a90e2", "#5dade2", "#85c1e9", "#aed6f1"]
  const randomColor = () => colors[Math.floor(Math.random() * colors.length)]

  // 高亮匹配词
  const highlight = (text, keyword) => {
    const regex = new RegExp(`(${keyword})`, "gi")
    return text.replace(regex, `<span class="search-keyword" style="background:${randomColor()}">$1</span>`)
  }

  // 防抖函数
  const debounce = (func, delay) => {
    let timer
    return function (...args) {
      clearTimeout(timer)
      timer = setTimeout(() => func.apply(this, args), delay)
    }
  }

  // 汉字转拼音 (简单首字母匹配)
  const toPinyin = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")

  // 加载 search.xml
  fetch(searchPath)
    .then((response) => {
      if (!response.ok) {
        throw new Error("搜索数据加载失败")
      }
      return response.text()
    })
    .then((str) => new window.DOMParser().parseFromString(str, "text/xml"))
    .then((data) => {
      const entries = data.getElementsByTagName("entry")
      if (entries.length === 0) {
        console.warn("搜索数据为空")
        return
      }

      searchData = Array.from(entries)
        .map((entry) => {
          const titleEl = entry.getElementsByTagName("title")[0]
          const urlEl = entry.getElementsByTagName("url")[0]
          const contentEl = entry.getElementsByTagName("content")[0]

          return {
            title: titleEl ? titleEl.textContent : "",
            url: urlEl ? urlEl.textContent : "",
            content: contentEl ? contentEl.textContent : "",
          }
        })
        .filter((item) => item.title && item.url) // 过滤掉无效数据

      console.log(`已加载 ${searchData.length} 条搜索数据`)
    })
    .catch((error) => {
      console.error("搜索数据加载错误:", error)
      // 可以在这里添加用户友好的错误提示
    })

  // 清空按钮事件
  clearBtn.addEventListener("click", () => {
    input.value = ""
    resultContainer.innerHTML = ""
    clearBtn.style.display = "none"
    input.focus() // 重新聚焦到输入框
  })

  // 搜索函数
  const doSearch = () => {
    const keyword = input.value.trim().toLowerCase()

    // 清空结果
    resultContainer.innerHTML = ""

    if (!keyword) {
      clearBtn.style.display = "none"
      return
    }

    // 显示清空按钮
    clearBtn.style.display = "block"

    // 检查搜索数据是否已加载
    if (searchData.length === 0) {
      resultContainer.innerHTML = "<p>搜索数据加载中，请稍后再试...</p>"
      return
    }

    const keywords = keyword.split(/\s+/).filter((kw) => kw.length > 0)
    const results = []

    searchData.forEach((item) => {
      const title = item.title.toLowerCase()
      const content = item.content.toLowerCase()
      const titlePinyin = toPinyin(title)
      const contentPinyin = toPinyin(content)
      let score = 0

      keywords.forEach((kw) => {
        // 标题匹配权重更高
        if (title.includes(kw) || titlePinyin.includes(kw)) score += 5
        // 内容匹配
        if (content.includes(kw) || contentPinyin.includes(kw)) score += 1
        // 完全匹配额外加分
        if (title === kw || content.includes(kw)) score += 2
      })

      if (score > 0) {
        let displayTitle = item.title
        let displayContent = item.content.substring(0, 150)

        // 高亮关键词
        keywords.forEach((kw) => {
          displayTitle = highlight(displayTitle, kw)
          displayContent = highlight(displayContent, kw)
        })

        results.push({
          score,
          title: displayTitle,
          url: item.url,
          content: displayContent,
        })
      }
    })

    // 显示结果
    if (results.length === 0) {
      resultContainer.innerHTML = "<p>没有找到捏 😔</p>"
      return
    }

    // 按分数排序
    results.sort((a, b) => b.score - a.score)

    // 限制显示结果数量
    const maxResults = 10
    const displayResults = results.slice(0, maxResults)

    const html = displayResults
      .map(
        (r) => `
      <div class="search-item">
        <a href="${r.url}"><h3>${r.title}</h3></a>
        <p>${r.content}${r.content.length >= 150 ? "..." : ""}</p>
      </div>
    `,
      )
      .join("")

    resultContainer.innerHTML = html

    // 如果结果被截断，显示提示
    if (results.length > maxResults) {
      resultContainer.innerHTML += `<p style="text-align: center; color: #4a90e2; font-size: 12px; padding: 10px;">显示前 ${maxResults} 条结果，共找到 ${results.length} 条</p>`
    }
  }

  // 输入事件监听
  input.addEventListener("input", debounce(doSearch, 300))

  // 回车键搜索
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      doSearch()
    }
  })

  // 点击搜索按钮
  const searchButtons = document.querySelectorAll(".search-btn")
  searchButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault()
      if (input.value.trim()) {
        doSearch()
      } else {
        input.focus()
      }
    })
  })

  // 点击页面其他地方隐藏搜索结果
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-container")) {
      // 可以选择是否隐藏结果，这里注释掉以保持结果可见
      // resultContainer.innerHTML = '';
      // clearBtn.style.display = 'none';
    }
  })
})()
