export interface FileSection {
  name: string;
  content: string;
}

export class ChatGPTSectionParser {
  parse(lines: string[]): FileSection[] {
    const sections: FileSection[] = [];
    let currentSection: FileSection | null = null;
    let inCodeBlock = false;
    let codeBlockLanguage = '';
    let codeBlockContent: string[] = [];
    let pendingSection: FileSection | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Sprawdź czy zaczyna się blok kodu
      if (trimmed.startsWith('```')) {
        if (!inCodeBlock) {
          // Początek bloku kodu
          inCodeBlock = true;
          codeBlockLanguage = trimmed.replace(/^```/, '').trim();
          codeBlockContent = [];
          
          // Jeśli mamy pending section (FILE: bez bloku kodu), ustaw jako current
          if (pendingSection && !currentSection) {
            currentSection = pendingSection;
            pendingSection = null;
          }
        } else {
          // Koniec bloku kodu
          inCodeBlock = false;
          
          // Jeśli mamy aktywną sekcję, dodaj zawartość bloku kodu
          if (currentSection && codeBlockContent.length > 0) {
            currentSection.content = codeBlockContent.join('\n');
            sections.push(currentSection);
            currentSection = null;
            pendingSection = null;
          }
        }
        continue;
      }

      if (inCodeBlock) {
        // Zbierz zawartość bloku kodu
        codeBlockContent.push(line);
        continue;
      }

      // Szukaj nagłówków sekcji (## Nazwa pliku) - teraz akceptuje też nazwy bez rozszerzeń
      const sectionMatch = trimmed.match(/^##\s+(.+)$/);
      if (sectionMatch) {
        // Jeśli mamy poprzednią sekcję bez zawartości, ją usuń
        if (currentSection && !currentSection.content.trim()) {
          currentSection = null;
        }
        
        // Rozpocznij nową sekcję
        const sectionName = sectionMatch[1].trim();
        
        // Wyodrębnij nazwę pliku z nawiasów jeśli istnieją
        let fileName = sectionName;
        const fileNameMatch = sectionName.match(/(.+?)\s*\(/);
        if (fileNameMatch) {
          fileName = fileNameMatch[1].trim();
        }
        
        // BEZPIECZEŃSTWO: Sanityzuj nazwę pliku
        const safeFileName = this.sanitizeFileName(fileName);
        if (!safeFileName) {
          currentSection = null;
          continue;
        }
        
        currentSection = {
          name: safeFileName,
          content: ''
        };
        pendingSection = null;
        continue;
      }

      // Szukaj formatu FILE: nazwa_pliku
      const fileSectionMatch = trimmed.match(/^FILE:\s*(.+)$/i);
      if (fileSectionMatch) {
        const fileName = fileSectionMatch[1].trim();
        
        // BEZPIECZEŃSTWO: Sanityzuj nazwę pliku
        const safeFileName = this.sanitizeFileName(fileName);
        if (!safeFileName || !this.isValidFileName(safeFileName)) {
          currentSection = null;
          pendingSection = null;
          continue;
        }
        
        // Jeśli mamy poprzednią sekcję bez zawartości, ją usuń
        if (currentSection && !currentSection.content.trim()) {
          currentSection = null;
        }
        
        // Utwórz pending section - będzie aktywna gdy pojawi się blok kodu
        pendingSection = {
          name: safeFileName,
          content: ''
        };
        currentSection = null;
        continue;
      }

      // Szukaj innych formatów (EXPLANATION:, NOTE:, TODO: - nie są plikami)
      const otherSectionMatch = trimmed.match(/^(EXPLANATION|NOTE|TODO|INFO|WARNING):/i);
      if (otherSectionMatch) {
        // To nie jest plik, więc resetujemy sekcje
        currentSection = null;
        pendingSection = null;
        continue;
      }

      // Jeśli mamy pending section (FILE: czeka na blok kodu), ignoruj treść
      if (pendingSection) {
        continue;
      }

      // Jeśli mamy aktywną sekcję i to nie jest pusta linia, dodaj do zawartości
      if (currentSection && trimmed && !trimmed.startsWith('##') && !trimmed.startsWith('```')) {
        if (currentSection.content) {
          currentSection.content += '\n' + line;
        } else {
          currentSection.content = line;
        }
      }
    }

    // Dodaj ostatnią sekcję jeśli istnieje
    if (currentSection && currentSection.content.trim()) {
      sections.push(currentSection);
    }

    return sections.filter(s => s.content.length > 0 && this.isValidFileName(s.name));
  }

  private isValidFileName(name: string): boolean {
    const trimmed = name.trim();
    // Zaakceptuj nazwy plików z rozszerzeniami LUB bez rozszerzeń
    return /^[a-zA-Z0-9._\-/]+$/.test(trimmed);
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
        console.warn(`ChatGPTSectionParser: Rejected dangerous filename: ${name}`);
        return null;
      }
    }
    
    // Ogranicz długość
    if (name.length > 255) {
      console.warn(`ChatGPTSectionParser: Filename too long: ${name}`);
      return null;
    }
    
    // Usuń nadmiarowe spacje
    return name.trim();
  }
}
