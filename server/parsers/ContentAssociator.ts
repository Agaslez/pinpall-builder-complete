export interface FileWithContent {
  path: string;
  content: string;
  language?: string;
  type: 'file' | 'folder';
}

export class ContentAssociator {
  associate(
    treeFiles: Map<string, { type: 'file' | 'folder'; language?: string }>,
    sections: Array<{ name: string; content: string }>
  ): Map<string, FileWithContent> {
    const result = new Map<string, FileWithContent>();

    sections.forEach(section => {
      const treeFile = this.findMatchingFile(section.name, treeFiles);
      if (treeFile) {
        const [path, meta] = treeFile;
        result.set(path, {
          path,
          content: section.content,
          language: meta.language,
          type: 'file',
        });
      }
    });

    Array.from(treeFiles.entries()).forEach(([path, meta]) => {
      if (!result.has(path)) {
        result.set(path, { path, content: '', type: meta.type, language: meta.language });
      }
    });

    return result;
  }

  private findMatchingFile(
    sectionName: string,
    treeFiles: Map<string, { type: 'file' | 'folder'; language?: string }>
  ): [string, { type: 'file' | 'folder'; language?: string }] | null {
    const normalized = sectionName.trim();
    const entries = Array.from(treeFiles.entries());

    for (const [path, meta] of entries) {
      if (meta.type === 'file' && path.endsWith('/' + normalized)) return [path, meta];
      if (meta.type === 'file' && path === normalized) return [path, meta];
      if (meta.type === 'file' && path.includes('/' + normalized)) return [path, meta];
    }

    return null;
  }
}
