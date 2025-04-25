# API Documentation Crawler

A simple Python utility to crawl and extract API documentation from websites. Creates a single readable text file containing all documentation content.  This text file can then easily be used as context for AI tools to assist a developer with creating an app integration or other tasks.

## Setup

1. Install dependencies:
```bash
pip install requests beautifulsoup4
```

2. Clone repository:
```bash
git clone [repository-url]
cd api-crawler
```

## Usage

1. Edit `crawler.py` to set your target documentation URL:
```python
base_url = "https://docs.example.com/api/"  # Replace with API docs URL
links_list
```

2. Run crawler:
```bash
python api-crawler/crawler.py
```

3. Find extracted documentation in `documentation.txt`

## Features

- Crawls all pages under specified documentation URL
- Extracts readable text content
- Preserves page structure with clear section boundaries
- Includes source URLs for reference
- Rate-limited to be server-friendly

## Output Format

The generated `documentation.txt` will contain sections formatted as:
```
================================================================================
PAGE: [Page Title]
URL: [Source URL]
================================================================================

[Page Content]
```

## Customization

Modify `get_page_text()` function to adjust content extraction for specific documentation structures.

## Contributing

Feel free to submit issues and pull requests for improvements.
