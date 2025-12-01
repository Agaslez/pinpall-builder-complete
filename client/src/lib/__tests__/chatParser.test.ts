// Real functional tests for hybrid chat parser
import { ClientChatParser } from '../chatParser';

export interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: string;
}

const results: TestResult[] = [];

// Test 1: Basic React component parsing
function testReactComponentParsing() {
  const startTime = performance.now();
  try {
    const sampleChat = `
## Project Structure
src/
  components/
    Button.tsx
    Card.tsx
  pages/
    Home.tsx

## React Button Component

\`\`\`typescript
import React from 'react';

interface ButtonProps {
  label: string;
  onClick: () => void;
}

export const Button: React.FC<ButtonProps> = ({ label, onClick }) => {
  return <button onClick={onClick}>{label}</button>;
};
\`\`\`

## React Card Component

\`\`\`typescript
import React from 'react';

export const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="card">{children}</div>;
};
\`\`\`

## Home Page

\`\`\`typescript
import React from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

export default function Home() {
  return (
    <Card>
      <Button label="Click me" onClick={() => alert('Clicked!')} />
    </Card>
  );
}
\`\`\`
    `;

    const parser = new ClientChatParser(sampleChat);
    const result = parser.parse();

    const passed = 
      result.files.length === 3 && 
      result.files.some(f => f.path.includes('Button')) &&
      result.files.some(f => f.path.includes('Card')) &&
      result.files.some(f => f.path.includes('Home'));

    results.push({
      name: 'Test 1: React Component Parsing',
      passed,
      duration: performance.now() - startTime,
      details: `Found ${result.files.length} files. Files: ${result.files.map(f => f.path).join(', ')}`
    });
  } catch (error) {
    results.push({
      name: 'Test 1: React Component Parsing',
      passed: false,
      duration: performance.now() - startTime,
      error: String(error)
    });
  }
}

// Test 2: Multiple language detection
function testMultiLanguageParsing() {
  const startTime = performance.now();
  try {
    const sampleChat = `
\`\`\`python
def hello_world():
    print("Hello from Python!")
\`\`\`

\`\`\`javascript
const helloWorld = () => console.log("Hello from JS!");
\`\`\`

\`\`\`json
{
  "name": "My App",
  "version": "1.0.0"
}
\`\`\`

\`\`\`sql
SELECT * FROM users WHERE active = true;
\`\`\`
    `;

    const parser = new ClientChatParser(sampleChat);
    const result = parser.parse();

    const languages = result.files.map(f => f.language).filter(Boolean);
    const hasMultipleLanguages = languages.length >= 3;

    results.push({
      name: 'Test 2: Multi-language Detection',
      passed: hasMultipleLanguages,
      duration: performance.now() - startTime,
      details: `Detected ${languages.length} languages: ${languages.join(', ')}`
    });
  } catch (error) {
    results.push({
      name: 'Test 2: Multi-language Detection',
      passed: false,
      duration: performance.now() - startTime,
      error: String(error)
    });
  }
}

// Test 3: Folder structure recognition
function testFolderStructureRecognition() {
  const startTime = performance.now();
  try {
    const sampleChat = `
\`\`\`
src/
  components/Button.tsx
  components/Card.tsx
  pages/Home.tsx
  hooks/useData.ts
  utils/helpers.ts
config/tailwind.config.js
package.json
\`\`\`

\`\`\`typescript
// src/components/Button.tsx
export const Button = () => <button>Click</button>;
\`\`\`
    `;

    const parser = new ClientChatParser(sampleChat);
    const result = parser.parse();

    const srcFiles = result.files.filter(f => f.path.includes('src/'));
    const passed = srcFiles.length > 0;

    results.push({
      name: 'Test 3: Folder Structure Recognition',
      passed,
      duration: performance.now() - startTime,
      details: `Found ${srcFiles.length} files in src/. Total files: ${result.files.length}`
    });
  } catch (error) {
    results.push({
      name: 'Test 3: Folder Structure Recognition',
      passed: false,
      duration: performance.now() - startTime,
      error: String(error)
    });
  }
}

// Test 4: Unrecognized elements detection
function testUnrecognizedElementsDetection() {
  const startTime = performance.now();
  try {
    const sampleChat = `
\`\`\`typescript
// This code block has no associated file
const orphanedCode = () => {
  console.log("I don't belong anywhere!");
};
\`\`\`

\`\`\`
// Another orphaned block
function somethingRandom() { }
\`\`\`
    `;

    const parser = new ClientChatParser(sampleChat);
    const result = parser.parse();

    const hasUnrecognized = result.unrecognizedBlocks.length > 0;

    results.push({
      name: 'Test 4: Unrecognized Elements Detection',
      passed: hasUnrecognized,
      duration: performance.now() - startTime,
      details: `Found ${result.unrecognizedBlocks.length} unrecognized elements`
    });
  } catch (error) {
    results.push({
      name: 'Test 4: Unrecognized Elements Detection',
      passed: false,
      duration: performance.now() - startTime,
      error: String(error)
    });
  }
}

// Test 5: Large content handling
function testLargeContentHandling() {
  const startTime = performance.now();
  try {
    // Create a large code block (> 100KB)
    const largeCodeBlock = 'const data = ' + JSON.stringify(
      Array(10000).fill({ id: 1, name: 'test', value: Math.random() })
    );

    const sampleChat = `
\`\`\`javascript
${largeCodeBlock}
\`\`\`
    `;

    const parser = new ClientChatParser(sampleChat);
    const result = parser.parse();

    const passed = result.files.length > 0;

    results.push({
      name: 'Test 5: Large Content Handling',
      passed,
      duration: performance.now() - startTime,
      details: `Parsed ${(sampleChat.length / 1024).toFixed(2)}KB of content in ${(performance.now() - startTime).toFixed(2)}ms`
    });
  } catch (error) {
    results.push({
      name: 'Test 5: Large Content Handling',
      passed: false,
      duration: performance.now() - startTime,
      error: String(error)
    });
  }
}

// Test 6: File type stats calculation
function testFileTypeStats() {
  const startTime = performance.now();
  try {
    const sampleChat = `
\`\`\`typescript
export const Button = () => <div />;
\`\`\`

\`\`\`typescript
export const Card = () => <div />;
\`\`\`

\`\`\`javascript
const config = {};
\`\`\`

\`\`\`json
{}
\`\`\`
    `;

    const parser = new ClientChatParser(sampleChat);
    const result = parser.parse();

    const statsAccurate = result.files.length === 4;

    results.push({
      name: 'Test 6: File Statistics',
      passed: statsAccurate,
      duration: performance.now() - startTime,
      details: `Total files: ${result.files.length}, Average content size: ${(result.files.reduce((sum, f) => sum + f.content.length, 0) / result.files.length).toFixed(0)} chars`
    });
  } catch (error) {
    results.push({
      name: 'Test 6: File Statistics',
      passed: false,
      duration: performance.now() - startTime,
      error: String(error)
    });
  }
}

// Test 7: Edge case - empty files
function testEmptyFiles() {
  const startTime = performance.now();
  try {
    const sampleChat = `
## Empty TypeScript file
\`\`\`typescript
\`\`\`

## Empty JavaScript file  
\`\`\`javascript
\`\`\`

## Valid content
\`\`\`typescript
export const App = () => <div>Hello</div>;
\`\`\`
    `;

    const parser = new ClientChatParser(sampleChat);
    const result = parser.parse();

    const hasValidContent = result.files.some(f => f.content.length > 10);

    results.push({
      name: 'Test 7: Edge Case - Empty Files',
      passed: hasValidContent,
      duration: performance.now() - startTime,
      details: `Found ${result.files.length} files, ${result.files.filter(f => f.content.length === 0).length} empty`
    });
  } catch (error) {
    results.push({
      name: 'Test 7: Edge Case - Empty Files',
      passed: false,
      duration: performance.now() - startTime,
      error: String(error)
    });
  }
}

// Test 8: Real world scenario - Next.js project
function testNextJsScenario() {
  const startTime = performance.now();
  try {
    const sampleChat = `
## Next.js App Structure

### pages/index.tsx
\`\`\`typescript
import type { NextPage } from 'next';
import Head from 'next/head';

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Welcome</title>
      </Head>
      <main>
        <h1>Hello Next.js</h1>
      </main>
    </>
  );
};

export default Home;
\`\`\`

### pages/api/hello.ts
\`\`\`typescript
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.status(200).json({ message: 'Hello' });
}
\`\`\`

### next.config.js
\`\`\`javascript
module.exports = {
  reactStrictMode: true,
};
\`\`\`

### package.json
\`\`\`json
{
  "name": "nextjs-app",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build"
  },
  "dependencies": {
    "next": "^13.0.0",
    "react": "^18.0.0"
  }
}
\`\`\`
    `;

    const parser = new ClientChatParser(sampleChat);
    const result = parser.parse();

    const hasPages = result.files.some(f => f.path.includes('pages/'));
    const hasApi = result.files.some(f => f.path.includes('api/'));
    const hasConfig = result.files.some(f => f.path.includes('next.config'));

    results.push({
      name: 'Test 8: Real World - Next.js Project',
      passed: hasPages && hasApi && hasConfig,
      duration: performance.now() - startTime,
      details: `Files found: ${result.files.length}. Pages: ${hasPages ? '✓' : '✗'}, API: ${hasApi ? '✓' : '✗'}, Config: ${hasConfig ? '✓' : '✗'}`
    });
  } catch (error) {
    results.push({
      name: 'Test 8: Real World - Next.js Project',
      passed: false,
      duration: performance.now() - startTime,
      error: String(error)
    });
  }
}

// Run all tests
export function runAllTests() {
  console.log('🧪 STARTING HYBRID PARSER TEST SUITE...\n');
  
  testReactComponentParsing();
  testMultiLanguageParsing();
  testFolderStructureRecognition();
  testUnrecognizedElementsDetection();
  testLargeContentHandling();
  testFileTypeStats();
  testEmptyFiles();
  testNextJsScenario();

  // Print results
  console.log('═'.repeat(80));
  console.log('📊 TEST RESULTS');
  console.log('═'.repeat(80));
  
  results.forEach((result, index) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    const time = result.duration.toFixed(2);
    console.log(`\n${index + 1}. ${result.name}`);
    console.log(`   Status: ${status} | Duration: ${time}ms`);
    if (result.details) console.log(`   Details: ${result.details}`);
    if (result.error) console.log(`   Error: ${result.error}`);
  });

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const passRate = ((passed / total) * 100).toFixed(1);
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0).toFixed(2);

  console.log('\n' + '═'.repeat(80));
  console.log(`📈 SUMMARY: ${passed}/${total} tests passed (${passRate}%)`);
  console.log(`⏱️  Total execution time: ${totalTime}ms`);
  console.log('═'.repeat(80));

  return { passed, total, passRate, results };
}
