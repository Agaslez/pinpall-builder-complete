import { ChatGPTSectionParser } from '../../parsers/ChatGPTSectionParser';

describe('ChatGPTSectionParser', () => {
  let parser: ChatGPTSectionParser;

  beforeEach(() => {
    parser = new ChatGPTSectionParser();
  });

  test('should parse sections with ## headers and code blocks', () => {
    const lines = [
      '## index.js',
      '```javascript',
      'console.log("Hello");',
      '```',
      '',
      '## utils.js',
      '```javascript',
      'export function test() {',
      '  return 42;',
      '}',
      '```',
    ];

    const result = parser.parse(lines);
    
    expect(result).toHaveLength(2);
    
    expect(result[0]).toEqual({
      name: 'index.js',
      content: 'console.log("Hello");',
    });
    
    expect(result[1]).toEqual({
      name: 'utils.js',
      content: 'export function test() {\n  return 42;\n}',
    });
  });

  test('should handle sections with parentheses in names', () => {
    const lines = [
      '## main.js (entry point)',
      '```javascript',
      'console.log("Start");',
      '```',
      '',
      '## config.json (app config)',
      '```json',
      '{"name": "app"}',
      '```',
    ];

    const result = parser.parse(lines);
    
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('main.js');
    expect(result[1].name).toBe('config.json');
    expect(result[1].content).toBe('{"name": "app"}');
  });

  test('should reject dangerous file names', () => {
    const lines = [
      '## ../etc/passwd',
      '```',
      'root:x:0:0',
      '```',
      '',
      '## safe.js',
      '```javascript',
      'console.log("safe");',
      '```',
    ];

    const result = parser.parse(lines);
    
    // Only safe file should be parsed
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('safe.js');
    expect(result[0].content).toBe('console.log("safe");');
  });

  test('should handle files without extensions', () => {
    const lines = [
      '## Dockerfile',
      '```dockerfile',
      'FROM node:18',
      '```',
      '',
      '## Makefile',
      '```make',
      'build:',
      '\tnpm run build',
      '```',
    ];

    const result = parser.parse(lines);
    
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Dockerfile');
    expect(result[1].name).toBe('Makefile');
  });

  test('should ignore non-file sections (EXPLANATION, TODO)', () => {
    const lines = [
      '## app.js',
      '```javascript',
      'console.log("app");',
      '```',
      '',
      'EXPLANATION: This is the main app file',
      'Some additional explanation here.',
      '',
      'TODO: Add error handling',
      '- Handle network errors',
      '- Add retry logic',
      '',
      '## utils.js',
      '```javascript',
      'export const helper = () => {};',
      '```',
    ];

    const result = parser.parse(lines);
    
    // Should only parse file sections, not EXPLANATION or TODO
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('app.js');
    expect(result[1].name).toBe('utils.js');
  });

  test('should handle empty code blocks', () => {
    const lines = [
      '## empty.js',
      '```javascript',
      '```', // Empty code block
      '',
      '## valid.js',
      '```javascript',
      'const x = 1;',
      '```',
    ];

    const result = parser.parse(lines);
    
    // Empty code block should be filtered out
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('valid.js');
  });

  test('should handle mixed content in sections', () => {
    const lines = [
      '## config.js',
      'This is some explanation before code.',
      '```javascript',
      'module.exports = {',
      '  port: 3000',
      '};',
      '```',
      'And some explanation after code.',
    ];

    const result = parser.parse(lines);
    
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('config.js');
    // Implementation extracts only code block content
    // Not the surrounding text
    expect(result[0].content).toBe('module.exports = {\n  port: 3000\n};');
  });

  test('should return empty array for no valid sections', () => {
    const lines = [
      'Just some text',
      'No sections here',
      'More text',
    ];

    const result = parser.parse(lines);
    expect(result).toEqual([]);
  });
});