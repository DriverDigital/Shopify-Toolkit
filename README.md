# Shopify Toolkit

A collection of open-source tools for Shopify developers to streamline common development tasks, migrations, and app integrations. This toolkit helps you work more efficiently with Shopify by automating complex processes and providing solutions to common challenges.

![Shopify Toolkit Banner](driver-oregon-trail.jpg)

## 🧰 What's Included

This repository contains three primary tools:

1. **shopify-app-integration-tool**: Automate the integration of third-party apps into your Shopify themes using AI-powered code generation.
2. **api-crawler**: Extract and consolidate API documentation from any website for easier reference and AI assistance.
3. **prestashop-product-collection-relationship-scraper**: Facilitate migrations from PrestaShop to Shopify by mapping products to collections.

All tools are free, open-source, and available for anyone to use, modify, and contribute to.

## 🚀 Quick Start

Each tool has its own directory with specific README and installation instructions.

### Prerequisites

- Node.js v14+ (for shopify-app-integration-tool and prestashop scraper)
- Python 3.6+ (for api-crawler)
- NPM or Yarn (for Node.js dependencies)
- Pip (for Python dependencies)

## 📚 Tool Documentation

### 1. Shopify App Integration Tool

A powerful CLI tool that automates the integration of third-party apps into Shopify themes using AI-powered code generation.

#### Features

- API Documentation Crawler: Automatically extracts documentation from app developer websites
- AI-Powered Code Generation: Leverages Claude-3-Opus for intelligent code generation
- Interactive Workflow: Review generated code before applying changes
- Configuration-Based: Define integration tasks in a simple YAML file

#### Getting Started

```bash
cd shopify-app-integration-tool
npm install
export ANTHROPIC_API_KEY="your-api-key-here"
npm run integrate
```

[View full documentation →](./shopify-app-integration-tool/README.md)

### 2. API Crawler

A flexible Python utility for crawling and extracting API documentation from websites, creating a consolidated text file for reference or AI contexts.

#### Features

- Crawls entire documentation sites or specific page lists
- Preserves code blocks, tables, and content structure
- Handles rate limiting and polite delays between requests
- Outputs clean, well-formatted documentation text files

#### Getting Started

```bash
cd api-crawler
pip install requests beautifulsoup4
# Configure START_URL in crawler.py
python crawler.py
```

[View full documentation →](./api-crawler/readme.md)

### 3. PrestaShop Product Collection Relationship Scraper

A specialized tool for extracting product-collection relationships from PrestaShop websites to facilitate migration to Shopify.

#### Features

- Scrapes the sitemap to find all collection URLs
- Visits each collection to extract product listings
- Generates multiple output formats (CSV, JSON)
- Creates a bidirectional mapping (products→collections and collections→products)

#### Getting Started

```bash
cd prestashop-product-collection-relationship-scraper
npm install puppeteer json2csv
# Edit the script to use your PrestaShop site URL
node prestashop-scraper.js
```

[View full documentation →](./prestashop-product-collection-relationship-scraper/README.md)

## 🌐 Typical Use Cases

### Integrating Third-Party Apps

The shopify-app-integration-tool streamlines the process of building custom third-party app integrations in your Shopify themes:

1. Define your integration requirements in `api_config.yml`
2. Run the crawler to extract API documentation
3. Let the AI generate integration code
4. Review and apply the changes to your theme

### Migrating from PrestaShop to Shopify

Use the prestashop-product-collection-relationship-scraper to:

1. Extract product-collection relationships from an existing PrestaShop store
2. Generate mappings that can be used during the migration process
3. Ensure products are assigned to the correct collections in Shopify

### Collecting API Documentation

The api-crawler helps you:

1. Extract comprehensive documentation from third-party APIs
2. Create a consolidated reference file for your team
3. Provide context to AI tools for assistance with integration tasks

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- The Shopify Developer community for inspiration and feedback
- The various open-source projects that made these tools possible
- All contributors who help improve these tools
