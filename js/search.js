document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('search-input');
  const button = document.getElementById('search-button');
  const resultContainer = document.getElementById('result-container');
  const resultCount = document.getElementById('result-count');

  const performSearch = () => {
    const query = input.value.trim().toLowerCase();
    if (!query) return;

    const results = [];
    searchData.posts.forEach(post => {
      const titleMatch = post.title.toLowerCase().includes(query);
      const contentMatch = post.content.toLowerCase().includes(query);
      if (titleMatch || contentMatch) {
        results.push({
          ...post,
          score: (titleMatch ? 2 : 0) + (contentMatch ? 1 : 0)
        });
      }
    });

    results.sort((a, b) => b.score - a.score);
    displayResults(results);
  };

  const displayResults = (results) => {
    resultCount.textContent = results.length;
    resultContainer.innerHTML = results.map(result => `
      <div class="search-result">
        <h3><a href="${result.url}">${result.title}</a></h3>
        <div class="search-snippet">${getSnippet(result.content, input.value)}</div>
        <div class="search-meta">${result.date}</div>
      </div>
    `).join('');
  };

  const getSnippet = (content, query) => {
    const index = content.toLowerCase().indexOf(query.toLowerCase());
    const start = Math.max(0, index - 20);
    const end = Math.min(content.length, index + query.length + 80);
    let snippet = content.substring(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';
    return snippet.replace(new RegExp(query, 'gi'), match => `<mark>${match}</mark>`);
  };

  button.addEventListener('click', performSearch);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
  });
});