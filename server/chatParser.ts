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
    console.log('=== CHAT PARSER START ===');
    console.log('Content length:', this.content.length, 'chars');
    
    const lines = this.content.split("\n");
    const unrecognizedBlocks: ParsedChat["unrecognizedBlocks"] = [];

    try {
      // 1. Drzewo plików z czatu
      console.log('\n=== STEP 1: TreeExtractor ===');
      const treeNodes = this.treeExtractor.extract(lines);
      const treeFiles = new Map<
        string,
        { type: "file" | "folder"; language?: string }
      >();

      treeNodes.forEach((node) => {
        treeFiles.set(node.path, { type: node.type, language: node.language });
      });
      
      console.log('Tree files found:', treeNodes.length);
      treeNodes.forEach((node, i) => {
        console.log(`  ${i+1}. ${node.path} (${node.type})`);
      });

      // 2. Sekcje ChatGPT (FILE:, EXPLANATION itd.)
      console.log('\n=== STEP 2: ChatGPTSectionParser ===');
      const sections = this.sectionParser.parse(lines);
      console.log('Sections found:', sections.length);
      sections.forEach((section, i) => {
        console.log(`  ${i+1}. ${section.name} (${section.content.length} chars)`);
      });

      // 3. Bloki kodu z markdowna
      console.log('\n=== STEP 3: CodeBlockExtractor ===');
      const codeBlocks = this.codeExtractor.extractMarkdown(this.content);
      console.log('Code blocks found:', codeBlocks.length);
      codeBlocks.forEach((block, i) => {
        console.log(`  ${i+1}. ${block.language || 'unknown'} (${block.content.length} chars)`);
      });

      // 4. Dodatkowe pliki PowerShell (special case)
      const psFiles = this.codeExtractor.extractPowerShell(this.content);
      psFiles.forEach((psFile) => {
        sections.push({ name: psFile.path, content: psFile.content });
      });
      if (psFiles.length > 0) {
        console.log('PowerShell files found:', psFiles.length);
      }

      // 5. Skojarzenie treści z plikami (drzewo + sekcje)
      console.log('\n=== STEP 5: ContentAssociator ===');
      console.log('Tree files map size:', treeFiles.size);
      console.log('Sections count:', sections.length);
      
      const files = this.associator.associate(treeFiles, sections);
      console.log('Associated files:', files.size);
      Array.from(files.entries()).forEach(([path, file], i) => {
        console.log(`  ${i+1}. ${path} (${file.type}, ${file.content.length} chars)`);
      });

      // mapka pod MissingFileDetector (content + typ pliku)
      const filesWithMeta = new Map(
        Array.from(files.entries()).map(([k, v]) => [
          k,
          { content: v.content, type: v.type },
        ])
      );

      // 6. Wykrywanie brakujących plików / niedokończonych treści
      console.log('\n=== STEP 6: MissingFileDetector ===');
      const missingFiles = this.missingDetector.detectMissingContent(
        filesWithMeta
      );
      console.log('Missing files:', missingFiles.length);
      missingFiles.forEach((missing) => {
        if (missing.suggestion) {
          unrecognizedBlocks.push({
            content: `[FILE INCOMPLETE] ${missing.path}`,
            context: missing.reason,
            lineNumber: 0,
            suggestedType: "Missing Content",
          });
          console.log(`  Missing: ${missing.path} - ${missing.reason}`);
        }
      });

      // 7. Sieroty po kodzie (codeblocki nieprzypięte do plików)
      console.log('\n=== STEP 7: Orphaned Code Detection ===');
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
          console.log(`  Orphaned: ${block.language || 'unknown'} block (${block.content.length} chars)`);
        }
      });

      // 8. Sugestie na podstawie sierot
      console.log('\n=== STEP 8: Orphaned Suggestions ===');
      const suggestions = this.missingDetector.findOrphanedCode(orphanedCode);
      console.log('Suggestions:', suggestions.length);
      suggestions.forEach((suggestion) => {
        unrecognizedBlocks.push({
          content: `[SUGGESTION] ${suggestion.suggestion}`,
          context: "Auto-detected from orphaned code",
          lineNumber: 0,
          suggestedType: "Suggestion",
        });
      });

      // 9. Wzbogacenie plików o język z UniversalFileParser (bez dotykania dysku)
      console.log('\n=== STEP 9: UniversalFileParser ===');
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
        
        console.log(`  ${filePath}: ${analyzed.language} (${file.content.length} chars)`);
      }

      const result: ParsedChat = {
        files: enrichedFiles,
        unrecognizedBlocks,
      };

      console.log('\n=== FINAL RESULT ===');
      console.log('Total files:', result.files.length);
      console.log('Total unrecognized blocks:', result.unrecognizedBlocks.length);
      result.files.forEach((file, i) => {
        console.log(`  File ${i+1}: ${file.path} (${file.type}, ${file.language || 'no lang'})`);
      });

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
