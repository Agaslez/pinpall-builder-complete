export interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  language?: string;
}

export class TreeExtractor {
  private treeStart = -1;
  private treeEnd = -1;

  extract(lines: string[]): TreeNode[] {
    this.findTreeBoundaries(lines);
    if (this.treeStart === -1) return [];

    const nodes: TreeNode[] = [];
    const pathStack: string[] = [];

    for (let i = this.treeStart; i < (this.treeEnd >= 0 ? this.treeEnd : lines.length) && i < lines.length; i++) {
      const line = lines[i];
      if (line.trim() === '') break;

      const parsed = this.parseLine(line);
      if (!parsed) continue;

      const { depth, name, isFolder } = parsed;
      pathStack.length = depth;
      pathStack[depth - 1] = name;

      const fullPath = pathStack.join('/');
      nodes.push({
        name,
        path: fullPath,
        type: isFolder ? 'folder' : 'file',
        language: !isFolder ? this.detectLanguage(fullPath) : undefined,
      });
    }

    return nodes;
  }

  private findTreeBoundaries(lines: string[]): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      if (this.treeStart === -1 && /^[a-zA-Z0-9_.\-]+\/$|^[a-zA-Z0-9_.\-]+\//.test(trimmed)) {
        this.treeStart = i;
      }
      if (this.treeStart !== -1 && this.treeEnd === -1 && (/^📦|^[a-zA-Z].*:\s*$|^Pliki/.test(trimmed) || line === '')) {
        this.treeEnd = i;
        break;
      }
    }
  }

  private parseLine(line: string): { depth: number; name: string; isFolder: boolean } | null {
    const match = line.match(/^([\s│├└─]*)(.*?)(\/$)?$/);
    if (!match) return null;

    const prefix = match[1];
    const name = match[2].trim();
    if (!name) return null;

    const depth = Math.ceil((prefix.length + 1) / 3);
    const isFolder = match[3] === '/' || !name.includes('.');

    return { depth: Math.max(1, depth), name: name.replace(/\/$/, ''), isFolder };
  }

  private detectLanguage(path: string): string | undefined {
    const ext = path.split('.').pop()?.toLowerCase();
    const map: Record<string, string> = {
      js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
      py: 'python', java: 'java', cpp: 'cpp', cs: 'csharp', php: 'php',
      rb: 'ruby', go: 'go', rs: 'rust', html: 'html', css: 'css',
      scss: 'scss', json: 'json', xml: 'xml', yml: 'yaml', yaml: 'yaml',
      md: 'markdown', sql: 'sql', sh: 'bash',
    };
    return map[ext || ''];
  }
}
