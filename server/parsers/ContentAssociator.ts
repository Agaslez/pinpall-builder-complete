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
    
    console.log('\n=== CONTENT ASSOCIATOR DEBUG ===');
    console.log('Tree files:');
    Array.from(treeFiles.entries()).forEach(([path, meta]) => {
      console.log(`  - ${path} (${meta.type})`);
    });
    
    console.log('\nSections:');
    sections.forEach((section, i) => {
      console.log(`  ${i+1}. ${section.name} (${section.content.length} chars)`);
    });

    // Najpierw spróbuj połączyć sekcje z plikami
    sections.forEach(section => {
      // BEZPIECZEŃSTWO: Sanityzuj nazwę sekcji
      const safeSectionName = this.sanitizePath(section.name);
      if (!safeSectionName) {
        console.warn(`ContentAssociator: Rejected dangerous section name: ${section.name}`);
        return;
      }
      
      const treeFile = this.findMatchingFile(safeSectionName, treeFiles);
      if (treeFile) {
        const [path, meta] = treeFile;
        console.log(`\nMatched section "${safeSectionName}" to file "${path}"`);
        
        result.set(path, {
          path,
          content: section.content,
          language: meta.language,
          type: 'file',
        });
      } else {
        console.log(`\nNo match found for section "${safeSectionName}"`);
        
        // Jeśli nie znaleziono matcha, utwórz nowy plik
        const newPath = safeSectionName;
        const language = this.detectLanguageFromContent(section.content, newPath);
        
        result.set(newPath, {
          path: newPath,
          content: section.content,
          language,
          type: 'file',
        });
      }
    });

    // Dodaj pozostałe pliki z drzewa (te bez sekcji)
    Array.from(treeFiles.entries()).forEach(([path, meta]) => {
      // BEZPIECZEŃSTWO: Sprawdź czy ścieżka jest bezpieczna
      if (!this.sanitizePath(path)) {
        console.warn(`ContentAssociator: Rejected dangerous tree file path: ${path}`);
        return;
      }
      
      if (!result.has(path)) {
        console.log(`\nAdding tree file without section: ${path}`);
        result.set(path, { 
          path, 
          content: '', 
          type: meta.type, 
          language: meta.language 
        });
      }
    });

    console.log('\n=== FINAL ASSOCIATED FILES ===');
    Array.from(result.entries()).forEach(([path, file], i) => {
      console.log(`  ${i+1}. ${path} (${file.type}, ${file.content.length} chars)`);
    });

    return result;
  }

  private findMatchingFile(
    sectionName: string,
    treeFiles: Map<string, { type: 'file' | 'folder'; language?: string }>
  ): [string, { type: 'file' | 'folder'; language?: string }] | null {
    const normalizedSection = sectionName.toLowerCase().trim();
    
    // 1. Exact match (cała ścieżka)
    for (const [path, meta] of treeFiles.entries()) {
      if (path.toLowerCase() === normalizedSection) {
        return [path, meta];
      }
    }

    // 2. Match po nazwie pliku (ostatnia część ścieżki)
    for (const [path, meta] of treeFiles.entries()) {
      const fileName = path.split('/').pop()?.toLowerCase();
      if (fileName === normalizedSection) {
        return [path, meta];
      }
    }
    
    // 3. Partial match (ścieżka zawiera nazwę sekcji) - tylko dla plików
    for (const [path, meta] of treeFiles.entries()) {
      if (meta.type === 'file' && path.toLowerCase().includes(normalizedSection)) {
        return [path, meta];
      }
    }
    
    return null;
  }
  
  private detectLanguageFromContent(content: string, filename: string = ''): string | undefined {
    // Najpierw spróbuj po rozszerzeniu pliku
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext) {
      const extMap: Record<string, string> = {
        js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
        py: 'python', java: 'java', cpp: 'cpp', cs: 'csharp', php: 'php',
        rb: 'ruby', go: 'go', rs: 'rust', html: 'html', css: 'css',
        scss: 'scss', json: 'json', xml: 'xml', yml: 'yaml', yaml: 'yaml',
        md: 'markdown', sql: 'sql', sh: 'bash', ps1: 'powershell',
      };
      if (extMap[ext]) {
        return extMap[ext];
      }
    }
    
    // Wykryj język na podstawie zawartości
    const firstLine = content.split('\n')[0] || '';
    
    if (content.includes('console.log') || content.includes('const ') || content.includes('let ') || content.includes('var ') || content.includes('function ') || content.includes('export ') || content.includes('import ')) {
      return 'javascript';
    }
    if (content.includes('def ') || content.includes('import ') || content.includes('print(')) {
      return 'python';
    }
    if (content.trim().startsWith('{') && content.trim().endsWith('}')) {
      try {
        JSON.parse(content);
        return 'json';
      } catch {
        // Nie jest JSON
      }
    }
    if (content.includes('<?xml') || content.includes('<xml')) {
      return 'xml';
    }
    if (content.includes('<!DOCTYPE html>') || content.includes('<html')) {
      return 'html';
    }
    if (content.includes('@media') || content.includes('{') && content.includes('}') && content.includes(':')) {
      return 'css';
    }
    
    return undefined;
  }
  
  private sanitizePath(path: string): string | null {
    // BEZPIECZEŃSTWO: Odrzuć niebezpieczne ścieżki
    const dangerousPatterns = [
      /^\.\./, // ../
      /\/\.\.\//, // folder/../
      /^\//, // absolutne ścieżki
      /^[A-Za-z]:\\/, // Windows drive paths
      /\0/, // null bytes
      /[<>:"|?*]/, // niebezpieczne znaki Windows
      /\s$/, // spacje na końcu
      /^\.$/, // .
      /^\.\.$/, // ..
      /node_modules/, // unikaj node_modules
      /\.git/, // unikaj .git
      /\/\//, // podwójne slashe
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(path)) {
        console.warn(`ContentAssociator: Rejected dangerous path: ${path}`);
        return null;
      }
    }
    
    // Ogranicz długość
    if (path.length > 500) {
      console.warn(`ContentAssociator: Path too long: ${path}`);
      return null;
    }
    
    // Usuń nadmiarowe spacje
    return path.trim();
  }
}
