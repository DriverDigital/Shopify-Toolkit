const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');

// Main function to run the scraper
async function scrapePrestashopCollections() {
  console.log('Starting the scraper...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Store the collection URLs and their names
  const collections = {};
  // Store the products and their collections
  const productCollections = {};

  try {
    // Step 1: Visit the sitemap and get all collection URLs
    console.log('Visiting sitemap to extract collection URLs...');
    await page.goto('https://www.PRESTASHOP_WEBSITE/sitemap', { waitUntil: 'networkidle2' });

    const collectionUrls = await page.evaluate(() => {
      const leftBlock = document.querySelector('.left-block');
      const links = leftBlock.querySelectorAll('a');
      const results = {};

      links.forEach(link => {
        const url = link.href;
        const name = link.textContent.trim();
        if (url && name) {
          results[url] = name;
        }
      });

      return results;
    });

    console.log(`Found ${Object.keys(collectionUrls).length} collection URLs`);

    // Step 2: Visit each collection URL and extract products
    let collectionCounter = 0;
    for (const [url, name] of Object.entries(collectionUrls)) {
      collectionCounter++;
      console.log(`Processing collection ${collectionCounter}/${Object.keys(collectionUrls).length}: ${name}`);

      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        const products = await page.evaluate(() => {
          const articles = document.querySelectorAll('article');
          const productNames = [];

          articles.forEach(article => {
            const h2 = article.querySelector('h2');
            if (h2) {
              const productName = h2.textContent.trim();
              if (productName) {
                productNames.push(productName);
              }
            }
          });

          return productNames;
        });

        // Store the collection with its products
        collections[name] = products;

        // Update the product to collections mapping
        products.forEach(product => {
          if (!productCollections[product]) {
            productCollections[product] = [];
          }
          productCollections[product].push(name);
        });

        console.log(`Found ${products.length} products in collection: ${name}`);

        // Wait a bit between requests to avoid overloading the server
// Using setTimeout with a promise for compatibility with older Puppeteer versions
await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error processing collection ${name}: ${error.message}`);
      }
    }

    // Step 3: Generate the CSV output files
    console.log('Generating output files...');

    // Generate products CSV
    const productsData = Object.entries(productCollections).map(([product, collections]) => ({
      'Product Title': product,
      'Collections': collections.join(', ')
    }));

    const productsParser = new Parser();
    const productsCsv = productsParser.parse(productsData);
    fs.writeFileSync('products_with_collections.csv', productsCsv);

    // Generate collections JSON (easier to read with nested data)
    fs.writeFileSync('collections_with_products.json', JSON.stringify(collections, null, 2));

    // Also generate a CSV version of collections
    const collectionsData = [];
    Object.entries(collections).forEach(([collection, products]) => {
      if (products.length === 0) {
        collectionsData.push({
          'Collection': collection,
          'Product': ''
        });
      } else {
        products.forEach(product => {
          collectionsData.push({
            'Collection': collection,
            'Product': product
          });
        });
      }
    });

    const collectionsParser = new Parser();
    const collectionsCsv = collectionsParser.parse(collectionsData);
    fs.writeFileSync('collections_with_products.csv', collectionsCsv);

    console.log('\nScraping complete!');
    console.log(`Total collections processed: ${Object.keys(collections).length}`);
    console.log(`Total unique products found: ${Object.keys(productCollections).length}`);
    console.log('\nFiles generated:');
    console.log('1. products_with_collections.csv - Each product with all its collections');
    console.log('2. collections_with_products.json - Each collection with all its products (JSON format)');
    console.log('3. collections_with_products.csv - Each collection with all its products (CSV format)');

  } catch (error) {
    console.error('An error occurred during scraping:', error);
  } finally {
    await browser.close();
  }
}

// Run the scraper
scrapePrestashopCollections();
