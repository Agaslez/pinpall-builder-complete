// server/UniversalFileParser.ts
import * as fs from "fs";
import * as path from "path";

export interface ParsedFile {
  path: string;
  content: string;
  type: "file" | "folder";
  language: string;
  size: number;
  lines: number;
  dependencies: string[];
  metadata: Record<string, any>;
}

export interface ParseOptions {
  maxFileSize?: number;
  supportedLanguages?: string[];
  ignorePatterns?: string[];
  extractMetadata?: boolean;
  followSymlinks?: boolean;
}

export class UniversalFileParser {
  private static languageExtensions: Record<string, string[]> = {
    typescript: [".ts", ".tsx"],
    javascript: [".js", ".jsx", ".mjs", ".cjs"],
    python: [".py"],
    html: [".html", ".htm"],
    css: [".css", ".scss", ".sass", ".less"],
    json: [".json"],
    markdown: [".md", ".mdx"],
    yaml: [".yaml", ".yml"],
    xml: [".xml"],
    sql: [".sql"],
    bash: [".sh", ".bash"],
    powershell: [".ps1"],
    dockerfile: [".dockerfile", "Dockerfile"],
    // dodasz kolejne jak będziemy rozbudowywać
  };

  private static dependencyPatterns: Record<string, RegExp[]> = {
    typescript: [
      /import\s+(?:.*?\s+from\s+)?['"]([^'"]+)['"]/g,
      /require\(['"]([^'"]+)['"]\)/g,
      /export\s+(?:.*?\s+from\s+)?['"]([^'"]+)['"]/g,
    ],
    javascript: [
      /import\s+(?:.*?\s+from\s+)?['"]([^'"]+)['"]/g,
      /require\(['"]([^'"]+)['"]\)/g,
      /export\s+(?:.*?\s+from\s+)?['"]([^'"]+)['"]/g,
    ],
    python: [
      /import\s+([\w.]+)/g,
      /from\s+([\w.]+)\s+import/g,
      /^\s*(?:import|from)\s+([\w.]+)/gm,
    ],
  };

  private static contentPatterns: Record<string, RegExp[]> = {
    javascript: [
      /console\.log|function\s+\w+\s*\(|const\s+\w+\s*=|let\s+\w+\s*=|var\s+\w+\s*=/,
      /export\s+(default|const|function|class)/,
      /import\s+.*from\s+['"]/,
    ],
    typescript: [
      /interface\s+\w+|type\s+\w+\s*=/, 
      /:\s*\w+\s*[<{]/,
      /as\s+\w+/,
    ],
    python: [
      /def\s+\w+\s*\(|class\s+\w+/,
      /import\s+\w+|from\s+\w+\s+import/,
      /print\(|#.*$/,
    ],
    html: [
      /<!DOCTYPE html>|<html|<head|<body/,
      /<[a-z]+[^>]*>/,
    ],
    css: [
      /{[^}]*}|:[^;]+;|@media/,
      /\.\w+\s*{/,
    ],
    json: [
      /^{\s*"[^"]+"\s*:/,
      /"[^"]+"\s*:\s*(?:"[^"]*"|\d+|true|false|null)/,
    ],
  };

  public static parseFile(
    filePath: string,
    options: ParseOptions = {}
  ): ParsedFile {
    const stats = fs.statSync(filePath);
    const extension = path.extname(filePath).toLowerCase();

    const language = this.detectLanguage(filePath, extension, '');
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n").length;
    const dependencies = this.extractDependencies(content, language);

    const metadata =
      options.extractMetadata === true
        ? this.extractMetadata(content, language)
        : {};

    return {
      path: filePath,
      content,
      type: stats.isDirectory() ? "folder" : "file",
      language,
      size: stats.size,
      lines,
      dependencies,
      metadata,
    };
  }

  public static parseDirectory(
    dirPath: string,
    options: ParseOptions = {}
  ): ParsedFile[] {
    const result: ParsedFile[] = [];

    if (!fs.existsSync(dirPath)) {
      throw new Error(`Directory does not exist: ${dirPath}`);
    }

    const items = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);

      if (this.shouldIgnore(item.name, options.ignorePatterns || [])) {
        continue;
      }

      try {
        if (item.isDirectory()) {
          const subItems = this.parseDirectory(fullPath, options);
          result.push(...subItems);

          result.push({
            path: fullPath,
            content: "",
            type: "folder",
            language: "directory",
            size: 0,
            lines: 0,
            dependencies: [],
            metadata: {
              itemCount: fs.readdirSync(fullPath).length,
            },
          });
        } else if (item.isFile()) {
          const stats = fs.statSync(fullPath);
          if (options.maxFileSize && stats.size > options.maxFileSize) {
            continue;
          }

          const parsedFile = this.parseFile(fullPath, options);
          result.push(parsedFile);
        }
      } catch (error) {
        console.warn(`Failed to parse ${fullPath}:`, error);
      }
    }

    return result;
  }

  public static parseContent(
    content: string,
    filePath: string = ""
  ): ParsedFile {
    const extension = path.extname(filePath).toLowerCase();
    const language = this.detectLanguage(filePath, extension, content);
    const lines = content.split("\n").length;

    return {
      path: filePath,
      content,
      type: "file",
      language,
      size: Buffer.byteLength(content, "utf-8"),
      lines,
      dependencies: this.extractDependencies(content, language),
      metadata: this.extractMetadata(content, language),
    };
  }

  public static detectLanguage(filePath: string, extension: string, content: string = ""): string {
    // 1. Spróbuj po rozszerzeniu
    for (const [lang, exts] of Object.entries(this.languageExtensions)) {
      if (exts.includes(extension)) {
        return lang;
      }
    }

    const base = path.basename(filePath).toLowerCase();
    if (base === "dockerfile") return "dockerfile";
    if (base === "makefile") return "makefile";

    // 2. Jeśli mamy zawartość, spróbuj wykryć po zawartości
    if (content && content.trim().length > 0) {
      const detectedByContent = this.detectLanguageByContent(content);
      if (detectedByContent !== "unknown") {
        return detectedByContent;
      }
    }

    // 3. Domyślnie "unknown"
    return "unknown";
  }

  private static detectLanguageByContent(content: string): string {
    const scores: Record<string, number> = {};
    
    // Sprawdź każdy język
    for (const [language, patterns] of Object.entries(this.contentPatterns)) {
      let score = 0;
      
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          score++;
        }
      }
      
      if (score > 0) {
        scores[language] = score;
      }
    }
    
    // Znajdź język z najwyższym score
    let bestLanguage = "unknown";
    let bestScore = 0;
    
    for (const [language, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score;
        bestLanguage = language;
      }
    }
    
    // Specjalne przypadki
    if (content.trim().startsWith("{") && content.trim().endsWith("}")) {
      try {
        JSON.parse(content);
        return "json";
      } catch {
        // Nie jest JSON
      }
    }
    
    if (content.includes("<?xml") || content.includes("<xml")) {
      return "xml";
    }
    
    if (content.includes("<!DOCTYPE html>") || content.includes("<html")) {
      return "html";
    }
    
    return bestLanguage;
  }

  private static extractDependencies(
    content: string,
    language: string
  ): string[] {
    const dependencies: Set<string> = new Set();
    const patterns = this.dependencyPatterns[language] || [];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const dep = match[1];
        if (dep && !dep.startsWith(".") && !dep.startsWith("/")) {
          dependencies.add(dep.split("/")[0]);
        }
      }
    }

    return Array.from(dependencies);
  }

  private static extractMetadata(
    content: string,
    language: string
  ): Record<string, any> {
    const metadata: Record<string, any> = {};

    const commentPatterns: Record<string, RegExp> = {
      typescript: /\/\*\*?\s*@(\w+)\s+(.*?)\s*\*\//g,
      javascript: /\/\*\*?\s*@(\w+)\s+(.*?)\s*\*\//g,
      python: /#\s*@(\w+)\s+(.*?)$/gm,
    };

    const pattern = commentPatterns[language];
    if (pattern) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        metadata[match[1]] = match[2].trim();
      }
    }

    const functionCount =
      content.match(/(function|class|def|const|let|var)\s+\w+/g)?.length || 0;
    metadata.functionCount = functionCount;

    return metadata;
  }

  private static shouldIgnore(
    itemName: string,
    ignorePatterns: string[]
  ): boolean {
    return ignorePatterns.some((pattern) => {
      if (pattern.includes("*")) {
        const regex = new RegExp(pattern.replace(/\*/g, ".*"));
        return regex.test(itemName);
      }
      return itemName === pattern;
    });
  }

  public static generateTreeStructure(files: ParsedFile[]): string {
    const tree: Record<string, any> = {};

    files.forEach((file) => {
      const parts = file.path.split("/").filter((p) => p);
      let current = tree;

      parts.forEach((part, index) => {
        const isLast = index === parts.length - 1;

        if (isLast) {
          // Ostatni segment - plik lub folder
          if (current[part] && typeof current[part] === "object") {
            // Węzeł już istnieje (może mieć dzieci z poprzednich plików)
            // Aktualizujemy właściwości, ale zachowujemy istniejące klucze (dzieci)
            current[part].type = file.type;
            current[part].language = file.language;
            current[part].size = file.size;
            current[part].lines = file.lines;
          } else {
            // Nowy węzeł
            current[part] = {
              type: file.type,
              language: file.language,
              size: file.size,
              lines: file.lines,
            };
          }
        } else {
          // Pośredni segment (folder)
          if (!current[part]) {
            current[part] = {};
          }
          // Jeśli current[part] jest obiektem z właściwościami (np. type, language),
          // ale nie ma kluczy-dzieci, to traktujemy go jako folder i przechodzimy dalej.
          current = current[part];
        }
      });
    });

    return this.formatTree(tree);
  }

  private static formatTree(
    tree: Record<string, any>,
    prefix = ""
  ): string {
    let result = "";
    // Klucze, które są właściwościami metadanych, a nie dziećmi
    const metadataKeys = ["type", "language", "size", "lines"];
    // Pobierz klucze, które są dziećmi (nie są metadanymi)
    const childKeys = Object.keys(tree).filter(
      (key) => !metadataKeys.includes(key)
    );
    childKeys.sort();

    childKeys.forEach((key, index) => {
      const isLast = index === childKeys.length - 1;
      const connector = isLast ? "└── " : "├── ";
      const childPrefix = prefix + (isLast ? "    " : "│   ");

      const node = tree[key];
      if (node.type === "folder") {
        result += `${prefix}${connector}${key}/\n`;
        // Rekurencyjnie formatuj dzieci, przekazując cały obiekt node
        result += this.formatTree(node, childPrefix);
      } else {
        const size =
          node.size && node.lines
            ? ` (${Math.ceil(node.size / 1024)}KB, ${node.lines} lines)`
            : "";
        result += `${prefix}${connector}${key} [${node.language}${size}]\n`;
      }
    });

    return result;
  }
}
