const fs = require('fs');
const path = require('path');
const sitemapPath = path.join(__dirname, 'sitemap.xml');
const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
let content = fs.readFileSync(sitemapPath, 'utf8');
content = content.replace(/<lastmod>.*?<\/lastmod>/g, `<lastmod>${today}</lastmod>`);
fs.writeFileSync(sitemapPath, content, 'utf8');
console.log('Sitemap dates updated to', today);
