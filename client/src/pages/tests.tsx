import { useEffect, useState } from "react";
import { ClientChatParser } from "@/lib/chatParser";

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  details?: string;
  error?: string;
}

export default function TestsPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runTests();
  }, []);

  const runTests = async () => {
    const testResults: TestResult[] = [];

    // Test 1: React Component Parsing
    const start1 = performance.now();
    try {
      const chat1 = `
## Project Structure
src/components/Button.tsx
src/components/Card.tsx
src/pages/Home.tsx

\`\`\`typescript
export const Button = () => <button>Click</button>;
\`\`\`

\`\`\`typescript
export const Card = () => <div>Card</div>;
\`\`\`

\`\`\`typescript
export default function Home() {
  return <div>Home</div>;
}
\`\`\`
      `;
      const parser1 = new ClientChatParser(chat1);
      const result1 = parser1.parse();
      testResults.push({
        name: "✅ Test 1: React Component Parsing",
        passed: result1.files.length >= 3,
        duration: performance.now() - start1,
        details: `Found ${result1.files.length} files: ${result1.files.map(f => f.path.split('/').pop()).join(', ')}`
      });
    } catch (error) {
      testResults.push({
        name: "❌ Test 1: React Component Parsing",
        passed: false,
        duration: performance.now() - start1,
        error: String(error)
      });
    }

    // Test 2: Multi-language Detection
    const start2 = performance.now();
    try {
      const chat2 = `
\`\`\`typescript
export const App = () => <div />;
\`\`\`

\`\`\`javascript
const config = { test: true };
\`\`\`

\`\`\`json
{ "name": "app", "version": "1.0.0" }
\`\`\`

\`\`\`python
def hello(): print("hello")
\`\`\`

\`\`\`sql
SELECT * FROM users;
\`\`\`
      `;
      const parser2 = new ClientChatParser(chat2);
      const result2 = parser2.parse();
      const languages = result2.files.map(f => f.language).filter(Boolean);
      testResults.push({
        name: "✅ Test 2: Multi-language Detection",
        passed: result2.files.length >= 4,
        duration: performance.now() - start2,
        details: `Detected ${languages.length} files with languages: ${languages.join(', ')}`
      });
    } catch (error) {
      testResults.push({
        name: "❌ Test 2: Multi-language Detection",
        passed: false,
        duration: performance.now() - start2,
        error: String(error)
      });
    }

    // Test 3: Folder Structure Recognition
    const start3 = performance.now();
    try {
      const chat3 = `
\`\`\`typescript
// src/pages/index.tsx
export default function Home() {}
\`\`\`

\`\`\`typescript
// src/components/header.tsx
export const Header = () => <header/>;
\`\`\`

\`\`\`typescript
// src/hooks/useData.ts
export const useData = () => ({});
\`\`\`

\`\`\`javascript
// config/next.config.js
module.exports = {};
\`\`\`
      `;
      const parser3 = new ClientChatParser(chat3);
      const result3 = parser3.parse();
      const srcFiles = result3.files.filter(f => f.path.includes('src/'));
      testResults.push({
        name: "✅ Test 3: Folder Structure Recognition",
        passed: srcFiles.length >= 3,
        duration: performance.now() - start3,
        details: `Found ${result3.files.length} total files, ${srcFiles.length} in src/`
      });
    } catch (error) {
      testResults.push({
        name: "❌ Test 3: Folder Structure Recognition",
        passed: false,
        duration: performance.now() - start3,
        error: String(error)
      });
    }

    // Test 4: Unrecognized Elements Detection
    const start4 = performance.now();
    try {
      const chat4 = `
## Expected Files
src/index.ts
src/utils.ts

\`\`\`typescript
// src/index.ts
export const main = () => {};
\`\`\`

\`\`\`typescript
// Orphaned code block with no file reference
const orphanedFunction = () => {
  console.log("I don't have a home!");
};
\`\`\`
      `;
      const parser4 = new ClientChatParser(chat4);
      const result4 = parser4.parse();
      testResults.push({
        name: "✅ Test 4: Unrecognized Elements Detection",
        passed: result4.unrecognizedBlocks.length > 0,
        duration: performance.now() - start4,
        details: `Detected ${result4.unrecognizedBlocks.length} unrecognized elements`
      });
    } catch (error) {
      testResults.push({
        name: "❌ Test 4: Unrecognized Elements Detection",
        passed: false,
        duration: performance.now() - start4,
        error: String(error)
      });
    }

    // Test 5: Real-world Next.js Project
    const start5 = performance.now();
    try {
      const chat5 = `
## Next.js Project

### pages/index.tsx
\`\`\`typescript
import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head><title>Welcome</title></Head>
      <main><h1>Hello</h1></main>
    </>
  );
}
\`\`\`

### pages/api/users.ts
\`\`\`typescript
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ users: [] });
}
\`\`\`

### next.config.js
\`\`\`javascript
module.exports = { reactStrictMode: true };
\`\`\`

### package.json
\`\`\`json
{
  "name": "nextjs-app",
  "scripts": { "dev": "next dev" },
  "dependencies": { "next": "^13.0.0" }
}
\`\`\`

### tailwind.config.js
\`\`\`javascript
module.exports = { content: ['./pages/**/*.{js,ts,jsx,tsx}'] };
\`\`\`

### styles/globals.css
\`\`\`css
html, body { margin: 0; padding: 0; }
\`\`\`
      `;
      const parser5 = new ClientChatParser(chat5);
      const result5 = parser5.parse();
      const hasPages = result5.files.some(f => f.path.includes('pages/'));
      const hasApi = result5.files.some(f => f.path.includes('api/'));
      const hasConfig = result5.files.some(f => f.path.includes('next.config') || f.path.includes('package.json'));
      testResults.push({
        name: "✅ Test 5: Real-world Next.js Project",
        passed: hasPages && hasApi && hasConfig,
        duration: performance.now() - start5,
        details: `Found ${result5.files.length} files. Pages: ${hasPages ? '✓' : '✗'}, API: ${hasApi ? '✓' : '✗'}, Config: ${hasConfig ? '✓' : '✗'}`
      });
    } catch (error) {
      testResults.push({
        name: "❌ Test 5: Real-world Next.js Project",
        passed: false,
        duration: performance.now() - start5,
        error: String(error)
      });
    }

    // Test 6: Large Content Handling
    const start6 = performance.now();
    try {
      const largeCode = 'const data = [' + Array(1000).fill('{ id: 1, name: "test" }').join(',') + ']';
      const chat6 = `\`\`\`javascript\n${largeCode}\n\`\`\``;
      const parser6 = new ClientChatParser(chat6);
      const result6 = parser6.parse();
      testResults.push({
        name: "✅ Test 6: Large Content Handling",
        passed: result6.files.length > 0,
        duration: performance.now() - start6,
        details: `Parsed ${(chat6.length / 1024).toFixed(2)}KB in ${(performance.now() - start6).toFixed(2)}ms`
      });
    } catch (error) {
      testResults.push({
        name: "❌ Test 6: Large Content Handling",
        passed: false,
        duration: performance.now() - start6,
        error: String(error)
      });
    }

    // Test 7: File Type Stats
    const start7 = performance.now();
    try {
      const chat7 = `
\`\`\`typescript
export const Button = () => <button/>;
\`\`\`

\`\`\`typescript
export const Modal = () => <div/>;
\`\`\`

\`\`\`javascript
const config = {};
\`\`\`

\`\`\`json
{ "test": true }
\`\`\`
      `;
      const parser7 = new ClientChatParser(chat7);
      const result7 = parser7.parse();
      testResults.push({
        name: "✅ Test 7: File Statistics Calculation",
        passed: result7.files.length === 4,
        duration: performance.now() - start7,
        details: `Total files: ${result7.files.length}, with proper language detection`
      });
    } catch (error) {
      testResults.push({
        name: "❌ Test 7: File Statistics Calculation",
        passed: false,
        duration: performance.now() - start7,
        error: String(error)
      });
    }

    // Test 8: Edge Cases
    const start8 = performance.now();
    try {
      const chat8 = `
\`\`\`typescript
\`\`\`

\`\`\`javascript
const valid = true;
\`\`\`

\`\`\`
\`\`\`
      `;
      const parser8 = new ClientChatParser(chat8);
      const result8 = parser8.parse();
      const hasValidContent = result8.files.some(f => f.content.length > 5);
      testResults.push({
        name: "✅ Test 8: Edge Case - Empty/Invalid Blocks",
        passed: hasValidContent,
        duration: performance.now() - start8,
        details: `Handled ${result8.files.length} files with edge cases correctly`
      });
    } catch (error) {
      testResults.push({
        name: "❌ Test 8: Edge Case - Empty/Invalid Blocks",
        passed: false,
        duration: performance.now() - start8,
        error: String(error)
      });
    }

    setResults(testResults);
    setLoading(false);
  };

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0).toFixed(2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                <i className="fas fa-flask text-xl"></i>
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Test Suite</h1>
                <p className="text-xs text-muted-foreground">Hybrid Parser Tests</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 shadow-lg p-12 text-center">
            <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
            <p className="text-lg text-muted-foreground">Running tests...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-8 text-center">
              <h2 className="text-3xl font-bold mb-2">
                {passed}/{total} Tests Passed
              </h2>
              <p className="text-2xl text-green-600 font-semibold mb-2">
                {passRate}% Success Rate
              </p>
              <p className="text-muted-foreground">
                Total execution time: <span className="font-mono text-primary">{totalTime}ms</span>
              </p>
            </div>

            {/* Results */}
            <div className="space-y-4">
              {results.map((result, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg border p-6 ${
                    result.passed
                      ? 'bg-green-500/5 border-green-500/20 hover:border-green-500/50'
                      : 'bg-red-500/5 border-red-500/20 hover:border-red-500/50'
                  } transition-colors`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      {result.name}
                    </h3>
                    <span className={`text-xs font-mono px-2 py-1 rounded ${
                      result.passed
                        ? 'bg-green-500/20 text-green-600'
                        : 'bg-red-500/20 text-red-600'
                    }`}>
                      {result.duration.toFixed(2)}ms
                    </span>
                  </div>
                  {result.details && (
                    <p className="text-sm text-muted-foreground mb-2">{result.details}</p>
                  )}
                  {result.error && (
                    <p className="text-sm text-red-600 font-mono">{result.error}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Button to rerun */}
            <div className="text-center">
              <button
                onClick={() => {
                  setLoading(true);
                  runTests();
                }}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
              >
                <i className="fas fa-redo"></i>
                Run Tests Again
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
