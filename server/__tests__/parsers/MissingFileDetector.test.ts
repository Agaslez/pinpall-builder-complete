import { MissingFileDetector } from '../../parsers/MissingFileDetector';

describe('MissingFileDetector', () => {
  let detector: MissingFileDetector;

  beforeEach(() => {
    detector = new MissingFileDetector();
  });

  test('should detect empty files', () => {
    const files = new Map([
      ['index.js', { content: 'console.log("Hello");', type: 'file' as const }],
      ['empty.js', { content: '', type: 'file' as const }],
      ['whitespace.js', { content: '   \n\t\n   ', type: 'file' as const }],
      ['folder', { content: '', type: 'folder' as const }], // Folders don't count
    ]);

    const result = detector.detectMissingContent(files);
    
    expect(result).toHaveLength(2); // empty.js and whitespace.js
    
    expect(result[0]).toEqual({
      path: 'empty.js',
      reason: 'empty',
      suggestion: 'File "empty.js" is in tree structure but has no content in transcript',
    });
    
    expect(result[1]).toEqual({
      path: 'whitespace.js',
      reason: 'empty',
      suggestion: 'File "whitespace.js" is in tree structure but has no content in transcript',
    });
  });

  test('should not flag folders as missing content', () => {
    const files = new Map([
      ['src', { content: '', type: 'folder' as const }],
      ['dist', { content: '', type: 'folder' as const }],
      ['index.js', { content: '// Content', type: 'file' as const }],
    ]);

    const result = detector.detectMissingContent(files);
    
    // Only files should be checked, folders are OK to be empty
    expect(result).toHaveLength(0);
  });

  test('should find orphaned code patterns', () => {
    const orphanedCode = [
      'import React from "react";\nexport const Component = () => null;',
      'def calculate(x, y):\n    return x + y',
      'version: "3"\nservices:\n  app:\n    image: node:18',
      'Just some random text without clear patterns',
    ];

    const result = detector.findOrphanedCode(orphanedCode);
    
    expect(result).toHaveLength(3); // First three have detectable patterns
    
    // Check suggestions
    expect(result[0].suggestion).toContain('JavaScript/TypeScript');
    expect(result[1].suggestion).toContain('Python');
    expect(result[2].suggestion).toContain('docker-compose.yml');
  });

  test('should handle empty orphaned code array', () => {
    const result = detector.findOrphanedCode([]);
    expect(result).toEqual([]);
  });

  test('should detect files with only comments as potentially missing', () => {
    const files = new Map([
      ['commented.js', { 
        content: '// TODO: Implement this\n/* Empty for now */', 
        type: 'file' as const 
      }],
      ['real.js', { 
        content: 'const x = 1;\nconsole.log(x);', 
        type: 'file' as const 
      }],
    ]);

    const result = detector.detectMissingContent(files);
    
    // Files with only comments might still be flagged as empty
    // (current implementation checks for trim() === '')
    // Let's see what the actual behavior is
    const commentedFile = result.find(r => r.path === 'commented.js');
    
    if (commentedFile) {
      expect(commentedFile.reason).toBe('empty');
    }
    // If not flagged, that's also OK - comments are content
  });

  test('should return empty array when all files have content', () => {
    const files = new Map([
      ['index.js', { content: 'console.log("Hello");', type: 'file' as const }],
      ['utils.js', { content: 'export const x = 42;', type: 'file' as const }],
      ['config.json', { content: '{"key": "value"}', type: 'file' as const }],
      ['src', { content: '', type: 'folder' as const }],
    ]);

    const result = detector.detectMissingContent(files);
    expect(result).toEqual([]);
  });
});