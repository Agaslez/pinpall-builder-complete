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
      const trimmed = line.trim();
      
      // Pomijaj puste linie wewnątrz drzewa
      if (trimmed === '') continue;

      // Jeśli linia nie wygląda jak część drzewa, przerwij
      if (!this.looksLikeTreeLine(line) && i > this.treeStart) {
        break;
      }

      const parsed = this.parseLine(line);
      if (!parsed) continue;

      const { depth, name, isFolder } = parsed;
      
      // BEZPIECZEŃSTWO: Walidacja nazwy pliku/folderu
      const safeName = this.sanitizeFileName(name);
      if (!safeName) continue;
      
      // Dostosuj głębokość - jeśli stack jest pusty, zacznij od depth=1
      const adjustedDepth = pathStack.length === 0 ? 1 : depth;
      pathStack.length = adjustedDepth;
      pathStack[adjustedDepth - 1] = safeName;

      // Zbuduj pełną ścieżkę - usuń puste elementy
      const fullPath = pathStack.filter(p => p && p.trim()).join('/');
      
      nodes.push({
        name: safeName,
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

      // Szukamy początku drzewa - linie z ├──, └──, │ itp. LUB linie z /
      if (this.treeStart === -1) {
        if (this.looksLikeTreeLine(line) ||
            (trimmed.endsWith('/') && !trimmed.includes(' ')) ||
            (trimmed.includes('/') && (trimmed.includes('├') || trimmed.includes('└')))) {
          this.treeStart = i;
          console.log(`Found tree start at line ${i}: "${line}"`);
        }
      }
      
      // Jeśli znaleźliśmy początek, szukamy końca
      if (this.treeStart !== -1 && this.treeEnd === -1 && i > this.treeStart) {
        // Koniec gdy linia nie wygląda jak część drzewa I nie jest pusta
        // ORAZ następna linia też nie wygląda jak drzewo
        if (!this.looksLikeTreeLine(line) && trimmed !== '') {
          // Sprawdź czy następna linia też nie jest drzewem
          const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
          if (!this.looksLikeTreeLine(nextLine) && nextLine.trim() !== '') {
            this.treeEnd = i;
            console.log(`Found tree end at line ${i}: "${line}"`);
            break;
          }
        }
      }
    }
  }

  private looksLikeTreeLine(line: string): boolean {
    const trimmed = line.trim();
    if (trimmed === '') return false;
    
    return /^[│├└─\s]+[^│├└─\s]/.test(line) || 
           /^[\s]*[├└][─\s]/.test(line) ||
           /^[\s]*[│\s]/.test(line) ||
           /^[\s]*[^\s]/.test(line) && (trimmed.endsWith('/') || trimmed.includes('├') || trimmed.includes('└'));
  }

  private parseLine(line: string): { depth: number; name: string; isFolder: boolean } | null {
    // Usuń znaki drzewa i białe znaki
    const cleanLine = line.replace(/^[│├└─\s]+/, '').trim();
    if (!cleanLine) return null;

    // Określ głębokość na podstawie liczby znaków drzewa
    const treeChars = line.match(/^[│├└─\s]+/)?.[0] || '';
    const depth = Math.max(1, Math.floor(treeChars.length / 2));
    
    // Określ czy to folder (kończy się na / lub nie ma kropki)
    const hasExtension = /\.[a-zA-Z0-9]{2,}$/.test(cleanLine);
    const isFolder = cleanLine.endsWith('/') || !hasExtension;
    
    // Wyczyść nazwę (usuń / na końcu)
    const name = cleanLine.replace(/\/$/, '');
    
    return { depth, name, isFolder };
  }

  private sanitizeFileName(name: string): string | null {
    // BEZPIECZEŃSTWO: Odrzuć niebezpieczne nazwy
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
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(name)) {
        console.warn(`Rejected dangerous filename: ${name}`);
        return null;
      }
    }
    
    // Ogranicz długość
    if (name.length > 255) {
      console.warn(`Filename too long: ${name}`);
      return null;
    }
    
    // Usuń nadmiarowe spacje
    return name.trim();
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
