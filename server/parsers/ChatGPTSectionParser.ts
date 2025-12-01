export interface FileSection {
  name: string;
  content: string;
}

export class ChatGPTSectionParser {
  parse(lines: string[]): FileSection[] {
    const sections: FileSection[] = [];
    let sectionStart = -1;
    let currentFileName = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (this.isFileSectionStart(line, i, lines)) {
        if (currentFileName && sectionStart !== -1) {
          sections.push({
            name: currentFileName,
            content: lines.slice(sectionStart, i).join('\n').trim(),
          });
        }
        currentFileName = line.trim();
        sectionStart = i + 1;
      }
    }

    if (currentFileName && sectionStart !== -1) {
      sections.push({
        name: currentFileName,
        content: lines.slice(sectionStart).join('\n').trim(),
      });
    }

    return sections.filter(s => s.content.length > 0 && this.isValidFileName(s.name));
  }

  private isFileSectionStart(line: string, index: number, lines: string[]): boolean {
    const trimmed = line.trim();
    if (!trimmed) return false;

    const hasFileExtension = /\.[a-z0-9]{2,}$/i.test(trimmed);
    const isNotCodeLine = !trimmed.startsWith('  ') && !trimmed.startsWith('\t');
    const isNotConfiguration = !/^[A-Z_]+\s*=|^#/.test(trimmed);

    if (!hasFileExtension || !isNotCodeLine || !isNotConfiguration) return false;

    const nextLine = lines[index + 1]?.trim() || '';
    return nextLine.length > 0 && !nextLine.includes('://');
  }

  private isValidFileName(name: string): boolean {
    const trimmed = name.trim();
    return /^[a-zA-Z0-9._\-/]+\.[a-zA-Z0-9]+$/.test(trimmed) && !trimmed.includes(' ');
  }
}
