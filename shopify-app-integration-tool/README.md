# Shopify App Integration Tool

A CLI tool that automates the integration of third-party apps into Shopify themes using AI-powered code generation.
This is a work in progress and is not yet ready for production use - fork at your own risk, and please submit a PR if you have any suggestions or improvements!

## Overview

This tool streamlines the process of integrating third-party app functionality into Shopify themes by:

1. Crawling and extracting API documentation from third-party app websites
2. Reading your existing theme files
3. Using Claude AI to generate the necessary integration code
4. Applying the changes to your theme files automatically

Perfect for Shopify developers looking to speed up custom app integrations while ensuring code quality and adherence to best practices.

## Features

- **API Documentation Crawler**: Automatically extracts documentation from app developer websites
- **AI-Powered Code Generation**: Leverages Claude for intelligent code generation
- **Interactive Workflow**: Review generated code before applying changes
- **Configuration-Based**: Define integration tasks in a simple YAML file
- **Customizable**: Target specific theme files and define specific requirements

## Prerequisites

- Node.js v20+ (recommended)
- Anthropic API key (for Claude AI access) (support for other AI providers is in the works)
- Access to the Shopify theme files you want to modify

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd shopify-app-integration-tool
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up your Anthropic API key using environment variables & Github secrets:
   ```
   export ANTHROPIC_API_KEY="your-api-key-here"
   ```

   Or edit the `index.js` file to include your API key (for secure or development environments only).

## Configuration

### API Integration Tasks

Define your integration tasks in the `api_config.yml` file:

```yaml
tasks:
  - description: "Initialize app functionality"
    type: "create"  # or "update" if modifying existing files
    target_file: "assets/app-integration.js"
    requirements:
      - "Add initialization code"
      - "Setup event handlers"
      - "Configure UI elements"
```

### API Documentation Crawler

The crawler is configured in `crawler.js`. You can customize:

- `START_URL`: The starting URL for the API documentation
- `LINKS_LIST`: Specific documentation pages to process
- `FOCUS_ELEMENT`: The HTML element containing the main documentation content
- `MAX_PAGES`: Maximum number of pages to process

## Usage

### Step 1: Configure the integration

Edit `api_config.yml` to define your integration tasks.

### Step 2: Crawl API documentation

If you need to gather API documentation:

```
npm run crawl
```

This will create an `api_docs.txt` file with the extracted documentation.

### Step 3: Run the integrator

```
npm run integrate
```

The tool will:
1. Read the API documentation and theme files
2. Use Claude AI to generate integration code
3. Present you with files to be modified
4. Apply changes to selected files
5. Allow you to make adjustments if needed

## Example Integration Session

```
Starting integration process...
Loading config from: api_config.yml
Initializing Anthropic client...
Files loaded successfully. Preparing integration...

Generating integration code...
Session saved to: session-1650123456789.json

Files to be modified:
1. assets/app-integration.js

Enter file numbers to update (comma-separated) or press Enter for all:

Integration applied! Modified files:
- assets/app-integration.js

Options:
1. Make adjustments
2. Exit
Choice: 2

Integration complete!
```

## Advanced Usage

### Making Adjustments

If you need to modify the generated code:
1. Choose "Make adjustments" when prompted
2. Enter your feedback or requirements
3. The tool will regenerate the code based on your input

### Custom Crawling

You can customize the crawler to target specific documentation sites:

1. Edit `crawler.js` to set your target website and selectors
2. Run `npm run crawl` to extract the documentation

## Troubleshooting

- **API Key Issues**: Ensure your Anthropic API key is correctly set
- **Crawl Failures**: Check that the website structure matches the configured selectors
- **Integration Errors**: Review the generated code and make adjustments as needed

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
