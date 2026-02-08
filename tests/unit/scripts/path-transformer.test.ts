/**
 * Unit tests for Path Transformer Module
 *
 * Tests the functionality of:
 * - Relative-to-absolute path resolution
 * - Layer directory detection
 * - Path alias construction
 * - Barrel export handling (removing '/index' suffix)
 *
 * Requirements: 1.1, 2.1, 2.2, 3.1, 4.1, 5.1, 6.1
 */

import { describe, it, expect } from 'vitest';
import {
  DefaultPathTransformer,
  createPathTransformer,
  replaceImportPath,
} from '../../../src/scripts/migration/path-transformer.js';
import type { Layer } from '../../../src/scripts/migration/types.js';

describe('Path Transformer Module', () => {
  describe('DefaultPathTransformer', () => {
    const transformer = new DefaultPathTransformer();

    describe('resolveImportPath', () => {
      it('should resolve relative path from same directory', () => {
        const currentFile = '/project/src/core/virtualization/calculator.ts';
        const importPath = './types';

        const resolved = transformer.resolveImportPath(importPath, currentFile);

        expect(resolved).toContain('/src/core/virtualization/types');
      });

      it('should resolve relative path from parent directory', () => {
        const currentFile = '/project/src/hooks/use-virtualization.ts';
        const importPath = '../core/calculator';

        const resolved = transformer.resolveImportPath(importPath, currentFile);

        expect(resolved).toContain('/src/core/calculator');
      });

      it('should resolve relative path with multiple parent traversals', () => {
        const currentFile = '/project/src/components/virtualized-list/index.tsx';
        const importPath = '../../core/virtualization/calculator';

        const resolved = transformer.resolveImportPath(importPath, currentFile);

        expect(resolved).toContain('/src/core/virtualization/calculator');
      });

      it('should handle Windows-style paths', () => {
        const currentFile = 'C:\\project\\src\\hooks\\use-virtualization.ts';
        const importPath = '../core/calculator';

        const resolved = transformer.resolveImportPath(importPath, currentFile);

        // Should normalize to forward slashes
        expect(resolved).not.toContain('\\');
        expect(resolved).toContain('/core/calculator');
      });

      it('should resolve subdirectory imports', () => {
        const currentFile = '/project/src/core/calculator.ts';
        const importPath = './virtualization/types';

        const resolved = transformer.resolveImportPath(importPath, currentFile);

        expect(resolved).toContain('/src/core/virtualization/types');
      });
    });

    describe('detectLayer', () => {
      it('should detect core layer', () => {
        const resolvedPath = '/project/src/core/virtualization/calculator.ts';
        expect(transformer.detectLayer(resolvedPath)).toBe('core');
      });

      it('should detect hooks layer', () => {
        const resolvedPath = '/project/src/hooks/use-virtualization.ts';
        expect(transformer.detectLayer(resolvedPath)).toBe('hooks');
      });

      it('should detect components layer', () => {
        const resolvedPath = '/project/src/components/virtualized-list/index.tsx';
        expect(transformer.detectLayer(resolvedPath)).toBe('components');
      });

      it('should detect adapters layer', () => {
        const resolvedPath = '/project/src/adapters/performance-api/monitor.ts';
        expect(transformer.detectLayer(resolvedPath)).toBe('adapters');
      });

      it('should detect demo layer', () => {
        const resolvedPath = '/project/src/demo/pages/unified-demo-page.tsx';
        expect(transformer.detectLayer(resolvedPath)).toBe('demo');
      });

      it('should detect utils layer', () => {
        const resolvedPath = '/project/src/utils/debounce.ts';
        expect(transformer.detectLayer(resolvedPath)).toBe('utils');
      });

      it('should return null for non-layer paths', () => {
        expect(transformer.detectLayer('/project/node_modules/react/index.js')).toBeNull();
        expect(transformer.detectLayer('/project/tests/unit/test.ts')).toBeNull();
        expect(transformer.detectLayer('/project/vite.config.ts')).toBeNull();
      });

      it('should handle Windows-style paths', () => {
        const resolvedPath = 'C:\\project\\src\\core\\calculator.ts';
        expect(transformer.detectLayer(resolvedPath)).toBe('core');
      });

      it('should handle nested subdirectories', () => {
        const resolvedPath = '/project/src/core/virtualization/advanced/calculator.ts';
        expect(transformer.detectLayer(resolvedPath)).toBe('core');
      });
    });

    describe('extractLayerPath', () => {
      it('should extract path after core layer directory', () => {
        const resolvedPath = '/project/src/core/virtualization/calculator.ts';
        const layerPath = transformer.extractLayerPath(resolvedPath, 'core');

        expect(layerPath).toBe('virtualization/calculator');
      });

      it('should extract path after hooks layer directory', () => {
        const resolvedPath = '/project/src/hooks/use-virtualization.ts';
        const layerPath = transformer.extractLayerPath(resolvedPath, 'hooks');

        expect(layerPath).toBe('use-virtualization');
      });

      it('should extract path after components layer directory', () => {
        const resolvedPath = '/project/src/components/virtualized-list/index.tsx';
        const layerPath = transformer.extractLayerPath(resolvedPath, 'components');

        expect(layerPath).toBe('virtualized-list/index');
      });

      it('should extract path after adapters layer directory', () => {
        const resolvedPath = '/project/src/adapters/performance-api/monitor.ts';
        const layerPath = transformer.extractLayerPath(resolvedPath, 'adapters');

        expect(layerPath).toBe('performance-api/monitor');
      });

      it('should extract path after demo layer directory', () => {
        const resolvedPath = '/project/src/demo/pages/unified-demo-page.tsx';
        const layerPath = transformer.extractLayerPath(resolvedPath, 'demo');

        expect(layerPath).toBe('pages/unified-demo-page');
      });

      it('should extract path after utils layer directory', () => {
        const resolvedPath = '/project/src/utils/debounce.ts';
        const layerPath = transformer.extractLayerPath(resolvedPath, 'utils');

        expect(layerPath).toBe('debounce');
      });

      it('should remove .ts extension', () => {
        const resolvedPath = '/project/src/core/calculator.ts';
        const layerPath = transformer.extractLayerPath(resolvedPath, 'core');

        expect(layerPath).toBe('calculator');
        expect(layerPath).not.toContain('.ts');
      });

      it('should remove .tsx extension', () => {
        const resolvedPath = '/project/src/components/list/index.tsx';
        const layerPath = transformer.extractLayerPath(resolvedPath, 'components');

        expect(layerPath).toBe('list/index');
        expect(layerPath).not.toContain('.tsx');
      });

      it('should remove .js extension', () => {
        const resolvedPath = '/project/src/utils/helper.js';
        const layerPath = transformer.extractLayerPath(resolvedPath, 'utils');

        expect(layerPath).toBe('helper');
        expect(layerPath).not.toContain('.js');
      });

      it('should remove .jsx extension', () => {
        const resolvedPath = '/project/src/components/button.jsx';
        const layerPath = transformer.extractLayerPath(resolvedPath, 'components');

        expect(layerPath).toBe('button');
        expect(layerPath).not.toContain('.jsx');
      });

      it('should handle Windows-style paths', () => {
        const resolvedPath = 'C:\\project\\src\\core\\calculator.ts';
        const layerPath = transformer.extractLayerPath(resolvedPath, 'core');

        expect(layerPath).toBe('calculator');
      });

      it('should handle deeply nested paths', () => {
        const resolvedPath = '/project/src/core/virtualization/advanced/optimized/calculator.ts';
        const layerPath = transformer.extractLayerPath(resolvedPath, 'core');

        expect(layerPath).toBe('virtualization/advanced/optimized/calculator');
      });

      it('should return empty string if layer directory not found', () => {
        const resolvedPath = '/project/node_modules/react/index.js';
        const layerPath = transformer.extractLayerPath(resolvedPath, 'core');

        expect(layerPath).toBe('');
      });
    });

    describe('removeIndexSuffix', () => {
      it('should remove /index suffix', () => {
        expect(transformer.removeIndexSuffix('@/hooks/index')).toBe('@/hooks');
        expect(transformer.removeIndexSuffix('@/components/list/index')).toBe('@/components/list');
        expect(transformer.removeIndexSuffix('@/core/virtualization/index')).toBe('@/core/virtualization');
      });

      it('should not remove index from middle of path', () => {
        expect(transformer.removeIndexSuffix('@/core/index/calculator')).toBe('@/core/index/calculator');
        expect(transformer.removeIndexSuffix('@/hooks/use-index')).toBe('@/hooks/use-index');
      });

      it('should not modify paths without /index suffix', () => {
        expect(transformer.removeIndexSuffix('@/core/calculator')).toBe('@/core/calculator');
        expect(transformer.removeIndexSuffix('@/hooks/use-virtualization')).toBe('@/hooks/use-virtualization');
        expect(transformer.removeIndexSuffix('@/components/list')).toBe('@/components/list');
      });

      it('should handle layer alias without path', () => {
        expect(transformer.removeIndexSuffix('@/hooks')).toBe('@/hooks');
        expect(transformer.removeIndexSuffix('@/core')).toBe('@/core');
      });
    });

    describe('transformToAlias', () => {
      it('should transform core layer import', () => {
        const currentFile = '/project/src/hooks/use-virtualization.ts';
        const importPath = '../core/virtualization/calculator';

        const transformed = transformer.transformToAlias(importPath, currentFile);

        expect(transformed).toBe('@/core/virtualization/calculator');
      });

      it('should transform hooks layer import', () => {
        const currentFile = '/project/src/components/list/index.tsx';
        const importPath = '../../hooks/use-virtualization';

        const transformed = transformer.transformToAlias(importPath, currentFile);

        expect(transformed).toBe('@/hooks/use-virtualization');
      });

      it('should transform components layer import', () => {
        const currentFile = '/project/src/demo/pages/demo.tsx';
        const importPath = '../../components/virtualized-list';

        const transformed = transformer.transformToAlias(importPath, currentFile);

        expect(transformed).toBe('@/components/virtualized-list');
      });

      it('should transform adapters layer import', () => {
        const currentFile = '/project/src/hooks/use-performance.ts';
        const importPath = '../adapters/performance-api/monitor';

        const transformed = transformer.transformToAlias(importPath, currentFile);

        expect(transformed).toBe('@/adapters/performance-api/monitor');
      });

      it('should transform demo layer import', () => {
        const currentFile = '/project/src/components/list/index.tsx';
        const importPath = '../../demo/utils/data-generator';

        const transformed = transformer.transformToAlias(importPath, currentFile);

        expect(transformed).toBe('@/demo/utils/data-generator');
      });

      it('should transform utils layer import', () => {
        const currentFile = '/project/src/hooks/use-debounce.ts';
        const importPath = '../utils/debounce';

        const transformed = transformer.transformToAlias(importPath, currentFile);

        expect(transformed).toBe('@/utils/debounce');
      });

      it('should remove /index suffix for barrel exports', () => {
        const currentFile = '/project/src/components/list/item.tsx';
        const importPath = '../virtualized-list/index';

        const transformed = transformer.transformToAlias(importPath, currentFile);

        expect(transformed).toBe('@/components/virtualized-list');
        expect(transformed).not.toContain('/index');
      });

      it('should handle barrel export at layer root', () => {
        const currentFile = '/project/src/components/list/index.tsx';
        const importPath = '../../hooks/index';

        const transformed = transformer.transformToAlias(importPath, currentFile);

        expect(transformed).toBe('@/hooks');
        expect(transformed).not.toContain('/index');
      });

      it('should return null for non-relative imports', () => {
        const currentFile = '/project/src/hooks/use-virtualization.ts';

        expect(transformer.transformToAlias('react', currentFile)).toBeNull();
        expect(transformer.transformToAlias('@/core/calculator', currentFile)).toBeNull();
        expect(transformer.transformToAlias('@testing-library/react', currentFile)).toBeNull();
      });

      it('should return null for non-layer imports', () => {
        const currentFile = '/project/src/hooks/use-virtualization.ts';
        const importPath = '../../tests/unit/test';

        const transformed = transformer.transformToAlias(importPath, currentFile);

        expect(transformed).toBeNull();
      });

      it('should handle deeply nested imports', () => {
        const currentFile = '/project/src/demo/pages/comparison/view.tsx';
        const importPath = '../../../core/virtualization/advanced/calculator';

        const transformed = transformer.transformToAlias(importPath, currentFile);

        expect(transformed).toBe('@/core/virtualization/advanced/calculator');
      });

      it('should handle imports with file extensions', () => {
        const currentFile = '/project/src/hooks/use-virtualization.ts';
        const importPath = '../core/calculator.ts';

        const transformed = transformer.transformToAlias(importPath, currentFile);

        expect(transformed).toBe('@/core/calculator');
        expect(transformed).not.toContain('.ts');
      });

      it('should handle Windows-style paths', () => {
        const currentFile = 'C:\\project\\src\\hooks\\use-virtualization.ts';
        const importPath = '../core/calculator';

        const transformed = transformer.transformToAlias(importPath, currentFile);

        expect(transformed).toBe('@/core/calculator');
      });
    });
  });

  describe('createPathTransformer', () => {
    it('should create a DefaultPathTransformer instance', () => {
      const transformer = createPathTransformer();
      expect(transformer).toBeInstanceOf(DefaultPathTransformer);
    });

    it('should create a functional transformer', () => {
      const transformer = createPathTransformer();
      const currentFile = '/project/src/hooks/use-virtualization.ts';
      const importPath = '../core/calculator';

      const transformed = transformer.transformToAlias(importPath, currentFile);

      expect(transformed).toBe('@/core/calculator');
    });
  });

  describe('replaceImportPath', () => {
    it('should replace import path with single quotes', () => {
      const statement = `import { Calculator } from '../core/calculator';`;
      const result = replaceImportPath(statement, '../core/calculator', '@/core/calculator');

      expect(result).toBe(`import { Calculator } from '@/core/calculator';`);
    });

    it('should replace import path with double quotes', () => {
      const statement = `import { Calculator } from "../core/calculator";`;
      const result = replaceImportPath(statement, '../core/calculator', '@/core/calculator');

      expect(result).toBe(`import { Calculator } from "@/core/calculator";`);
    });

    it('should preserve import symbols', () => {
      const statement = `import { Calculator, VirtualizationOptions } from '../core/calculator';`;
      const result = replaceImportPath(statement, '../core/calculator', '@/core/calculator');

      expect(result).toContain('{ Calculator, VirtualizationOptions }');
      expect(result).toContain('@/core/calculator');
    });

    it('should preserve default imports', () => {
      const statement = `import Calculator from '../core/calculator';`;
      const result = replaceImportPath(statement, '../core/calculator', '@/core/calculator');

      expect(result).toBe(`import Calculator from '@/core/calculator';`);
    });

    it('should preserve namespace imports', () => {
      const statement = `import * as Calculator from '../core/calculator';`;
      const result = replaceImportPath(statement, '../core/calculator', '@/core/calculator');

      expect(result).toBe(`import * as Calculator from '@/core/calculator';`);
    });

    it('should preserve type-only imports', () => {
      const statement = `import type { Props } from '../types';`;
      const result = replaceImportPath(statement, '../types', '@/core/types');

      expect(result).toBe(`import type { Props } from '@/core/types';`);
    });

    it('should handle paths with special regex characters', () => {
      const statement = `import { test } from './test.utils';`;
      const result = replaceImportPath(statement, './test.utils', '@/utils/test.utils');

      expect(result).toBe(`import { test } from '@/utils/test.utils';`);
    });

    it('should preserve whitespace and formatting', () => {
      const statement = `import  {  Calculator  }  from  '../core/calculator';`;
      const result = replaceImportPath(statement, '../core/calculator', '@/core/calculator');

      expect(result).toContain('{  Calculator  }');
      expect(result).toContain('@/core/calculator');
    });
  });

  describe('Edge Cases', () => {
    const transformer = new DefaultPathTransformer();

    it('should handle empty import path', () => {
      const currentFile = '/project/src/hooks/use-virtualization.ts';
      const importPath = '';

      const transformed = transformer.transformToAlias(importPath, currentFile);

      expect(transformed).toBeNull();
    });

    it('should handle root-level imports', () => {
      const currentFile = '/project/src/core/calculator.ts';
      const importPath = './types';

      const transformed = transformer.transformToAlias(importPath, currentFile);

      expect(transformed).toBe('@/core/types');
    });

    it('should handle imports at layer boundary', () => {
      const currentFile = '/project/src/hooks/use-virtualization.ts';
      const importPath = '../core/index';

      const transformed = transformer.transformToAlias(importPath, currentFile);

      // Should detect core layer and create alias, removing /index suffix
      expect(transformed).toBe('@/core');
    });

    it('should handle multiple consecutive parent traversals', () => {
      const currentFile = '/project/src/components/ui/button/primary/index.tsx';
      const importPath = '../../../../core/calculator';

      const transformed = transformer.transformToAlias(importPath, currentFile);

      expect(transformed).toBe('@/core/calculator');
    });
  });
});
