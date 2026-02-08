/**
 * Unit tests for File Processor Module
 *
 * Tests:
 * - File content reading
 * - Import statement extraction
 * - Import transformation application
 * - Import organization application
 * - File content reconstruction
 * - Transformation statistics tracking
 *
 * Requirements: 1.3, 1.4
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as fs from 'fs';
import { DefaultFileProcessor, createFileProcessor } from '../../../src/scripts/migration/file-processor.js';

// Mock fs module
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
}));

describe('FileProcessor', () => {
  let processor: DefaultFileProcessor;

  beforeEach(() => {
    processor = new DefaultFileProcessor();
    vi.clearAllMocks();
  });

  describe('createFileProcessor', () => {
    it('should create a file processor instance', () => {
      const processor = createFileProcessor();
      expect(processor).toBeDefined();
      expect(processor.processFile).toBeDefined();
      expect(processor.transformContent).toBeDefined();
    });
  });

  describe('readFile', () => {
    it('should read file content from disk', () => {
      const mockContent = 'import React from "react";\n\nfunction App() {}';
      (fs.readFileSync as any).mockReturnValue(mockContent);

      const content = processor.readFile('/path/to/file.ts');

      expect(content).toBe(mockContent);
      expect(fs.readFileSync).toHaveBeenCalledWith('/path/to/file.ts', 'utf-8');
    });

    it('should throw error if file cannot be read', () => {
      (fs.readFileSync as any).mockImplementation(() => {
        throw new Error('File not found');
      });

      expect(() => processor.readFile('/nonexistent/file.ts')).toThrow('File not found');
    });
  });

  describe('extractImports', () => {
    it('should extract import statements from content', () => {
      const content = `import React from 'react';
import { useState } from 'react';
import type { FC } from 'react';

function App() {}`;

      const imports = processor.extractImports(content);

      expect(imports).toHaveLength(3);
      expect(imports[0]).toBe("import React from 'react';");
      expect(imports[1]).toBe("import { useState } from 'react';");
      expect(imports[2]).toBe("import type { FC } from 'react';");
    });

    it('should return empty array for content with no imports', () => {
      const content = `function App() {
  return <div>Hello</div>;
}`;

      const imports = processor.extractImports(content);

      expect(imports).toHaveLength(0);
    });

    it('should handle mixed import styles', () => {
      const content = `import React from 'react';
import * as Utils from './utils';
import { foo, bar } from '../helpers';
import type { Props } from './types';
import './styles.css';`;

      const imports = processor.extractImports(content);

      expect(imports).toHaveLength(5);
    });
  });

  describe('applyTransformations', () => {
    it('should transform relative imports to path aliases', () => {
      const imports = [
        "import { Calculator } from '../../core/calculator';",
        "import { useHook } from '../../hooks/use-hook';",
      ];
      // Use a realistic absolute path
      const filePath = '/home/project/src/components/ui/button.tsx';

      const result = processor.applyTransformations(imports, filePath);

      expect(result.transformedImports).toHaveLength(2);
      expect(result.transformedImports[0]).toContain('@/core/calculator');
      expect(result.transformedImports[1]).toContain('@/hooks/use-hook');
      expect(result.changesCount).toBe(2);
    });

    it('should preserve same-directory imports', () => {
      const imports = [
        "import { Button } from './button';",
        "import type { Props } from './types';",
      ];
      const filePath = '/home/project/src/components/ui/index.tsx';

      const result = processor.applyTransformations(imports, filePath);

      expect(result.transformedImports[0]).toBe("import { Button } from './button';");
      expect(result.transformedImports[1]).toBe("import type { Props } from './types';");
      expect(result.changesCount).toBe(0);
    });

    it('should preserve CSS module imports', () => {
      const imports = [
        "import styles from './button.module.css';",
        "import './global.css';",
      ];
      const filePath = '/home/project/src/components/ui/button.tsx';

      const result = processor.applyTransformations(imports, filePath);

      expect(result.transformedImports[0]).toBe("import styles from './button.module.css';");
      expect(result.transformedImports[1]).toBe("import './global.css';");
      expect(result.changesCount).toBe(0);
    });

    it('should preserve external imports', () => {
      const imports = [
        "import React from 'react';",
        "import { useState } from 'react';",
        "import lodash from 'lodash';",
      ];
      const filePath = '/home/project/src/components/ui/button.tsx';

      const result = processor.applyTransformations(imports, filePath);

      expect(result.transformedImports[0]).toBe("import React from 'react';");
      expect(result.transformedImports[1]).toBe("import { useState } from 'react';");
      expect(result.transformedImports[2]).toBe("import lodash from 'lodash';");
      expect(result.changesCount).toBe(0);
    });

    it('should handle mixed imports correctly', () => {
      const imports = [
        "import React from 'react';",
        "import { Calculator } from '../../core/calculator';",
        "import { Button } from './button';",
        "import styles from './styles.module.css';",
      ];
      const filePath = '/home/project/src/components/ui/index.tsx';

      const result = processor.applyTransformations(imports, filePath);

      expect(result.transformedImports[0]).toBe("import React from 'react';");
      expect(result.transformedImports[1]).toContain('@/core/calculator');
      expect(result.transformedImports[2]).toBe("import { Button } from './button';");
      expect(result.transformedImports[3]).toBe("import styles from './styles.module.css';");
      expect(result.changesCount).toBe(1);
    });

    it('should track changes count accurately', () => {
      const imports = [
        "import { Calculator } from '../../core/calculator';",
        "import { useHook } from '../../hooks/use-hook';",
        "import { Component } from '../../components/component';",
      ];
      const filePath = '/home/project/src/demo/pages/page.tsx';

      const result = processor.applyTransformations(imports, filePath);

      expect(result.changesCount).toBe(3);
    });

    it('should handle imports with no extractable path', () => {
      const imports = [
        "import 'side-effect';", // Side-effect import
      ];
      const filePath = '/home/project/src/components/ui/button.tsx';

      const result = processor.applyTransformations(imports, filePath);

      expect(result.transformedImports[0]).toBe("import 'side-effect';");
      expect(result.changesCount).toBe(0);
    });
  });

  describe('reconstructContent', () => {
    it('should reconstruct file with organized imports', () => {
      const originalContent = `import React from 'react';
import { Calculator } from '../../../core/calculator';

function App() {}`;

      const organizedImports = `import React from 'react';

import { Calculator } from '@/core/calculator';`;

      const result = processor.reconstructContent(originalContent, organizedImports);

      expect(result).toContain('import React from');
      expect(result).toContain('import { Calculator }');
      expect(result).toContain('function App()');
    });

    it('should handle content with no imports', () => {
      const originalContent = `function App() {
  return <div>Hello</div>;
}`;

      const organizedImports = '';

      const result = processor.reconstructContent(originalContent, organizedImports);

      expect(result).toBe(originalContent);
    });

    it('should preserve content before imports', () => {
      const originalContent = `/**
 * File header comment
 */

import React from 'react';

function App() {}`;

      const organizedImports = `import React from 'react';`;

      const result = processor.reconstructContent(originalContent, organizedImports);

      expect(result).toContain('File header comment');
      expect(result).toContain('import React');
      expect(result).toContain('function App()');
    });

    it('should preserve content after imports', () => {
      const originalContent = `import React from 'react';

function App() {
  return <div>Hello</div>;
}

export default App;`;

      const organizedImports = `import React from 'react';`;

      const result = processor.reconstructContent(originalContent, organizedImports);

      expect(result).toContain('function App()');
      expect(result).toContain('export default App');
    });
  });

  describe('transformContent', () => {
    it('should transform and organize imports in content', () => {
      const content = `import React from 'react';
import { Calculator } from '../../core/calculator';
import { useHook } from '../../hooks/use-hook';

function App() {}`;

      const filePath = '/home/project/src/components/ui/button.tsx';

      const result = processor.transformContent(content, filePath);

      expect(result).toContain('import React from');
      expect(result).toContain('@/core/calculator');
      expect(result).toContain('@/hooks/use-hook');
      expect(result).toContain('function App()');
    });

    it('should return original content if no imports', () => {
      const content = `function App() {
  return <div>Hello</div>;
}`;

      const filePath = '/home/project/src/components/ui/button.tsx';

      const result = processor.transformContent(content, filePath);

      expect(result).toBe(content);
    });

    it('should return original content if no changes needed', () => {
      const content = `import React from 'react';
import { Calculator } from '@/core/calculator';

function App() {}`;

      const filePath = '/home/project/src/components/ui/button.tsx';

      const result = processor.transformContent(content, filePath);

      // Content should be similar (might have different formatting due to organization)
      expect(result).toContain('import React from');
      expect(result).toContain('@/core/calculator');
    });
  });

  describe('processFile', () => {
    it('should successfully process a file', () => {
      const mockContent = `import React from 'react';
import { Calculator } from '../../core/calculator';

function App() {}`;

      (fs.readFileSync as any).mockReturnValue(mockContent);

      const result = processor.processFile('/home/project/src/components/ui/button.tsx');

      expect(result.success).toBe(true);
      expect(result.filePath).toBe('/home/project/src/components/ui/button.tsx');
      expect(result.transformedContent).toBeDefined();
      expect(result.transformedContent).toContain('@/core/calculator');
      expect(result.error).toBeNull();
      expect(result.changesCount).toBeGreaterThan(0);
    });

    it('should handle file with no changes needed', () => {
      const mockContent = `import React from 'react';

function App() {}`;

      (fs.readFileSync as any).mockReturnValue(mockContent);

      const result = processor.processFile('/home/project/src/components/ui/button.tsx');

      expect(result.success).toBe(true);
      expect(result.changesCount).toBe(0);
    });

    it('should handle file read errors', () => {
      (fs.readFileSync as any).mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = processor.processFile('/home/project/src/components/ui/button.tsx');

      expect(result.success).toBe(false);
      expect(result.transformedContent).toBeNull();
      expect(result.error).toBe('Permission denied');
      expect(result.changesCount).toBe(0);
    });

    it('should track changes count correctly', () => {
      const mockContent = `import React from 'react';
import { Calculator } from '../../core/calculator';
import { useHook } from '../../hooks/use-hook';

function App() {}`;

      (fs.readFileSync as any).mockReturnValue(mockContent);

      const result = processor.processFile('/home/project/src/components/ui/button.tsx');

      expect(result.success).toBe(true);
      expect(result.changesCount).toBe(2); // Two relative imports transformed
    });
  });

  describe('edge cases', () => {
    it('should handle empty file', () => {
      const content = '';
      const filePath = '/home/project/src/components/ui/button.tsx';

      const result = processor.transformContent(content, filePath);

      expect(result).toBe('');
    });

    it('should handle file with only comments', () => {
      const content = `/**
 * This is a comment
 */

// Another comment`;

      const filePath = '/home/project/src/components/ui/button.tsx';

      const result = processor.transformContent(content, filePath);

      expect(result).toContain('This is a comment');
      expect(result).toContain('Another comment');
    });

    it('should handle file with malformed imports gracefully', () => {
      const content = `import React from 'react';
import { broken from '../broken';
import { Calculator } from '../../../core/calculator';

function App() {}`;

      const filePath = '/home/project/src/components/ui/button.tsx';

      // Should not throw, should process what it can
      const result = processor.transformContent(content, filePath);

      expect(result).toBeDefined();
      expect(result).toContain('import React from');
    });

    it('should handle very long import paths', () => {
      const imports = [
        "import { Util } from '../../utils/deeply/nested/util';",
      ];
      const filePath = '/home/project/src/components/ui/button.tsx';

      const result = processor.applyTransformations(imports, filePath);

      expect(result.transformedImports[0]).toContain('@/utils/');
    });
  });
});
