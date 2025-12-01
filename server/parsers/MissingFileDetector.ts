export interface MissingFileReport {
  path: string;
  reason: 'empty' | 'structure_only' | 'mentioned_but_no_content';
  suggestion?: string;
}

export class MissingFileDetector {
  /**
   * Detects files that were mentioned in tree but have no content
   */
  detectMissingContent(
    files: Map<string, { content: string; type: 'file' | 'folder' }>
  ): MissingFileReport[] {
    const missing: MissingFileReport[] = [];

    Array.from(files.entries()).forEach(([path, meta]) => {
      if (meta.type === 'file' && (!meta.content || meta.content.trim() === '')) {
        missing.push({
          path,
          reason: 'empty',
          suggestion: `File "${path}" is in tree structure but has no content in transcript`,
        });
      }
    });

    return missing;
  }

  /**
   * Analyzes unrecognized blocks to find orphaned code
   */
  findOrphanedCode(unrecognized: string[]): Array<{ code: string; suggestion: string }> {
    const orphaned: Array<{ code: string; suggestion: string }> = [];

    unrecognized.forEach(block => {
      const lines = block.split('\n');
      const firstLine = lines[0] || '';

      // Detect common file patterns in orphaned code
      if (firstLine.includes('import') || firstLine.includes('from')) {
        orphaned.push({
          code: block,
          suggestion: 'Likely JavaScript/TypeScript code - check if file name mentioned nearby',
        });
      } else if (firstLine.includes('def ') || firstLine.includes('class ')) {
        orphaned.push({
          code: block,
          suggestion: 'Likely Python code - assign to .py file',
        });
      } else if (firstLine.includes('version:') || firstLine.includes('services:')) {
        orphaned.push({
          code: block,
          suggestion: 'Likely docker-compose.yml or YAML config',
        });
      }
    });

    return orphaned;
  }
}
