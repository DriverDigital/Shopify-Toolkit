# Prestashop Product Collection Relationship Scraper

This script helps extract the relationship between products and collections from any Prestashop website to assist with migrating from PrestaShop to Shopify.  If you've ever tried to migrate a site from Prestashop to Shopify, you know that Prestashop and Shopify handle collections very differently.  This script can help you with the initial step of mapping products to collections and vice-versa.

## Prerequisites

- Node.js (v14 or higher)
- npm (Node package manager)

## Required Packages

```bash
npm install puppeteer json2csv
```

## How the Script Works

The script performs the following operations:

1. **Scrapes the sitemap** at https://www.PRESTASHOP_WEBSITE/sitemap to get all collection URLs
2. **Visits each collection page** to extract product titles
3. **Generates three output files**:
   - `products_with_collections.csv`: A product-focused spreadsheet listing each product with all its collections
   - `collections_with_products.json`: A collection-focused JSON file showing each collection with its products
   - `collections_with_products.csv`: A collection-focused CSV file showing each collection with its products

## Running the Script

1. Install the required packages:
   ```bash
   npm install puppeteer json2csv
   ```
2. Run the script:
   ```bash
   node prestashop-product-collection-relationship-scraper/prestashop-scraper.js
   ```
3. The script will output progress to the console and create the output files when complete

## Understanding the Output

### products_with_collections.csv

This CSV has two columns:
- **Product Title**: The name of the product
- **Collections**: A comma-separated list of all collections the product belongs to

This format makes it easy to see which collections each product should be added to when migrating to Shopify.

### collections_with_products.json

This JSON file organizes products by collection:
```json
{
  "Collection Name 1": [
    "Product Title 1",
    "Product Title 2"
  ],
  "Collection Name 2": [
    "Product Title 3",
    "Product Title 4"
  ]
}
```

### collections_with_products.csv

This CSV has two columns:
- **Collection**: The name of the collection
- **Product**: The name of a product in that collection

Each row represents a single product-collection association, so collections with multiple products will appear in multiple rows.

## Troubleshooting

- **Timeouts**: If the script encounters timeouts, try increasing the timeout value in the `page.goto()` options
- **Rate limiting**: If you experience rate limiting, try increasing the `waitForTimeout` delay between requests
- **Missing data**: Check the console output for any errors with specific collections

## Using the Data for Shopify Migration

1. Use the `products_with_collections.csv` file to set up your initial products in Shopify
2. Refer to `collections_with_products.json` or `collections_with_products.csv` to create and populate your Shopify collections
3. Verify that all products are assigned to the correct collections after migration

## Notes

- The script uses Puppeteer in headless mode, which means no browser window will be visible during execution
- The console will display progress information including the number of products found in each collection
- Empty collections will still be included in the output
