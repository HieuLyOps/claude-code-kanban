const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('fs');
const path = require('path');
const vm = require('vm');

const src = readFileSync(path.join(__dirname, '..', 'public/app.js'), 'utf8');
const grab = (re) => re.exec(src)?.[0] ?? '';

function loadEmptyState() {
  const context = vm.createContext({});
  vm.runInContext(
    [
      grab(/^const HTML_ESCAPES = .*$/m),
      grab(/^function escapeHtml\(text\) \{[\s\S]*?^\}/m),
      grab(/^function sessionsEmptyHtml\([^)]*\) \{[\s\S]*?^\}/m),
    ].join('\n'),
    context,
  );
  return context.sessionsEmptyHtml;
}

describe('sessionsEmptyHtml', () => {
  // `?search=` comes straight from the URL, so any page can navigate here with markup in it.
  it('renders a search query from the URL as text, not markup', () => {
    const html = loadEmptyState()({ searchQuery: '<img src=x onerror=alert(1)>' });
    assert.ok(!html.includes('<img'), html);
    assert.ok(html.includes('No results for &quot;&lt;img src=x onerror=alert(1)&gt;&quot;'), html);
  });

  it('keeps the default message when nothing narrows the list', () => {
    const html = loadEmptyState()({});
    assert.ok(html.includes('<p>No sessions found</p>'), html);
  });
});
