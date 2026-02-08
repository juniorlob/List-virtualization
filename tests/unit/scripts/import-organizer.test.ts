/**
 * Unit tests for Import Organizer Module
 *
 * Tests:
 * - Import classification (external, core, hooks, components, adapters, utils, types, styles)
 * - Import group ordering
 * - Blank line insertion between groups
 * - Preservation of original import statement formatting
 * - Type-only import detection
 * - CSS module import detection
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9
 */

import { describe, it, expect } from 'vitest';
import {
  DefaultImportOrganizer,
  createImportOrganizer,
  organizeFileImports,
} from '../../../src/scripts/migration/import-organizer.js';
import type { ImportGroup } from '../../../src/scripts/migration/types.js';

describe('DefaultImportOrganizer', () => {
  describe('extractImportSource', () => {
    it('should extract source from standard import with single quotes', () => {
      const organizer = new DefaultImportOrganizer();
      const source = organizer.extractImportSource("import { foo } from 'bar'");
      expect(source).toBe('bar');
    });

    it('should extract source from standard import with double quotes', () => {
      const organizer = new DefaultImportOrganizer();
      const source = organizer.extractImportSource('import { foo } from "bar"');
      expect(source).toBe('bar');
    });

    it('should extract source from default import', () => {
      const organizer = new DefaultImportOrganizer();
      const source = organizer.extractImportSource("import React from 'react'");
      expect(source).toBe('react');
    });

    it('should extract source from namespace import', () => {
      const organizer = new DefaultImportOrganizer();
      const source = organizer.extractImportSource("import * as path from 'path'");
      expect(source).toBe('path');
    });

    it('should extract source from type-only import', () => {
      const organizer = new DefaultImportOrganizer();
      const source = organizer.extractImportSource("import type { Foo } from '@/core/types'");
      expect(source).toBe('@/core/types');
    });

    it('should extract source from dynamic import', () => {
      const organizer = new DefaultImportOrganizer();
      const source = organizer.extractImportSource("import('./module')");
      expect(source).toBe('./module');
    });

    it('should return null for malformed import', () => {
      const organizer = new DefaultImportOrganizer();
      const source = organizer.extractImportSource('import something');
      expect(source).toBeNull();
    });
  });

  describe('isTypeOnlyImport', () => {
    it('should detect type-only import', () => {
      const organizer = new DefaultImportOrganizer();
      expect(organizer.isTypeOnlyImport("import type { Foo } from 'bar'")).toBe(true);
    });

    it('should detect type-only import with multiple spaces', () => {
      const organizer = new DefaultImportOrganizer();
      expect(organizer.isTypeOnlyImport("import  type  { Foo } from 'bar'")).toBe(true);
    });

    it('should not detect regular import as type-only', () => {
      const organizer = new DefaultImportOrganizer();
      expect(organizer.isTypeOnlyImport("import { Foo } from 'bar'")).toBe(false);
    });

    it('should not detect named type import as type-only', () => {
      const organizer = new DefaultImportOrganizer();
      expect(organizer.isTypeOnlyImport("import { type Foo } from 'bar'")).toBe(false);
    });
  });

  describe('classifyImport', () => {
    const organizer = new DefaultImportOrganizer();

    describe('external imports', () => {
      it('should classify React as external', () => {
        expect(organizer.classifyImport("import React from 'react'")).toBe('external');
      });

      it('should classify npm package as external', () => {
        expect(organizer.classifyImport("import { useState } from 'react'")).toBe('external');
      });

      it('should classify node module as external', () => {
        expect(organizer.classifyImport("import * as path from 'path'")).toBe('external');
      });

      it('should classify relative import as external', () => {
        expect(organizer.classifyImport("import { foo } from './foo'")).toBe('external');
      });

      it('should classify parent relative import as external', () => {
        expect(organizer.classifyImport("import { bar } from '../bar'")).toBe('external');
      });

      it('should classify @/demo imports as external', () => {
        expect(organizer.classifyImport("import { Demo } from '@/demo/pages/demo'")).toBe('external');
      });
    });

    describe('core imports', () => {
      it('should classify @/core import as core', () => {
        expect(organizer.classifyImport("import { Calculator } from '@/core/calculator'")).toBe('core');
      });

      it('should classify @/core/virtualization import as core', () => {
        expect(organizer.classifyImport("import { VirtualizationCalculator } from '@/core/virtualization/calculator'")).toBe('core');
      });
    });

    describe('hooks imports', () => {
      it('should classify @/hooks import as hooks', () => {
        expect(organizer.classifyImport("import { useVirtualization } from '@/hooks/use-virtualization'")).toBe('hooks');
      });

      it('should classify @/hooks barrel import as hooks', () => {
        expect(organizer.classifyImport("import { useVirtualization } from '@/hooks'")).toBe('hooks');
      });
    });

    describe('components imports', () => {
      it('should classify @/components import as components', () => {
        expect(organizer.classifyImport("import { VirtualizedList } from '@/components/virtualized-list'")).toBe('components');
      });

      it('should classify @/components/ui import as components', () => {
        expect(organizer.classifyImport("import { Button } from '@/components/ui/button'")).toBe('components');
      });
    });

    describe('adapters imports', () => {
      it('should classify @/adapters import as adapters', () => {
        expect(organizer.classifyImport("import { PerformanceMonitor } from '@/adapters/performance-api/performance-monitor'")).toBe('adapters');
      });

      it('should classify @/adapters/dom import as adapters', () => {
        expect(organizer.classifyImport("import { DOMAdapter } from '@/adapters/dom/dom-adapter'")).toBe('adapters');
      });
    });

    describe('utils imports', () => {
      it('should classify @/utils import as utils', () => {
        expect(organizer.classifyImport("import { debounce } from '@/utils/debounce'")).toBe('utils');
      });

      it('should classify @/utils barrel import as utils', () => {
        expect(organizer.classifyImport("import { debounce, throttle } from '@/utils'")).toBe('utils');
      });
    });

    describe('types imports', () => {
      it('should classify type-only import from external as types', () => {
        expect(organizer.classifyImport("import type { ReactNode } from 'react'")).toBe('types');
      });

      it('should classify type-only import from @/core as types', () => {
        expect(organizer.classifyImport("import type { VirtualizationOptions } from '@/core/types'")).toBe('types');
      });

      it('should classify type-only import from @/hooks as types', () => {
        expect(organizer.classifyImport("import type { UseVirtualizationResult } from '@/hooks/use-virtualization'")).toBe('types');
      });

      it('should classify type-only import from @/components as types', () => {
        expect(organizer.classifyImport("import type { VirtualizedListProps } from '@/components/virtualized-list'")).toBe('types');
      });
    });

    describe('styles imports', () => {
      it('should classify CSS import as styles', () => {
        expect(organizer.classifyImport("import './styles.css'")).toBe('styles');
      });

      it('should classify CSS module import as styles', () => {
        expect(organizer.classifyImport("import styles from './component.module.css'")).toBe('styles');
      });

      it('should classify relative CSS module import as styles', () => {
        expect(organizer.classifyImport("import styles from '../shared/styles.module.css'")).toBe('styles');
      });
    });
  });

  describe('organizeImports', () => {
    const organizer = new DefaultImportOrganizer();

    it('should organize imports in correct order with blank lines', () => {
      const imports = [
        "import styles from './component.module.css'",
        "import type { ReactNode } from 'react'",
        "import { useVirtualization } from '@/hooks/use-virtualization'",
        "import React from 'react'",
        "import { VirtualizationCalculator } from '@/core/virtualization/calculator'",
        "import { Button } from '@/components/ui/button'",
      ];

      const organized = organizer.organizeImports(imports);

      const expected = [
        "import React from 'react'",
        '',
        "import { VirtualizationCalculator } from '@/core/virtualization/calculator'",
        '',
        "import { useVirtualization } from '@/hooks/use-virtualization'",
        '',
        "import { Button } from '@/components/ui/button'",
        '',
        "import type { ReactNode } from 'react'",
        '',
        "import styles from './component.module.css'",
      ].join('\n');

      expect(organized).toBe(expected);
    });

    it('should handle all import groups', () => {
      const imports = [
        "import styles from './styles.module.css'",
        "import type { Foo } from 'bar'",
        "import { debounce } from '@/utils/debounce'",
        "import { PerformanceMonitor } from '@/adapters/performance-api/performance-monitor'",
        "import { Button } from '@/components/ui/button'",
        "import { useVirtualization } from '@/hooks/use-virtualization'",
        "import { VirtualizationCalculator } from '@/core/virtualization/calculator'",
        "import React from 'react'",
      ];

      const organized = organizer.organizeImports(imports);

      const expected = [
        "import React from 'react'",
        '',
        "import { VirtualizationCalculator } from '@/core/virtualization/calculator'",
        '',
        "import { useVirtualization } from '@/hooks/use-virtualization'",
        '',
        "import { Button } from '@/components/ui/button'",
        '',
        "import { PerformanceMonitor } from '@/adapters/performance-api/performance-monitor'",
        '',
        "import { debounce } from '@/utils/debounce'",
        '',
        "import type { Foo } from 'bar'",
        '',
        "import styles from './styles.module.css'",
      ].join('\n');

      expect(organized).toBe(expected);
    });

    it('should handle empty import list', () => {
      const organized = organizer.organizeImports([]);
      expect(organized).toBe('');
    });

    it('should handle single import', () => {
      const imports = ["import React from 'react'"];
      const organized = organizer.organizeImports(imports);
      expect(organized).toBe("import React from 'react'");
    });

    it('should handle multiple imports from same group', () => {
      const imports = [
        "import React from 'react'",
        "import { useState, useEffect } from 'react'",
        "import * as path from 'path'",
      ];

      const organized = organizer.organizeImports(imports);

      const expected = [
        "import React from 'react'",
        "import { useState, useEffect } from 'react'",
        "import * as path from 'path'",
      ].join('\n');

      expect(organized).toBe(expected);
    });

    it('should skip empty groups', () => {
      const imports = [
        "import React from 'react'",
        "import { VirtualizationCalculator } from '@/core/virtualization/calculator'",
        // No hooks, components, adapters, utils
        "import styles from './styles.module.css'",
      ];

      const organized = organizer.organizeImports(imports);

      const expected = [
        "import React from 'react'",
        '',
        "import { VirtualizationCalculator } from '@/core/virtualization/calculator'",
        '',
        "import styles from './styles.module.css'",
      ].join('\n');

      expect(organized).toBe(expected);
    });

    it('should preserve import statement formatting', () => {
      const imports = [
        "import   React   from   'react'",
        "import { VirtualizationCalculator } from '@/core/virtualization/calculator'",
      ];

      const organized = organizer.organizeImports(imports);

      // Original formatting should be preserved
      expect(organized).toContain("import   React   from   'react'");
      expect(organized).toContain("import { VirtualizationCalculator } from '@/core/virtualization/calculator'");
    });
  });
});

describe('createImportOrganizer', () => {
  it('should create an ImportOrganizer instance', () => {
    const organizer = createImportOrganizer();
    expect(organizer).toBeDefined();
    expect(typeof organizer.organizeImports).toBe('function');
    expect(typeof organizer.classifyImport).toBe('function');
  });
});

describe('organizeFileImports', () => {
  it('should organize imports in file content', () => {
    const fileContent = [
      "import { Button } from '@/components/ui/button'",
      "import React from 'react'",
      "import { VirtualizationCalculator } from '@/core/virtualization/calculator'",
      '',
      'export function MyComponent() {',
      '  return <div>Hello</div>;',
      '}',
    ].join('\n');

    const result = organizeFileImports(fileContent);

    expect(result.organizedImports).toContain("import React from 'react'");
    expect(result.organizedImports).toContain("import { VirtualizationCalculator } from '@/core/virtualization/calculator'");
    expect(result.organizedImports).toContain("import { Button } from '@/components/ui/button'");

    // Check that blank lines are inserted
    const lines = result.organizedImports.split('\n');
    expect(lines.some(line => line === '')).toBe(true);

    // Check that the rest of the file is preserved
    expect(result.restOfFile).toContain('export function MyComponent()');
  });

  it('should handle file with no imports', () => {
    const fileContent = [
      'export function MyComponent() {',
      '  return <div>Hello</div>;',
      '}',
    ].join('\n');

    const result = organizeFileImports(fileContent);

    expect(result.organizedImports).toBe('');
    expect(result.restOfFile).toBe(fileContent);
  });

  it('should skip comments and empty lines before imports', () => {
    const fileContent = [
      '// This is a comment',
      '',
      "import React from 'react'",
      "import { Button } from '@/components/ui/button'",
      '',
      'export function MyComponent() {',
      '  return <div>Hello</div>;',
      '}',
    ].join('\n');

    const result = organizeFileImports(fileContent);

    expect(result.organizedImports).toContain("import React from 'react'");
    expect(result.organizedImports).toContain("import { Button } from '@/components/ui/button'");
  });

  it('should preserve code after imports', () => {
    const fileContent = [
      "import React from 'react'",
      '',
      'const foo = 42;',
      '',
      'export function MyComponent() {',
      '  return <div>Hello</div>;',
      '}',
    ].join('\n');

    const result = organizeFileImports(fileContent);

    expect(result.restOfFile).toContain('const foo = 42;');
    expect(result.restOfFile).toContain('export function MyComponent()');
  });
});
