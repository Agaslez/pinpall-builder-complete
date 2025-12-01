// server/chatParser.ts
import {
  ChatGPTSectionParser,
  CodeBlockExtractor,
  ContentAssociator,
  MissingFileDetector,
  TreeExtractor,
} from "./parsers";
import { UniversalFileParser } from "./UniversalFileParser";

interface FileInstruction {
  path: string;
  content: string;
  type: "file" | "folder";
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

export class ChatParser {
  private treeExtractor = new TreeExtractor();
  private sectionParser = new ChatGPTSectionParser();
  private codeExtractor = new CodeBlockExtractor();
  private associator = new ContentAssociator();
  private missingDetector = new MissingFileDetector();

  constructor(private content: string) {}

  public parse(): ParsedChat {
    const lines = this.content.split("\n");
    const unrecognizedBlocks: ParsedChat["unrecognizedBlocks"] = [];

    try {
      // 1. Drzewo plików z czatu
      const treeNodes = this.treeExtractor.extract(lines);
      const treeFiles = new Map<
        string,
        { type: "file" | "folder"; language?: string }
      >();

      treeNodes.forEach((node) => {
        treeFiles.set(node.path, { type: node.type, language: node.language });
      });

      // 2. Sekcje ChatGPT (FILE:, EXPLANATION itd.)
      const sections = this.sectionParser.parse(lines);

      // 3. Bloki kodu z markdowna
      const codeBlocks = this.codeExtractor.extractMarkdown(this.content);

      // 4. Dodatkowe pliki PowerShell (special case)
      const psFiles = this.codeExtractor.extractPowerShell(this.content);
      psFiles.forEach((psFile) => {
        sections.push({ name: psFile.path, content: psFile.content });
      });

      // 5. Skojarzenie treści z plikami (drzewo + sekcje)
      const files = this.associator.associate(treeFiles, sections);

      // mapka pod MissingFileDetector (content + typ pliku)
      const filesWithMeta = new Map(
        Array.from(files.entries()).map(([k, v]) => [
          k,
          { content: v.content, type: v.type },
        ])
      );

      // 6. Wykrywanie brakujących plików / niedokończonych treści
      const missingFiles = this.missingDetector.detectMissingContent(
        filesWithMeta
      );
      missingFiles.forEach((missing) => {
        if (missing.suggestion) {
          unrecognizedBlocks.push({
            content: `[FILE INCOMPLETE] ${missing.path}`,
            context: missing.reason,
            lineNumber: 0,
            suggestedType: "Missing Content",
          });
        }
      });

      // 7. Sieroty po kodzie (codeblocki nieprzypięte do plików)
      const orphanedCode: string[] = [];
      codeBlocks.forEach((block) => {
        const firstLine = block.content.split("\n")[0] || "";
        const snippet = firstLine.substring(0, 20);

        const hasMatch = Array.from(files.values()).some((f) =>
          f.content.includes(snippet)
        );

        if (!hasMatch && block.content.length > 10) {
          orphanedCode.push(block.content);
          unrecognizedBlocks.push({
            content: block.content,
            context: `Code block (${block.language || "unknown"})`,
            lineNumber: block.startLine,
            suggestedType: block.language || "Code",
          });
        }
      });

      // 8. Sugestie na podstawie sierot
      const suggestions = this.missingDetector.findOrphanedCode(orphanedCode);
      suggestions.forEach((suggestion) => {
        unrecognizedBlocks.push({
          content: `[SUGGESTION] ${suggestion.suggestion}`,
          context: "Auto-detected from orphaned code",
          lineNumber: 0,
          suggestedType: "Suggestion",
        });
      });

      // 9. Wzbogacenie plików o język z UniversalFileParser (bez dotykania dysku)
      const enrichedFiles: FileInstruction[] = [];

      for (const [filePath, file] of files.entries()) {
        if (file.type === "folder") {
          enrichedFiles.push({
            path: filePath,
            content: "",
            type: "folder",
          });
          continue;
        }

        const analyzed = UniversalFileParser.parseContent(
          file.content,
          filePath
        );

        enrichedFiles.push({
          path: filePath,
          content: file.content,
          type: "file",
          language: analyzed.language,
        });
      }

      const result: ParsedChat = {
        files: enrichedFiles,
        unrecognizedBlocks,
      };

      // prosty sanity-check
      if (result.files.length === 0 && result.unrecognizedBlocks.length === 0) {
        throw new Error("Parser produced no files and no unrecognized blocks");
      }

      return result;
    } catch (error) {
      console.error("ChatParser error:", error);

      return {
        files: [],
        unrecognizedBlocks: [
          {
            content: String(error),
            context: "Parse error",
            lineNumber: 0,
            suggestedType: "Error",
          },
        ],
      };
    }
  }
}
