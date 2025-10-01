const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

function loadFiles() {
  const repoRoot = path.join(__dirname, '..', '..');
  const html = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');
  const cssFiles = ['setting.css', 'style.css'];
  const css = cssFiles.map(f => {
    try { return fs.readFileSync(path.join(repoRoot, f), 'utf8'); } catch(e) { return ''; }
  }).join('\n');
  return { html, css };
}

function runTests() {
  const { html, css } = loadFiles();

  const dom = new JSDOM(html, { runScripts: 'dangerously' });
  const document = dom.window.document;

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const win = dom.window;

  const results = [];

  const body = document.querySelector('body');
  const bodyStyle = win.getComputedStyle(body);
  results.push({ name: 'body color', pass: rgbToHex(bodyStyle.color) === '#7f8c8d', actual: bodyStyle.color });
  results.push({ name: 'body font-size', pass: bodyStyle.fontSize === '12px', actual: bodyStyle.fontSize });

  const selected = Array.from(document.querySelectorAll('.selected'));
  const selPass = selected.length > 0 && selected.every(el => rgbToHex(win.getComputedStyle(el).color) === '#e74c3c');
  results.push({ name: '.selected color', pass: selPass, actual: selected.map(el => win.getComputedStyle(el).color) });

  const spans = Array.from(document.querySelectorAll('p.selected span'));
  const spanPass = spans.length > 0 && spans.every(el => rgbToHex(win.getComputedStyle(el).color) === '#3498db');
  results.push({ name: 'p.selected > span color', pass: spanPass, actual: spans.map(el => win.getComputedStyle(el).color) });

  let ok = true;
  console.log('\nAutograder results:');
  results.forEach(r => {
    if (r.pass) console.log(`✓ ${r.name}`);
    else { ok = false; console.log(`✗ ${r.name} — actual: ${Array.isArray(r.actual) ? JSON.stringify(r.actual) : r.actual}`); }
  });

  if (!ok) process.exitCode = 1;
}

function rgbToHex(rgb) {
  if (!rgb) return null;
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!m) return null;
  const r = parseInt(m[1],10), g = parseInt(m[2],10), b = parseInt(m[3],10);
  return '#' + [r,g,b].map(n => n.toString(16).padStart(2,'0')).join('');
}

runTests();
