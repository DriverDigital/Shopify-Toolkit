const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const { Anthropic } = require('@anthropic-ai/sdk');
const readline = require('readline');
const { crawlDocs } = require('./crawler');

class IntegrationTool {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async question(query) {
    return new Promise((resolve) => this.rl.question(query, resolve));
  }

  async loadConfig() {
    try {
      const configPath = path.join(__dirname, 'api_config.yml');
      console.log('Loading config from:', configPath);

      const configFile = await fs.readFile(configPath, 'utf8');
      const config = yaml.load(configFile);

      if (!config?.tasks?.length) {
        throw new Error('Invalid configuration: missing tasks array');
      }

      return config;
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error('Configuration file not found. Please ensure api_config.yml exists in the root directory.');
      }
      throw new Error(`Error loading configuration: ${error.message}`);
    }
  }

  async readThemeFiles(tasks) {
    const themeFiles = {};

    for (const task of tasks) {
      const filePath = path.join('..', task.target_file);

      try {
        if (task.type === 'update') {
          try {
            themeFiles[task.target_file] = await fs.readFile(filePath, 'utf8');
          } catch (err) {
            console.warn(`Note: File ${task.target_file} not found - will be created.`);
            themeFiles[task.target_file] = '';
          }
        } else {
          themeFiles[task.target_file] = '';
        }
      } catch (error) {
        console.error(`Error processing ${task.target_file}:`, error.message);
      }
    }

    return themeFiles;
  }

  async saveConversation(conversation) {
    const sessionPath = path.join(__dirname, 'sessions', `session-${Date.now()}.json`);
    await fs.mkdir(path.dirname(sessionPath), { recursive: true });
    await fs.writeFile(sessionPath, JSON.stringify(conversation, null, 2));
    return sessionPath;
  }

  initializeAnthropicClient() {
    try {
      const apiKey =
      // Use Github secrets to store API key, or fallback to hardcode for secure environments only
        'ANTHROPIC_API_KEY_GOES_HERE';

      if (!apiKey) {
        throw new Error('API key not found in environment or default configuration');
      }

      console.log('Initializing Anthropic client...');
      return new Anthropic({
        apiKey,
        defaultHeaders: {
          'anthropic-version': '2023-06-01'
        }
      });
    } catch (error) {
      throw new Error(`Anthropic client initialization failed: ${error.message}`);
    }
  }

  async handleAnthropicResponse(client, message) {
    try {
      console.log('Sending request to Anthropic API...');
      const response = await client.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 4096,
        temperature: 0.7,
        messages: [message],
        system: 'You are an expert in Shopify theme development and API integration.'
      });

      if (!response?.content?.[0]?.text) {
        throw new Error('Invalid API response structure');
      }

      return response.content[0].text;
    } catch (error) {
      if (error.status === 401) {
        throw new Error('Authentication failed: Invalid API key');
      } else if (error.status === 429) {
        console.log('Rate limit reached. Waiting 2 seconds...');
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return this.handleAnthropicResponse(client, message);
      } else {
        throw new Error(`API request failed: ${error.message}`);
      }
    }
  }

  async applyChanges(responseContent, selectedFiles = null) {
    const filePattern = /\[FILE:(.*?)\](.*?)\[ENDFILE\]/gs;
    const changes = [];
    let needsViteRestart = false;

    for (const match of responseContent.matchAll(filePattern)) {
      const relativePath = match[1].trim();

      if (selectedFiles && !selectedFiles.includes(relativePath)) {
        continue;
      }

      const filePath = path.join('..', relativePath);
      const content = match[2].trim();
      const assetExtensions = ['.js', '.ts', '.jsx', '.tsx', '.css', '.scss', '.sass'];

      try {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, content);
        changes.push(relativePath);

        if (assetExtensions.includes(path.extname(filePath))) {
          needsViteRestart = true;
        }
      } catch (error) {
        console.error(`Failed to update ${relativePath}:`, error.message);
      }
    }

    return { changes, needsViteRestart };
  }

  async createIntegrationMessage(apiDocs, themeFiles, tasks) {
    return {
      role: 'user',
      content: `Using this API documentation and theme files, implement the requested changes:

API Documentation:
${apiDocs}

Theme Files:
${Object.entries(themeFiles)
  .map(([file, content]) => `=== ${file} ===\n${content}\n`)
  .join('\n')}

Tasks:
${tasks
  .map(
    (task) =>
      `- ${task.description}
     ${task.type === 'update' ? 'Update' : 'Create'}: ${task.target_file}
     Requirements:
     ${task.requirements?.map((req) => `  - ${req}`).join('\n     ') || ''}`
  )
  .join('\n\n')}

Format your response using:
[FILE:path/to/file]
content...
[ENDFILE]`
    };
  }

  async run() {
    try {
      console.log('Starting integration process...');

      // Load configuration
      const config = await this.loadConfig();

      // Initialize Anthropic client
      const anthropic = this.initializeAnthropicClient();

      // Ensure API documentation exists
      const docsPath = 'api_docs.txt';
      if (!(await fs.stat(docsPath).catch(() => false))) {
        console.log('Crawling API documentation...');
        await crawlDocs();
      }

      // Read necessary files
      const apiDocs = await fs.readFile(docsPath, 'utf8');
      const themeFiles = await this.readThemeFiles(config.tasks);

      console.log('Files loaded successfully. Preparing integration...');

      // Start integration process
      let conversation = [await this.createIntegrationMessage(apiDocs, themeFiles, config.tasks)];
      let continueProcess = true;

      while (continueProcess) {
        try {
          console.log('\nGenerating integration code...');
          const responseContent = await this.handleAnthropicResponse(anthropic, conversation[conversation.length - 1]);
          conversation.push({ role: 'assistant', content: responseContent });

          const savePath = await this.saveConversation(conversation);
          console.log(`Session saved to: ${path.basename(savePath)}`);

          // Handle file modifications
          const filePattern = /\[FILE:(.*?)\]/g;
          const filesToModify = [...responseContent.matchAll(filePattern)].map((m) => m[1].trim());

          if (filesToModify.length) {
            console.log('\nFiles to be modified:');
            filesToModify.forEach((file, i) => console.log(`${i + 1}. ${file}`));

            const selection = await this.question(
              '\nEnter file numbers to update (comma-separated) or press Enter for all: '
            );
            const selectedFiles = selection.trim()
              ? selection.split(',').map((n) => filesToModify[parseInt(n.trim()) - 1])
              : null;

            const { changes, needsViteRestart } = await this.applyChanges(responseContent, selectedFiles);

            console.log('\nIntegration applied! Modified files:');
            changes.forEach((file) => console.log(`- ${file}`));

            if (needsViteRestart) {
              console.log('\nNote: Asset files were modified. Run "npm run dev" to recompile.');
            }
          }

          const feedback = await this.question('\nOptions:\n1. Make adjustments\n2. Exit\nChoice: ');

          if (feedback.trim() === '1') {
            const adjustments = await this.question('What adjustments would you like to make?\n');
            conversation.push({ role: 'user', content: adjustments });
          } else {
            continueProcess = false;
          }
        } catch (error) {
          console.error('Error during integration:', error.message);
          const retry = await this.question('Would you like to retry? (y/n): ');
          if (retry.toLowerCase() !== 'y') {
            continueProcess = false;
          }
        }
      }

      console.log('Integration complete!');
    } catch (error) {
      console.error('Fatal error:', error.message);
      throw error;
    } finally {
      this.rl.close();
    }
  }
}

// Run if called directly
if (require.main === module) {
  const tool = new IntegrationTool();
  tool.run().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { IntegrationTool };
