import { ContentAssociator } from '../../parsers/ContentAssociator';

describe('ContentAssociator', () => {
  let associator: ContentAssociator;

  beforeEach(() => {
    associator = new ContentAssociator();
  });

  test('should associate sections with matching tree files', () => {
    const treeFiles = new Map([
      ['src/index.js', { type: 'file' as const, language: 'javascript' }],
      ['src/utils.js', { type: 'file' as const, language: 'javascript' }],
      ['package.json', { type: 'file' as const, language: 'json' }],
      ['src', { type: 'folder' as const }],
    ]);

    const sections = [
      { name: 'index.js', content: 'console.log("Hello");' },
      { name: 'utils.js', content: 'export function test() {}' },
      { name: 'package.json', content: '{"name": "app"}' },
    ];

    const result = associator.associate(treeFiles, sections);
    
    expect(result.size).toBe(4); // 3 files + 1 folder
    
    // Check that content was associated correctly
    expect(result.get('src/index.js')).toEqual({
      path: 'src/index.js',
      content: 'console.log("Hello");',
      language: 'javascript',
      type: 'file',
    });
    
    expect(result.get('src/utils.js')).toEqual({
      path: 'src/utils.js',
      content: 'export function test() {}',
      language: 'javascript',
      type: 'file',
    });
    
    // Folder should have empty content
    expect(result.get('src')).toEqual({
      path: 'src',
      content: '',
      type: 'folder',
      language: undefined,
    });
  });

  test('should create new files for unmatched sections', () => {
    const treeFiles = new Map([
      ['existing.js', { type: 'file' as const, language: 'javascript' }],
    ]);

    const sections = [
      { name: 'existing.js', content: '// Existing file' },
      { name: 'newfile.js', content: '// New file content' },
      { name: 'another.py', content: 'def hello(): pass' },
    ];

    const result = associator.associate(treeFiles, sections);
    
    expect(result.size).toBe(3); // 1 existing + 2 new
    
    // New files should be created
    expect(result.get('newfile.js')).toEqual({
      path: 'newfile.js',
      content: '// New file content',
      language: 'javascript', // Detected from content
      type: 'file',
    });
    
    expect(result.get('another.py')).toEqual({
      path: 'another.py',
      content: 'def hello(): pass',
      language: 'python', // Detected from content
      type: 'file',
    });
  });

  test('should match by filename when paths differ', () => {
    const treeFiles = new Map([
      ['src/components/Button.js', { type: 'file' as const, language: 'javascript' }],
      ['src/utils/helpers.js', { type: 'file' as const, language: 'javascript' }],
    ]);

    const sections = [
      { name: 'Button.js', content: 'export const Button = () => null;' },
      { name: 'helpers.js', content: 'export const helper = () => {};' },
    ];

    const result = associator.associate(treeFiles, sections);
    
    // Should match by filename (last part of path)
    expect(result.get('src/components/Button.js')?.content).toBe('export const Button = () => null;');
    expect(result.get('src/utils/helpers.js')?.content).toBe('export const helper = () => {};');
  });

  test('should reject dangerous paths', () => {
    const treeFiles = new Map([
      ['safe.js', { type: 'file' as const, language: 'javascript' }],
      ['../dangerous.js', { type: 'file' as const, language: 'javascript' }],
    ]);

    const sections = [
      { name: 'safe.js', content: '// Safe' },
      { name: '/etc/passwd', content: 'root:x:0:0' },
    ];

    const result = associator.associate(treeFiles, sections);
    
    // Only safe files should be in result
    expect(result.size).toBe(1);
    expect(result.has('safe.js')).toBe(true);
    expect(result.has('../dangerous.js')).toBe(false);
    expect(result.has('/etc/passwd')).toBe(false);
  });

  test('should detect language from content', () => {
    const sections = [
      { 
        name: 'script.js', 
        content: 'console.log("Hello");\nconst x = 42;' 
      },
      { 
        name: 'data.json', 
        content: '{\n  "name": "test",\n  "value": 123\n}' 
      },
      { 
        name: 'module.py', 
        content: 'import os\ndef main():\n    pass' 
      },
      { 
        name: 'unknown.txt', 
        content: 'Just plain text' 
      },
    ];

    const result = associator.associate(new Map(), sections);
    
    expect(result.get('script.js')?.language).toBe('javascript');
    expect(result.get('data.json')?.language).toBe('json');
    expect(result.get('module.py')?.language).toBe('python');
    expect(result.get('unknown.txt')?.language).toBeUndefined();
  });

  test('should handle empty tree and sections', () => {
    const result1 = associator.associate(new Map(), []);
    expect(result1.size).toBe(0);

    const result2 = associator.associate(new Map([
      ['folder', { type: 'folder' as const }]
    ]), []);
    expect(result2.size).toBe(1);
    expect(result2.get('folder')?.type).toBe('folder');
  });

  test('should prioritize exact matches over partial matches', () => {
    const treeFiles = new Map([
      ['src/index.js', { type: 'file' as const, language: 'javascript' }],
      ['index.js', { type: 'file' as const, language: 'javascript' }], // Same filename, different path
    ]);

    const sections = [
      { name: 'index.js', content: '// Content' },
    ];

    const result = associator.associate(treeFiles, sections);
    
    // Should match the exact path 'index.js' not 'src/index.js'
    // (exact match takes precedence over filename match)
    const matchedPath = Array.from(result.entries())
      .find(([_, file]) => file.content === '// Content')?.[0];
    
    expect(matchedPath).toBe('index.js');
  });
});