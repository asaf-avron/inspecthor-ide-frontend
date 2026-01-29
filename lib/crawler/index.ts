/**
 * Browser-side AST crawler using tree-sitter-wasm.
 * Provides real-time execution slice extraction in the IDE.
 */

import Parser from 'web-tree-sitter';

export interface ExecutionSlice {
  anchorCode: string;
  dependencies: string[];
  externalStubs: string[];
  importsMap: Record<string, string>;
}

export class BrowserCrawler {
  private parser: Parser | null = null;
  private pythonLang: Parser.Language | null = null;
  private tsLang: Parser.Language | null = null;
  private initialized = false;

  /**
   * Initialize tree-sitter with language grammars.
   * Must be called before using the crawler.
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize tree-sitter
      await Parser.init();
      this.parser = new Parser();

      // Load language grammars
      this.pythonLang = await Parser.Language.load('/tree-sitter-python.wasm');
      this.tsLang = await Parser.Language.load('/tree-sitter-typescript.wasm');

      this.initialized = true;
      console.log('[Crawler] Initialized successfully');
    } catch (error) {
      console.error('[Crawler] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Extract execution slice for a Python function.
   */
  extractPythonSlice(
    anchorFile: string,
    functionName: string,
    projectFiles: Map<string, string>
  ): ExecutionSlice {
    if (!this.parser || !this.pythonLang) {
      throw new Error('Crawler not initialized. Call init() first.');
    }

    this.parser.setLanguage(this.pythonLang);
    const tree = this.parser.parse(anchorFile);

    // Find function node
    const funcNode = this.findPythonFunction(tree.rootNode, functionName);
    if (!funcNode) {
      throw new Error(`Function '${functionName}' not found`);
    }

    // Extract function code
    const anchorCode = anchorFile.slice(funcNode.startIndex, funcNode.endIndex);

    // Find function calls within the function
    const calls = this.findPythonCalls(funcNode);

    // Resolve dependencies
    const dependencies: string[] = [];
    const importsMap: Record<string, string> = {};

    // TODO: Implement dependency resolution
    // For now, return basic slice

    return {
      anchorCode,
      dependencies,
      externalStubs: [],
      importsMap
    };
  }

  /**
   * Extract execution slice for a TypeScript function.
   */
  extractTypeScriptSlice(
    anchorFile: string,
    functionName: string,
    projectFiles: Map<string, string>
  ): ExecutionSlice {
    if (!this.parser || !this.tsLang) {
      throw new Error('Crawler not initialized. Call init() first.');
    }

    this.parser.setLanguage(this.tsLang);
    const tree = this.parser.parse(anchorFile);

    // Find function node
    const funcNode = this.findTSFunction(tree.rootNode, functionName);
    if (!funcNode) {
      throw new Error(`Function '${functionName}' not found`);
    }

    // Extract function code
    const anchorCode = anchorFile.slice(funcNode.startIndex, funcNode.endIndex);

    return {
      anchorCode,
      dependencies: [],
      externalStubs: [],
      importsMap: {}
    };
  }

  /**
   * Find a Python function definition in the AST.
   */
  private findPythonFunction(node: Parser.SyntaxNode, name: string): Parser.SyntaxNode | null {
    if (node.type === 'function_definition') {
      const nameNode = node.childForFieldName('name');
      if (nameNode && nameNode.text === name) {
        return node;
      }
    }

    for (const child of node.children) {
      const result = this.findPythonFunction(child, name);
      if (result) return result;
    }

    return null;
  }

  /**
   * Find a TypeScript function declaration in the AST.
   */
  private findTSFunction(node: Parser.SyntaxNode, name: string): Parser.SyntaxNode | null {
    if (node.type === 'function_declaration' || node.type === 'function') {
      const nameNode = node.childForFieldName('name');
      if (nameNode && nameNode.text === name) {
        return node;
      }
    }

    for (const child of node.children) {
      const result = this.findTSFunction(child, name);
      if (result) return result;
    }

    return null;
  }

  /**
   * Find all function calls within a Python function.
   */
  private findPythonCalls(node: Parser.SyntaxNode): string[] {
    const calls: string[] = [];

    if (node.type === 'call') {
      const funcNode = node.childForFieldName('function');
      if (funcNode) {
        calls.push(funcNode.text);
      }
    }

    for (const child of node.children) {
      calls.push(...this.findPythonCalls(child));
    }

    return calls;
  }
}

// Singleton instance
let crawlerInstance: BrowserCrawler | null = null;

/**
 * Get singleton crawler instance.
 * Initializes on first call.
 */
export async function getCrawler(): Promise<BrowserCrawler> {
  if (!crawlerInstance) {
    crawlerInstance = new BrowserCrawler();
    await crawlerInstance.init();
  }
  return crawlerInstance;
}
