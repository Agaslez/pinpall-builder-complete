// Client-side Chat Parser - Works 100% offline for small files!

export interface FileInstruction {
  path: string;
  content: string;
  type: 'file' | 'folder';
  language?: string;
}

export interface ParsedChat {
  files: FileInstruction[];
  unrecognizedBlocks: {
    content: string;
    context: string;
    lineNumber: number;
    suggestedType?: string;
  }[];
}

export class ClientChatParser {
  constructor(private content: string) {}

  public parse(): ParsedChat {
    const lines = this.content.split('\n');
    const unrecognizedBlocks: ParsedChat['unrecognizedBlocks'] = [];
    const files: FileInstruction[] = [];

    try {
      // Extract file paths and structure
      const fileMap = new Map<string, { type: 'file' | 'folder'; language?: string; content: string }>();

      // 1. Detect folder structure from markdown trees
      const treePattern = /^[\s\-\*]+(.+?)(?:\/)?$/gm;
      const codeBlockPattern = /```(\w+)?\n([\s\S]*?)```/gm;
      
      // 2. Extract code blocks with language detection
      let match;
      let blockIndex = 0;
      while ((match = codeBlockPattern.exec(this.content)) !== null) {
        const language = match[1] || 'txt';
        const blockContent = match[2];
        
        // Try to detect filename from context
        const beforeBlock = this.content.substring(Math.max(0, match.index - 200), match.index);
        const fileMatch = beforeBlock.match(/(?:file|path|:\s*|`)([\w\-/.]+\.[\w]+)(?:`|,|\s)/i);
        
        if (fileMatch) {
          const filePath = fileMatch[1];
          fileMap.set(filePath, {
            type: 'file',
            language,
            content: blockContent.trim()
          });
        } else {
          // Auto-generate filename
          const autoName = `file_${blockIndex}.${language === 'txt' ? 'txt' : language}`;
          fileMap.set(autoName, {
            type: 'file',
            language,
            content: blockContent.trim()
          });
          blockIndex++;
        }
      }

      // 3. Detect folder structures (nested paths)
      const pathPattern = /(?:src|components|pages|utils|hooks|lib|server|client)\/[\w\-/.]+/gi;
      const pathMatches = this.content.match(pathPattern) || [];
      pathMatches.forEach(path => {
        if (!fileMap.has(path)) {
          fileMap.set(path, {
            type: 'file',
            content: ''
          });
        }
      });

      // 4. Convert to FileInstruction array
      fileMap.forEach((value, path) => {
        files.push({
          path,
          content: value.content,
          type: value.type,
          language: value.language
        });
      });

      // 5. Find unrecognized elements
      const recognizedContent = new Set<string>();
      files.forEach(f => {
        if (f.content) {
          recognizedContent.add(f.content.substring(0, 50));
        }
      });

      // Check for orphaned code blocks
      while ((match = codeBlockPattern.exec(this.content)) !== null) {
        const blockContent = match[2];
        const contentSnippet = blockContent.substring(0, 50);
        
        if (!Array.from(recognizedContent).some(rc => rc === contentSnippet)) {
          unrecognizedBlocks.push({
            content: blockContent.substring(0, 500),
            context: `Unmatched code block (${match[1] || 'unknown'})`,
            lineNumber: this.content.substring(0, match.index).split('\n').length,
            suggestedType: 'Orphaned Code'
          });
        }
      }

      return { files, unrecognizedBlocks };
    } catch (error) {
      return {
        files,
        unrecognizedBlocks: [{
          content: String(error),
          context: 'Client parser error',
          lineNumber: 0,
          suggestedType: 'Error'
        }]
      };
    }
  }
}
