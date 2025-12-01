interface FileInstruction {
  path: string;
  content: string;
  type: 'file' | 'folder';
  language?: string;
}

interface ParsedChat {
  files: FileInstruction[];
  unrecognizedBlocks: {
    content: string;
    context: string;
    lineNumber: number;
    suggestedType?: string;
  }[];
}

import { TreeExtractor, ChatGPTSectionParser, CodeBlockExtractor, ContentAssociator, MissingFileDetector } from './parsers';

export class ChatParser {
  private treeExtractor = new TreeExtractor();
  private sectionParser = new ChatGPTSectionParser();
  private codeExtractor = new CodeBlockExtractor();
  private associator = new ContentAssociator();
  private missingDetector = new MissingFileDetector();

  constructor(private content: string) {}

  public parse(): ParsedChat {
    const lines = this.content.split('\n');
    const unrecognizedBlocks: ParsedChat['unrecognizedBlocks'] = [];

    try {
      // 1. Extract tree structure
      const treeNodes = this.treeExtractor.extract(lines);
      const treeFiles = new Map<string, { type: 'file' | 'folder'; language?: string }>();
      treeNodes.forEach(node => {
        treeFiles.set(node.path, { type: node.type, language: node.language });
      });

      // 2. Extract ChatGPT sections
      const sections = this.sectionParser.parse(lines);

      // 3. Extract code blocks
      const codeBlocks = this.codeExtractor.extractMarkdown(this.content);

      // 4. Extract PowerShell files
      const psFiles = this.codeExtractor.extractPowerShell(this.content);
      psFiles.forEach(psFile => {
        sections.push({ name: psFile.path, content: psFile.content });
      });

      // 5. Associate content with files
      const files = this.associator.associate(treeFiles, sections);
      const filesWithMeta = new Map(Array.from(files.entries()).map(([k, v]) => [k, { content: v.content, type: v.type }]));

      // 6. Detect missing files
      const missingFiles = this.missingDetector.detectMissingContent(filesWithMeta);
      missingFiles.forEach(missing => {
        if (missing.suggestion) {
          unrecognizedBlocks.push({
            content: `[FILE INCOMPLETE] ${missing.path}`,
            context: missing.reason,
            lineNumber: 0,
            suggestedType: 'Missing Content',
          });
        }
      });

      // 7. Handle unmatched code blocks
      const orphanedCode: string[] = [];
      codeBlocks.forEach(block => {
        const hasMatch = Array.from(files.values()).some(f => 
          f.content.includes(block.content.split('\n')[0].substring(0, 20))
        );

        if (!hasMatch && block.content.length > 10) {
          orphanedCode.push(block.content);
          unrecognizedBlocks.push({
            content: block.content,
            context: `Code block (${block.language || 'unknown'})`,
            lineNumber: block.startLine,
            suggestedType: block.language || 'Code',
          });
        }
      });

      // 8. Analyze orphaned code for suggestions
      const suggestions = this.missingDetector.findOrphanedCode(orphanedCode);
      suggestions.forEach(suggestion => {
        unrecognizedBlocks.push({
          content: `[SUGGESTION] ${suggestion.suggestion}`,
          context: 'Auto-detected from orphaned code',
          lineNumber: 0,
          suggestedType: 'Suggestion',
        });
      });

      return {
        files: Array.from(files.values()),
        unrecognizedBlocks,
      };
    } catch (error) {
      console.error('ChatParser error:', error);
      return {
        files: [],
        unrecognizedBlocks: [{
          content: String(error),
          context: 'Parse error',
          lineNumber: 0,
          suggestedType: 'Error',
        }],
      };
    }
  }
}
