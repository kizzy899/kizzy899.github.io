(function() {
  const input = document.getElementById('local-search-input');
  const resultContainer = document.getElementById('local-search-result');
  const clearBtn = document.getElementById('search-clear-btn');
  const searchPath = '/search.xml';
  let searchData = [];

  // 随机高亮颜色
  const colors = ['#ffeb3b', '#ff5722', '#8bc34a', '#03a9f4', '#e91e63'];
  const randomColor = () => colors[Math.floor(Math.random() * colors.length)];

  // 高亮匹配词
  const highlight = (text, keyword) => {
    const regex = new RegExp(`(${keyword})`, 'gi');
    return text.replace(regex, `<span class="search-keyword" style="background:${randomColor()}">$1</span>`);
  };

  // 防抖函数
  const debounce = (func, delay) => {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => func.apply(this, args), delay);
    };
  };

  // 汉字转拼音 (简单首字母匹配)
  const toPinyin = str => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 加载 search.xml
  fetch(searchPath)
    .then(response => response.text())
    .then(str => (new window.DOMParser()).parseFromString(str, 'text/xml'))
    .then(data => {
      searchData = Array.from(data.getElementsByTagName('entry')).map(entry => ({
        title: entry.getElementsByTagName('title')[0].textContent,
        url: entry.getElementsByTagName('url')[0].textContent,
        content: entry.getElementsByTagName('content')[0].textContent
      }));
    });

  // 清空按钮
  clearBtn.addEventListener('click', () => {
    input.value = '';
    resultContainer.innerHTML = '';
    clearBtn.style.display = 'none';
  });

  const doSearch = () => {
    const keyword = input.value.trim().toLowerCase();
    resultContainer.innerHTML = '';

    if (!keyword) {
      clearBtn.style.display = 'none';
      return;
    }
    clearBtn.style.display = 'block';

    const keywords = keyword.split(/\s+/);
    const results = [];

    searchData.forEach(item => {
      let title = item.title.toLowerCase();
      let content = item.content.toLowerCase();
      let titlePinyin = toPinyin(title);
      let contentPinyin = toPinyin(content);
      let score = 0;

      keywords.forEach(kw => {
        if (title.includes(kw) || titlePinyin.includes(kw)) score += 5;
        if (content.includes(kw) || contentPinyin.includes(kw)) score += 1;
      });

      if (score > 0) {
        let displayTitle = item.title;
        let displayContent = item.content.substring(0, 150);

        keywords.forEach(kw => {
          displayTitle = highlight(displayTitle, kw);
          displayContent = highlight(displayContent, kw);
        });

        results.push({
          score,
          title: displayTitle,
          url: item.url,
          content: displayContent
        });
      }
    });

    if (results.length === 0) {
      resultContainer.innerHTML = '<p>没有找到捏</p>';
      return;
    }

    results.sort((a, b) => b.score - a.score);

    const html = results.map(r => `
      <div class="search-item">
        <a href="${r.url}"><h3>${r.title}</h3></a>
        <p>${r.content}...</p>
      </div>
    `).join('');

    resultContainer.innerHTML = html;
  };

  input.addEventListener('input', debounce(doSearch, 300));
})();
