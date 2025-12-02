import { TreeExtractor } from '../../parsers/TreeExtractor';

describe('TreeExtractor', () => {
  let extractor: TreeExtractor;

  beforeEach(() => {
    extractor = new TreeExtractor();
  });

  test('should extract simple tree structure', () => {
    const lines = [
      'project/',
      '├── src/',
      '│   ├── index.js',
      '│   └── utils.js',
      '└── package.json',
    ];

    const result = extractor.extract(lines);
    
    // Implementation returns 5 items: project, src, index.js, utils.js, package.json
    expect(result).toHaveLength(5);
    
    // Check folders
    expect(result[0]).toEqual({
      name: 'project',
      path: 'project',
      type: 'folder',
      language: undefined,
    });
    
    expect(result[1]).toEqual({
      name: 'src',
      path: 'project/src',
      type: 'folder',
      language: undefined,
    });
    
    // Check files with language detection
    expect(result[2]).toEqual({
      name: 'index.js',
      path: 'project/src/index.js',
      type: 'file',
      language: 'javascript',
    });
    
    expect(result[3]).toEqual({
      name: 'utils.js',
      path: 'project/src/utils.js',
      type: 'file',
      language: 'javascript',
    });
    
    expect(result[4]).toEqual({
      name: 'package.json',
      path: 'project/package.json',
      type: 'file',
      language: 'json',
    });
  });

  test('should handle nested folder structure', () => {
    const lines = [
      'src/',
      '├── components/',
      '│   ├── Button.tsx',
      '│   └── Card.tsx',
      '├── pages/',
      '│   └── Home.tsx',
      '└── utils/',
      '    └── helpers.ts',
    ];

    const result = extractor.extract(lines);
    
    // Implementation returns 8 items: src, components, Button.tsx, Card.tsx, pages, Home.tsx, utils, helpers.ts
    expect(result).toHaveLength(8);
    
    // Check TypeScript files
    const tsxFiles = result.filter(f => f.language === 'typescript');
    expect(tsxFiles).toHaveLength(4);
    
    // Check folders
    const folders = result.filter(f => f.type === 'folder');
    expect(folders).toHaveLength(4); // src, components, pages, utils
  });

  test('should reject dangerous file names', () => {
    const lines = [
      'safe/',
      '├── normal.js',
      '├── ../dangerous.js',
      '└── /etc/passwd',
    ];

    const result = extractor.extract(lines);
    
    // Only safe files should be extracted
    expect(result).toHaveLength(2); // safe/ and normal.js
    
    const fileNames = result.map(f => f.name);
    expect(fileNames).toContain('safe');
    expect(fileNames).toContain('normal.js');
    expect(fileNames).not.toContain('../dangerous.js');
    expect(fileNames).not.toContain('/etc/passwd');
  });

  test('should handle empty lines and non-tree content', () => {
    const lines = [
      '',
      'Some text before tree',
      '',
      'project/',
      '├── index.js',
      '',
      'Some text after tree',
      '└── utils.js', // This should be ignored
    ];

    const result = extractor.extract(lines);
    
    // Should only extract tree structure between boundaries
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('project');
    expect(result[1].name).toBe('index.js');
  });

  test('should detect language from extension', () => {
    const lines = [
      'files/',
      '├── script.js',
      '├── component.tsx',
      '├── style.css',
      '├── data.json',
      '└── readme.md',
    ];

    const result = extractor.extract(lines);
    
    const languages = result
      .filter(f => f.type === 'file')
      .map(f => f.language);
    
    expect(languages).toEqual([
      'javascript',
      'typescript',
      'css',
      'json',
      'markdown',
    ]);
  });

  test('should return empty array for no tree found', () => {
    const lines = [
      'Just some text',
      'No tree structure here',
      'Another line',
    ];

    const result = extractor.extract(lines);
    expect(result).toEqual([]);
  });
});