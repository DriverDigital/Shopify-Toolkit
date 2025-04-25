"""
Documentation Web Crawler
------------------------
A flexible web crawler for extracting documentation from any documentation website.
Configure the START_URL, LINKS_LIST, and OUTPUT_FILE variables below before running.

Usage:
1. Set START_URL to your documentation's base URL (if LINKS_LIST is not used).
2. Optionally provide a LINKS_LIST for specific URLs to crawl instead of starting from START_URL.
3. Set OUTPUT_FILE to your desired output path/filename.
4. Optionally configure FOCUS_ELEMENT, MAX_PAGES.
5. Install required packages: pip install requests beautifulsoup4.
6. Run the script: python api-crawler/crawler.py (or python3 api-crawler/FILENAME.py)
"""

import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import time
import os

CONFIG = {
    "START_URL": "https://www.shopify.com/editions/winter2025", # Base URL to start crawling from
    "LINKS_LIST": [ # Replace this with your list of links or leave empty for URL-based crawling
      ],
    "OUTPUT_FILE": "api-crawler/shopify_edition_docs.txt", # Output file for saving crawled content
    "FOCUS_ELEMENT": "main", # HTML element to focus on (e.g., 'article', 'main', 'div')
    "MAX_PAGES": None  # Set to None to crawl all pages
}

def clean_text(text):
    """Clean up text content while preserving important formatting"""
    # Remove multiple newlines and clean up common artifacts
    lines = [line.strip() for line in text.splitlines()]
    cleaned = []
    prev_empty = False

    for line in lines:
        # Clean up common artifacts
        line = (line.replace('[email protected]', 'email@example.com')
                   .replace('🚧', '[NOTE]')
                   .replace('➔', '->')
                   .replace('❤️', '<3'))

        # Fix joined words by adding space before capital letters
        # but only if they're not part of common acronyms or known terms
        if len(line) > 1:
            words = []
            current_word = line[0]
            for char in line[1:]:
                if (char.isupper() and
                    current_word[-1].islower() and
                    not current_word.endswith(('REST', 'API', 'UI', 'JSON', 'SDK'))):
                    words.append(current_word)
                    current_word = char
                else:
                    current_word += char
            words.append(current_word)
            line = ' '.join(words)

        if line:
            cleaned.append(line)
            prev_empty = False
        elif not prev_empty:
            cleaned.append('')
            prev_empty = True

    return '\n'.join(cleaned)

def get_page_content(url):
    """Extract and format content from the article element"""
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')

    article = soup.find(CONFIG["FOCUS_ELEMENT"])
    if not article:
        return None, None

    # Preserve links: replace each anchor tag with its text and absolute URL
    for link in article.find_all('a'):
        href = link.get('href')
        if href:
            full_url = urljoin(url, href)
            link.replace_with(f"{link.get_text()} ({full_url})")

    # Get title
    title = article.find('h1')
    title_text = title.get_text().strip() if title else url

    # Preserve code blocks (including pre and code elements)
    code_blocks = []
    for code_element in article.find_all(['pre', 'code']):
        # Clean up whitespace in code blocks but preserve indentation
        code_text = '\n'.join(line.rstrip() for line in
                             code_element.get_text().splitlines())
        code_blocks.append(code_text.strip())
        code_element.replace_with(f'[CODE_BLOCK_{len(code_blocks)}]')

    # Preserve tables
    tables = []
    for table in article.find_all('table'):
        table_text = ""
        headers = table.find_all('th')
        if headers:
            header_texts = []
            for h in headers:
                # Preserve any code blocks in headers
                code = h.find('code')
                if code:
                    header_texts.append(f'`{code.get_text().strip()}`')
                else:
                    header_texts.append(h.get_text().strip())
            table_text += " | ".join(header_texts) + "\n"
            table_text += "-" * (len(headers) * 20) + "\n"

        rows = table.find_all('tr')
        for row in rows:
            cells = row.find_all(['td', 'th'])
            if cells:
                cell_texts = []
                for cell in cells:
                    # Preserve any code blocks in cells
                    code = cell.find('code')
                    if code:
                        cell_texts.append(f'`{code.get_text().strip()}`')
                    else:
                        cell_texts.append(cell.get_text().strip())
                row_text = " | ".join(cell_texts)
                if not headers or row_text != table_text.splitlines()[0]:
                    table_text += row_text + "\n"

        tables.append(table_text)
        table.replace_with(f'[TABLE_{len(tables)}]')

    # Clean up article content
    for element in article(['script', 'style']):
        element.decompose()

    # Get main content
    content = clean_text(article.get_text())

    # Restore code blocks
    for i, code in enumerate(code_blocks, 1):
        content = content.replace(f'[CODE_BLOCK_{i}]', f'\n```\n{code}\n```\n')

    # Restore tables
    for i, table in enumerate(tables, 1):
        content = content.replace(f'[TABLE_{i}]', f'\n{table}\n')

    return title_text, content

def crawl_docs():
    """Crawl documentation site and save content to file."""
    # Check if output file exists
    output_exists = os.path.exists(CONFIG["OUTPUT_FILE"])
    if output_exists:
        # Create backup of existing file
        backup_file = CONFIG["OUTPUT_FILE"] + '.backup'
        try:
            os.rename(CONFIG["OUTPUT_FILE"], backup_file)
            print(f"Existing file backed up to: {backup_file}")
        except Exception as e:
            print(f"Warning: Could not create backup: {e}")

    visited = set()
    to_visit = set()

    # Use LINKS_LIST if provided, otherwise start with START_URL
    if CONFIG["LINKS_LIST"]:
        to_visit = {urljoin(CONFIG["START_URL"], link) for link in CONFIG["LINKS_LIST"]}
    else:
        to_visit.add(CONFIG["START_URL"])

    pages_processed = 0

    with open(CONFIG["OUTPUT_FILE"], 'w', encoding='utf-8') as f:
        # Add timestamp at the start of file
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        f.write(f"Documentation crawled on: {timestamp}\n")
        f.write(f"Source: {'LINKS_LIST' if CONFIG['LINKS_LIST'] else CONFIG['START_URL']}\n")
        f.write("="*80 + "\n\n")

        while to_visit and (CONFIG["MAX_PAGES"] is None or pages_processed < CONFIG["MAX_PAGES"]):
            url = to_visit.pop()
            if url in visited:
                continue

            print(f"Processing page {pages_processed + 1}: {url}")
            visited.add(url)

            try:
                title, content = get_page_content(url)

                if title and content:
                    f.write(f"\n{'='*80}\n")
                    f.write(f"PAGE: {title}\n")
                    f.write(f"URL: {url}\n")
                    f.write(f"{'='*80}\n\n")
                    f.write(content)
                    f.write('\n\n')
                    pages_processed += 1

                # Only find additional links if crawling by START_URL
                if not CONFIG["LINKS_LIST"]:
                    soup = BeautifulSoup(requests.get(url).text, 'html.parser')
                    links = soup.find_all('a', href=True)
                    for link in links:
                        next_url = urljoin(url, link['href'])
                        if (next_url.startswith(CONFIG["START_URL"]) and
                            next_url not in visited and
                            '/docs/' in next_url):
                            to_visit.add(next_url)

                time.sleep(1)  # Polite delay between requests

            except Exception as e:
                print(f"Error processing {url}: {e}")

        if CONFIG["MAX_PAGES"] is not None and pages_processed >= CONFIG["MAX_PAGES"]:
            print(f"\nReached maximum pages limit ({CONFIG['MAX_PAGES']})")

if __name__ == "__main__":
    print(f"Starting crawl of {'LINKS_LIST' if CONFIG['LINKS_LIST'] else CONFIG['START_URL']}")
    print(f"Focusing on <{CONFIG['FOCUS_ELEMENT']}> elements")
    print(f"Will process {CONFIG['MAX_PAGES'] if CONFIG['MAX_PAGES'] is not None else 'all'} pages")
    print(f"Output will be saved to {CONFIG['OUTPUT_FILE']}")
    crawl_docs()
    print("\nCrawl complete!")
