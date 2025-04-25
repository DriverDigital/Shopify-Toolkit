/** API Documentation Web Crawler
------------------------
A flexible web crawler for extracting documentation from any documentation website.
Configure the START_URL, LINKS_LIST, and OUTPUT_FILE variables below before running.
The FOCUS_ELEMENT variable can be set to the HTML element that contains the main content.
The MAX_PAGES variable can be set to limit the number of pages processed (null for all).
The crawler will extract the title and content of each page and save it to a text file.
Code blocks and tables will be preserved in the output.
------------------------
To run the crawler:
$ npm install axios cheerio
$ node crawler.js
------------------------
*/

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');
const url = require('url');
const os = require('os');

const CONFIG = {
  // Set one of the following:
  START_URL: 'https://APP_DOCS_URL',
  // OR
  LINKS_LIST: [
    // Add links to documentation pages here
    // Example: '/docs/endpoint1', '/docs/endpoint2'
  ],
  OUTPUT_FILE: 'api_docs.txt',
  // Element to focus on (e.g., 'div.relative')
  FOCUS_ELEMENT: 'div.relative',
  MAX_PAGES: null
};

function cleanText(text) {
  // Clean up text content while preserving formatting
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line, index, arr) => {
      // Remove multiple newlines but preserve important formatting
      if (!line) return !!arr[index - 1];
      return true;
    });

  const cleaned = lines.map((line) => {
    // Clean up common artifacts
    line = line
      .replace('[email protected]', 'email@example.com')
      .replace('🚧', '[NOTE]')
      .replace('➔', '->')
      .replace('❤️', '<3');

    // Fix joined words by adding space before capital letters
    if (line.length > 1) {
      const words = [];
      let currentWord = line[0];
      for (let i = 1; i < line.length; i++) {
        const char = line[i];
        if (
          char.match(/[A-Z]/) &&
          currentWord.slice(-1).match(/[a-z]/) &&
          !['REST', 'API', 'UI', 'JSON', 'SDK'].some((term) => currentWord.endsWith(term))
        ) {
          words.push(currentWord);
          currentWord = char;
        } else {
          currentWord += char;
        }
      }
      words.push(currentWord);
      line = words.join(' ');
    }

    return line;
  });

  return cleaned.join('\n');
}

async function getPageContent(pageUrl) {
  const response = await axios.get(pageUrl);
  const $ = cheerio.load(response.data);

  const article = $(CONFIG.FOCUS_ELEMENT);
  if (!article.length) return [null, null];

  // Get title
  const title = article.find('h1');
  const titleText = title.length ? title.text().trim() : pageUrl;

  // Preserve code blocks
  const codeBlocks = [];
  article.find('pre, code').each((i, elem) => {
    const codeText = $(elem)
      .text()
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n')
      .trim();
    codeBlocks.push(codeText);
    $(elem).replaceWith(`[CODE_BLOCK_${codeBlocks.length}]`);
  });

  // Preserve tables
  const tables = [];
  article.find('table').each((i, table) => {
    let tableText = '';
    const $table = $(table);

    const headers = $table.find('th');
    if (headers.length) {
      const headerTexts = [];
      headers.each((_, h) => {
        const code = $(h).find('code');
        headerTexts.push(code.length ? `\`${code.text().trim()}\`` : $(h).text().trim());
      });

      tableText += headerTexts.join(' | ') + '\n';
      tableText += '-'.repeat(headers.length * 20) + '\n';
    }

    $table.find('tr').each((_, row) => {
      const $row = $(row);
      const cells = $row.find('td, th');
      if (cells.length) {
        const cellTexts = [];
        cells.each((_, cell) => {
          const code = $(cell).find('code');
          cellTexts.push(code.length ? `\`${code.text().trim()}\`` : $(cell).text().trim());
        });

        const rowText = cellTexts.join(' | ');
        if (!headers.length || rowText !== tableText.split('\n')[0]) {
          tableText += rowText + '\n';
        }
      }
    });

    tables.push(tableText);
    $table.replaceWith(`[TABLE_${tables.length}]`);
  });

  // Clean up article content
  article.find('script, style').remove();

  // Get main content
  let content = cleanText(article.text());

  // Restore code blocks
  codeBlocks.forEach((code, i) => {
    content = content.replace(`[CODE_BLOCK_${i + 1}]`, `\n\`\`\`\n${code}\n\`\`\`\n`);
  });

  // Restore tables
  tables.forEach((table, i) => {
    content = content.replace(`[TABLE_${i + 1}]`, `\n${table}\n`);
  });

  return [titleText, content];
}

// Crawl documentation site and save content to file
async function crawlDocs() {
  // Check if output file exists
  let backupFile;
  try {
    await fs.access(CONFIG.OUTPUT_FILE);
    // Create backup of existing file
    backupFile = CONFIG.OUTPUT_FILE + '.backup';
    try {
      await fs.rename(CONFIG.OUTPUT_FILE, backupFile);
      console.log(`Existing file backed up to: ${backupFile}`);
    } catch (e) {
      console.warn(`Warning: Could not create backup: ${e.message}`);
    }
  } catch (e) {
    // File doesn't exist, continue
  }

  const visited = new Set();
  const toVisit = new Set();

  // Use LINKS_LIST if provided, otherwise start with START_URL
  if (CONFIG.LINKS_LIST.length) {
    CONFIG.LINKS_LIST.forEach((link) => {
      toVisit.add(url.resolve(CONFIG.START_URL, link));
    });
  } else {
    toVisit.add(CONFIG.START_URL);
  }

  let pagesProcessed = 0;

  // Open write stream
  const output = [];

  // Add timestamp
  const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
  output.push(
    `Documentation crawled on: ${timestamp}`,
    `Source: ${CONFIG.LINKS_LIST.length ? 'LINKS_LIST' : CONFIG.START_URL}`,
    '='.repeat(80),
    ''
  );

  while (toVisit.size && (!CONFIG.MAX_PAGES || pagesProcessed < CONFIG.MAX_PAGES)) {
    const currentUrl = Array.from(toVisit)[0];
    toVisit.delete(currentUrl);

    if (visited.has(currentUrl)) continue;

    console.log(`Processing page ${pagesProcessed + 1}: ${currentUrl}`);
    visited.add(currentUrl);

    try {
      const [title, content] = await getPageContent(currentUrl);

      if (title && content) {
        output.push('\n' + '='.repeat(80), `PAGE: ${title}`, `URL: ${currentUrl}`, '='.repeat(80), '', content, '\n');
        pagesProcessed++;
      }

      // Only find additional links if crawling by START_URL
      if (!CONFIG.LINKS_LIST.length) {
        const response = await axios.get(currentUrl);
        const $ = cheerio.load(response.data);
        $('a[href]').each((_, link) => {
          const nextUrl = url.resolve(currentUrl, $(link).attr('href'));
          if (nextUrl.startsWith(CONFIG.START_URL) && !visited.has(nextUrl) && !toVisit.has(nextUrl)) {
            toVisit.add(nextUrl);
          }
        });
      }

      // Polite delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error processing ${currentUrl}: ${error.message}`);
    }
  }

  if (pagesProcessed >= CONFIG.MAX_PAGES) {
    console.log(`\nReached maximum pages limit (${CONFIG.MAX_PAGES})`);
  }

  // Write output
  await fs.writeFile(CONFIG.OUTPUT_FILE, output.join('\n'), 'utf8');
}

// Only run if called directly
if (require.main === module) {
  // Starting message
  console.log(`Starting crawl of ${CONFIG.LINKS_LIST.length ? 'LINKS_LIST' : CONFIG.START_URL}`);
  console.log(`Focusing on <${CONFIG.FOCUS_ELEMENT}> elements`);
  console.log(`Will process up to ${CONFIG.MAX_PAGES || 'all'} pages`);
  console.log(`Output will be saved to ${CONFIG.OUTPUT_FILE}`);

  // Run crawler
  crawlDocs()
    .then(() => console.log('\nCrawl complete!'))
    .catch((error) => {
      console.error('Crawl failed:', error);
      process.exit(1);
    });
}

module.exports = {
  crawlDocs,
  CONFIG
};
