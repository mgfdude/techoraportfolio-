const fs = require('fs');
const path = require('path');

const BASE = __dirname;

// The canonical Organization schema block (used in index.html @graph)
const ORG_SCHEMA_GRAPH = `{
          "@type": "Organization",
          "@id": "https://techora.in/#organization",
          "name": "Techora",
          "url": "https://techora.in",
          "logo": "https://techora.in/images/logo/main_logo.png",
          "email": "techora2008@gmail.com",
          "telephone": "+919544181503",
          "foundingDate": "2024",
          "description": "Techora is a digital services company founded by Rythnverse, offering website design, WhatsApp automation, QR menus, and POS solutions in Kerala.",
          "sameAs": [
            "https://www.instagram.com/techora.inofficial",
            "https://www.linkedin.com/in/techora"
          ],
          "founder": {
            "@type": "Person",
            "@id": "https://techora.in/founder#rythnverse",
            "name": "Rythnverse",
            "jobTitle": "Founder & CEO",
            "worksFor": { "@id": "https://techora.in/#organization" },
            "sameAs": "https://www.instagram.com/ryhnverse"
          },
          "member": {
            "@type": "Person",
            "@id": "https://techora.in/founder#hanan",
            "name": "Hanan",
            "jobTitle": "Co-Founder",
            "worksFor": { "@id": "https://techora.in/#organization" },
            "sameAs": "https://www.instagram.com/h_anan._"
          }
        }`;

// The canonical Organization schema block (standalone, for about/other pages)
const ORG_SCHEMA_STANDALONE = `{
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://techora.in/#organization",
      "name": "Techora",
      "url": "https://techora.in",
      "logo": "https://techora.in/images/logo/main_logo.png",
      "email": "techora2008@gmail.com",
      "telephone": "+919544181503",
      "foundingDate": "2024",
      "description": "Techora is a digital services company founded by Rythnverse, offering website design, WhatsApp automation, QR menus, and POS solutions in Kerala.",
      "sameAs": [
        "https://www.instagram.com/techora.inofficial",
        "https://www.linkedin.com/in/techora"
      ],
      "founder": {
        "@type": "Person",
        "@id": "https://techora.in/founder#rythnverse",
        "name": "Rythnverse",
        "jobTitle": "Founder & CEO",
        "worksFor": { "@id": "https://techora.in/#organization" },
        "sameAs": "https://www.instagram.com/ryhnverse"
      },
      "member": {
        "@type": "Person",
        "@id": "https://techora.in/founder#hanan",
        "name": "Hanan",
        "jobTitle": "Co-Founder",
        "worksFor": { "@id": "https://techora.in/#organization" },
        "sameAs": "https://www.instagram.com/h_anan._"
      }
    }`;

// Collect all html files recursively
function getAllHtmlFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && file !== '.git' && file !== 'node_modules') {
      results = results.concat(getAllHtmlFiles(fullPath));
    } else if (file.endsWith('.html')) {
      results.push(fullPath);
    }
  });
  return results;
}

const htmlFiles = getAllHtmlFiles(BASE);
let modifiedFiles = [];

htmlFiles.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // ---- Fix: index.html uses @graph, so handle it differently ----
  const isIndex = filePath.endsWith('index.html') && !filePath.includes('blog') && !filePath.includes('services') && !filePath.includes('projects');

  if (isIndex) {
    // Replace the Organization block inside @graph
    const orgPattern = /\{\s*"@type"\s*:\s*"Organization"[\s\S]*?"founder"\s*:\s*\[[\s\S]*?\]\s*\}/;
    if (orgPattern.test(content)) {
      content = content.replace(orgPattern, ORG_SCHEMA_GRAPH.trim());
      modified = true;
      console.log('  [INDEX] Replaced @graph Organization schema');
    }
  }

  // ---- Fix: about.html standalone Organization schema ----
  const aboutOrgPattern = /"@type"\s*:\s*"AboutPage"[\s\S]*?"founder"\s*:\s*\[[\s\S]*?\]\s*\}\s*\}/;
  if (aboutOrgPattern.test(content)) {
    // Replace the entire standalone schema block
    const fullAboutSchema = /\{\s*"@context"\s*:\s*"https:\/\/schema\.org"\s*,\s*"@type"\s*:\s*"AboutPage"[\s\S]*?\}\s*\}/;
    content = content.replace(fullAboutSchema, `{
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "@id": "https://techora.in/about",
      "url": "https://techora.in/about",
      "name": "About Techora | Founder Rythnverse & Co-Founder Hanan",
      "description": "Learn about Techora, founded by Rythnverse (Founder & CEO), with Hanan serving as Co-Founder. Discover our journey from Cybermate to Techora.",
      "mainEntity": ${ORG_SCHEMA_STANDALONE}
    }`);
    modified = true;
    console.log('  [ABOUT] Replaced AboutPage schema');
  }

  // ---- Fix text: old "Raihan" references to "Rythnverse" ----
  // In meta descriptions and visible content
  if (content.includes('founders Raihan and Hanan')) {
    content = content.replace(/founders Raihan and Hanan/g, 'Founder &amp; CEO Rythnverse and Co-Founder Hanan');
    modified = true;
  }
  if (content.includes('founders Raihan and Hanan')) {
    content = content.replace(/founders Raihan and Hanan/g, 'Founder & CEO Rythnverse and Co-Founder Hanan');
    modified = true;
  }

  // Fix schema "name": "Raihan" -> "Rythnverse" in any remaining schema blocks
  if (/"name"\s*:\s*"Raihan"/.test(content)) {
    content = content.replace(/"name"\s*:\s*"Raihan"/g, '"name": "Rythnverse"');
    modified = true;
    console.log(`  [SCHEMA FIX] Replaced "Raihan" with "Rythnverse" in ${path.basename(filePath)}`);
  }
  
  // Fix alternateName: "ryhnverse" -> keep but ensure name is Rythnverse
  if (/"alternateName"\s*:\s*"ryhnverse"/.test(content)) {
    // This is fine, keep as-is (it's the IG handle)
  }

  // Fix "Hanan" as sole founder in schema arrays (replace old array pattern)
  const oldFounderArray = /"founder"\s*:\s*\[\s*\{[\s\S]*?"name"\s*:\s*"Rythnverse"[\s\S]*?\},\s*\{\s*"@type"\s*:\s*"Person"\s*,\s*"name"\s*:\s*"Hanan"\s*\}\s*\]/;
  if (oldFounderArray.test(content)) {
    content = content.replace(oldFounderArray, `"founder": {
        "@type": "Person",
        "@id": "https://techora.in/founder#rythnverse",
        "name": "Rythnverse",
        "jobTitle": "Founder & CEO",
        "sameAs": "https://www.instagram.com/ryhnverse"
      }`);
    modified = true;
    console.log(`  [SCHEMA FIX] Replaced old founder array in ${path.basename(filePath)}`);
  }

  // Also fix patterns where "Raihan" is inside publisher or author blocks in blog schemas
  if (/"name"\s*:\s*"Raihan"/.test(content) || /"name"\s*:\s*"ryhnverse"/.test(content)) {
    content = content.replace(/"name"\s*:\s*"ryhnverse"/g, '"name": "Rythnverse"');
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    modifiedFiles.push(filePath);
    console.log(`✅ Updated: ${path.relative(BASE, filePath)}`);
  }
});

console.log('\n=== SUMMARY ===');
console.log(`Modified ${modifiedFiles.length} files:`);
modifiedFiles.forEach(f => console.log(' -', path.relative(BASE, f)));
