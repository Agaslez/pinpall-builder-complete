export interface CodeBlock {
  content: string;
  language?: string;
  startLine: number;
}

export class CodeBlockExtractor {
  private static readonly CODE_BLOCK_REGEX = /```(\w+)?\n([\s\S]*?)```/g;
  private static readonly POWERSHELL_REGEX = /Create-File\s+-Path\s+"([^"]+)"\s+-Content\s+@'([\s\S]*?)'@/gi;

  extractMarkdown(content: string): CodeBlock[] {
    const blocks: CodeBlock[] = [];
    const regex = new RegExp(CodeBlockExtractor.CODE_BLOCK_REGEX);
    let match;

    while ((match = regex.exec(content)) !== null) {
      blocks.push({
        content: match[2].trim(),
        language: match[1],
        startLine: content.substring(0, match.index).split('\n').length,
      });
    }

    return blocks;
  }

  extractPowerShell(content: string): Array<{ path: string; content: string }> {
    const results: Array<{ path: string; content: string }> = [];
    const regex = new RegExp(CodeBlockExtractor.POWERSHELL_REGEX);
    let match;

    while ((match = regex.exec(content)) !== null) {
      results.push({ path: match[1], content: match[2].trim() });
    }

    return results;
  }
}
