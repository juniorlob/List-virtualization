# React Virtualized List

A high-performance React component for efficiently rendering large lists by only displaying items visible in the viewport. This library demonstrates list virtualization techniques with real-time performance monitoring.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18%2B-blue)](https://reactjs.org/)

## Features

- 🚀 **High Performance**: Renders only visible items, handling 100,000+ items smoothly
- 📊 **Performance Monitoring**: Built-in FPS, memory usage, and DOM node tracking
- 🎯 **Type Safe**: Full TypeScript support with comprehensive type definitions
- 🧪 **Well Tested**: Extensive unit and property-based tests
- 🎨 **Customizable**: Flexible rendering with custom item components
- 📦 **Zero Dependencies**: Pure React implementation (React 18+ required)
- 🔧 **Framework Agnostic Core**: Pure calculation logic separate from React

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Basic Usage](#basic-usage)
- [Advanced Usage](#advanced-usage)
  - [Custom Render Functions](#custom-render-functions)
  - [Performance Monitoring](#performance-monitoring)
  - [Custom Styling](#custom-styling)
  - [Dynamic Data](#dynamic-data)
- [API Reference](#api-reference)
- [Performance Optimization Tips](#performance-optimization-tips)
- [Architecture](#architecture)
- [Development](#development)
- [Testing](#testing)
- [Browser Support](#browser-support)
- [License](#license)

## Installation

```bash
# npm
npm install virtualization-demo

# yarn
yarn add virtualization-demo

# pnpm
pnpm add virtualization-demo
```

### Peer Dependencies

This library requires React 18 or later:

```bash
npm install react@^18.0.0 react-dom@^18.0.0
```

## Quick Start

```tsx
import { VirtualizedList } from 'virtualization-demo';
import 'virtualization-demo/style.css';

function App() {
  const data = Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
  }));

  return (
    <VirtualizedList
      data={data}
      renderItem={(item) => <div>{item.name}</div>}
      itemHeight={50}
      containerHeight={600}
    />
  );
}
```

## Basic Usage

### Simple List

Render a basic list with fixed-height items:

```tsx
import { VirtualizedList } from 'virtualization-demo';

interface User {
  id: string;
  name: string;
  email: string;
}

function UserList() {
  const users: User[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    // ... thousands more users
  ];

  return (
    <VirtualizedList
      data={users}
      renderItem={(user) => (
        <div style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
          <h3>{user.name}</h3>
          <p>{user.email}</p>
        </div>
      )}
      itemHeight={80}
      containerHeight={600}
    />
  );
}
```

### With Item Index

Access the item index in your render function:

```tsx
<VirtualizedList
  data={items}
  renderItem={(item, index) => (
    <div>
      <span>#{index + 1}</span>
      <span>{item.name}</span>
    </div>
  )}
  itemHeight={50}
  containerHeight={600}
/>
```

## Advanced Usage

### Custom Render Functions

Create complex item layouts with custom components:

```tsx
import { VirtualizedList } from 'virtualization-demo';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
}

function ProductCard({ product }: { product: Product }) {
  return (
    <div style={{
      display: 'flex',
      padding: '15px',
      gap: '15px',
      borderBottom: '1px solid #ddd'
    }}>
      <img
        src={product.image}
        alt={product.name}
        style={{ width: 80, height: 80, objectFit: 'cover' }}
      />
      <div style={{ flex: 1 }}>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <strong>${product.price.toFixed(2)}</strong>
      </div>
    </div>
  );
}

function ProductList({ products }: { products: Product[] }) {
  return (
    <VirtualizedList
      data={products}
      renderItem={(product) => <ProductCard product={product} />}
      itemHeight={110}
      containerHeight={800}
      overscan={5}
    />
  );
}
```

### Performance Monitoring

Track real-time performance metrics:

```tsx
import { VirtualizedList } from 'virtualization-demo';
import { useState } from 'react';

function MonitoredList() {
  const [metrics, setMetrics] = useState({
    fps: 0,
    memoryUsage: 0,
    domNodes: 0,
    renderTime: 0,
  });

  const data = Array.from({ length: 50000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
  }));

  return (
    <div>
      <div style={{ padding: '10px', background: '#f5f5f5' }}>
        <h3>Performance Metrics</h3>
        <p>FPS: {metrics.fps}</p>
        <p>Memory: {metrics.memoryUsage.toFixed(2)} MB</p>
        <p>DOM Nodes: {metrics.domNodes}</p>
        <p>Render Time: {metrics.renderTime.toFixed(2)} ms</p>
      </div>

      <VirtualizedList
        data={data}
        renderItem={(item) => <div>{item.name}</div>}
        itemHeight={50}
        containerHeight={600}
        onMetricsChange={setMetrics}
      />
    </div>
  );
}
```

### Custom Styling

Apply custom styles to the container:

```tsx
import { VirtualizedList } from 'virtualization-demo';
import styles from './MyList.module.css';

function StyledList() {
  return (
    <VirtualizedList
      data={items}
      renderItem={(item) => <div>{item.name}</div>}
      itemHeight={50}
      containerHeight={600}
      className={styles.customList}
    />
  );
}
```

```css
/* MyList.module.css */
.customList {
  border: 2px solid #333;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.customList::-webkit-scrollbar {
  width: 12px;
}

.customList::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.customList::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 6px;
}
```

### Dynamic Data

Handle data changes efficiently:

```tsx
import { VirtualizedList } from 'virtualization-demo';
import { useState } from 'react';

function DynamicList() {
  const [items, setItems] = useState(
    Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Item ${i}` }))
  );

  const addItems = () => {
    setItems(prev => [
      ...prev,
      ...Array.from({ length: 100 }, (_, i) => ({
        id: prev.length + i,
        name: `Item ${prev.length + i}`,
      })),
    ]);
  };

  const removeItems = () => {
    setItems(prev => prev.slice(0, -100));
  };

  return (
    <div>
      <div style={{ padding: '10px' }}>
        <button onClick={addItems}>Add 100 Items</button>
        <button onClick={removeItems}>Remove 100 Items</button>
        <p>Total Items: {items.length}</p>
      </div>

      <VirtualizedList
        data={items}
        renderItem={(item) => <div>{item.name}</div>}
        itemHeight={50}
        containerHeight={600}
      />
    </div>
  );
}
```

### Adjustable Overscan

Control the overscan buffer for optimal performance:

```tsx
import { VirtualizedList } from 'virtualization-demo';
import { useState } from 'react';

function AdjustableOverscanList() {
  const [overscan, setOverscan] = useState(3);

  return (
    <div>
      <div style={{ padding: '10px' }}>
        <label>
          Overscan: {overscan}
          <input
            type="range"
            min="0"
            max="10"
            value={overscan}
            onChange={(e) => setOverscan(Number(e.target.value))}
          />
        </label>
        <p>
          Overscan adds extra items above and below the viewport to prevent
          blank spaces during fast scrolling.
        </p>
      </div>

      <VirtualizedList
        data={items}
        renderItem={(item) => <div>{item.name}</div>}
        itemHeight={50}
        containerHeight={600}
        overscan={overscan}
      />
    </div>
  );
}
```

## API Reference

### VirtualizedList Props

```typescript
interface VirtualizedListProps<T> {
  /** Array of data items to render (required) */
  data: T[];

  /** Function to render each item (required) */
  renderItem: (item: T, index: number) => React.ReactNode;

  /** Height of each item in pixels (required) */
  itemHeight: number;

  /** Height of the scrollable container in pixels (default: 600) */
  containerHeight?: number;

  /** Number of items to render above/below viewport (default: 3) */
  overscan?: number;

  /** Additional CSS class name for the container */
  className?: string;

  /** Callback invoked when performance metrics change */
  onMetricsChange?: (metrics: PerformanceMetrics) => void;

  /** Custom calculator instance for testing/customization */
  calculator?: IVirtualizationCalculator;
}
```

### PerformanceMetrics

```typescript
interface PerformanceMetrics {
  /** Frames per second during scrolling */
  fps: number;

  /** JavaScript heap memory usage in megabytes */
  memoryUsage: number;

  /** Number of DOM nodes in the rendered list */
  domNodes: number;

  /** Last render time in milliseconds */
  renderTime: number;
}
```

### useVirtualization Hook

For advanced use cases, you can use the underlying hook directly:

```typescript
import { useVirtualization } from 'virtualization-demo';

function CustomVirtualizedComponent() {
  const { visibleRange, totalHeight, onScroll, containerRef, metrics } =
    useVirtualization(
      1000, // itemCount
      50,   // itemHeight
      {
        containerHeight: 600,
        overscan: 3,
        enablePerformanceMonitoring: true,
      }
    );

  // Build your custom virtualized component
  return (
    <div ref={containerRef} onScroll={onScroll} style={{ height: 600 }}>
      <div style={{ height: totalHeight }}>
        {/* Render items from visibleRange.start to visibleRange.end */}
      </div>
    </div>
  );
}
```

## Performance Optimization Tips

### 1. Use Fixed Item Heights

The component works best with fixed-height items. Variable heights are not currently supported.

```tsx
// ✅ Good: Fixed height
<VirtualizedList itemHeight={50} ... />

// ❌ Avoid: Variable heights (not supported)
```

### 2. Optimize Render Functions

Keep your `renderItem` function lightweight and avoid expensive computations:

```tsx
// ✅ Good: Simple, memoized component
const ItemComponent = React.memo(({ item }) => (
  <div>{item.name}</div>
));

<VirtualizedList
  renderItem={(item) => <ItemComponent item={item} />}
  ...
/>

// ❌ Avoid: Heavy computations in render
<VirtualizedList
  renderItem={(item) => (
    <div>{expensiveCalculation(item)}</div>
  )}
  ...
/>
```

### 3. Adjust Overscan for Your Use Case

- **Low overscan (0-2)**: Better memory usage, may show blank spaces during fast scrolling
- **Medium overscan (3-5)**: Balanced performance (recommended)
- **High overscan (6-10)**: Smoother scrolling, higher memory usage

```tsx
// For smooth scrolling with large items
<VirtualizedList overscan={5} ... />

// For memory-constrained environments
<VirtualizedList overscan={1} ... />
```

### 4. Use Stable Keys

Ensure your data items have stable, unique IDs:

```tsx
// ✅ Good: Stable ID
const data = items.map((item, i) => ({
  id: item.id || `item-${i}`,
  ...item
}));

// ❌ Avoid: Using index as key (handled internally, but IDs are better)
```

### 5. Memoize Data Arrays

Prevent unnecessary re-renders by memoizing your data array:

```tsx
import { useMemo } from 'react';

function MyList() {
  const data = useMemo(
    () => generateLargeDataset(),
    [/* dependencies */]
  );

  return <VirtualizedList data={data} ... />;
}
```

### 6. Batch Data Updates

When updating data, batch changes together:

```tsx
// ✅ Good: Single update
setItems(prev => [...prev, ...newItems]);

// ❌ Avoid: Multiple updates in sequence
newItems.forEach(item => setItems(prev => [...prev, item]));
```

### 7. Monitor Performance in Production

Use the `onMetricsChange` callback to track performance in production:

```tsx
<VirtualizedList
  onMetricsChange={(metrics) => {
    if (metrics.fps < 30) {
      console.warn('Low FPS detected:', metrics);
      // Send to analytics service
    }
  }}
  ...
/>
```

### Performance Benchmarks

Typical performance characteristics on modern hardware:

| Item Count | DOM Nodes | Memory Usage | FPS (Scrolling) |
|------------|-----------|--------------|-----------------|
| 1,000      | ~20       | ~5 MB        | 60              |
| 10,000     | ~20       | ~15 MB       | 60              |
| 100,000    | ~20       | ~80 MB       | 60              |

*Note: Actual performance depends on item complexity and hardware.*

## Architecture

This library follows a layered architecture with clear separation of concerns:

```
┌─────────────────────────────────────┐
│      Components (React UI)          │
├─────────────────────────────────────┤
│      Hooks (React Integration)      │
├─────────────────────────────────────┤
│      Core (Pure Logic)              │
├─────────────────────────────────────┤
│      Adapters (Browser APIs)        │
└─────────────────────────────────────┘
```

### Core Principles

1. **Pure Core Logic**: Virtualization calculations are pure functions with no side effects
2. **Dependency Injection**: Calculator and monitor can be injected for testing
3. **Type Safety**: Full TypeScript support throughout
4. **Testability**: Each layer can be tested in isolation
5. **Performance First**: Optimized for 60 FPS with large datasets

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/virtualization-demo.git
cd virtualization-demo

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

```bash
# Development
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm test             # Run tests in watch mode
npm run test:run     # Run tests once
npm run test:coverage # Generate coverage report
npm run test:ui      # Open Vitest UI

# Code Quality
npm run lint         # Lint code
npm run type-check   # TypeScript type checking
```

### Project Structure

```
virtualization-demo/
├── src/
│   ├── core/                    # Pure business logic
│   │   └── virtualization/      # Virtualization calculations
│   ├── hooks/                   # React hooks
│   │   └── use-virtualization.ts
│   ├── components/              # React components
│   │   └── virtualized-list/
│   ├── adapters/                # External API adapters
│   │   └── performance-api/
│   └── demo/                    # Demo pages
│       ├── pages/
│       └── utils/
├── tests/
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   └── properties/              # Property-based tests
└── dist/                        # Build output
```

## Testing

This project uses a comprehensive testing strategy:

### Unit Tests

Test specific functionality with concrete examples:

```bash
npm test
```

### Property-Based Tests

Test universal properties across random inputs using [fast-check](https://github.com/dubzzz/fast-check):

```typescript
// Example property test
test('visible range is always within bounds', () => {
  fc.assert(
    fc.property(
      fc.nat(10000),      // scrollTop
      fc.integer(100, 1000), // containerHeight
      fc.integer(0, 10000),  // itemCount
      (scrollTop, containerHeight, itemCount) => {
        const calculator = new VirtualizationCalculator();
        const range = calculator.calculateVisibleRange(
          scrollTop, containerHeight, itemCount, 50, 3
        );

        expect(range.start).toBeGreaterThanOrEqual(0);
        expect(range.end).toBeLessThan(itemCount);
      }
    )
  );
});
```

### Coverage

Run tests with coverage:

```bash
npm run test:coverage
```

Target coverage: 90%+ for core logic

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Opera: ✅ Full support

### Required Browser Features

- ES6+ JavaScript
- Performance API (for metrics)
- CSS Grid and Flexbox
- requestAnimationFrame

### Graceful Degradation

- Performance metrics gracefully degrade if Performance API is unavailable
- Memory usage tracking is Chrome-only (returns 0 in other browsers)

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Ensure all tests pass (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow the existing code style
- Add JSDoc comments for public APIs
- Write tests for new features

## License

MIT © [Your Name]

## Acknowledgments

- Inspired by [react-window](https://github.com/bvaughn/react-window) and [react-virtualized](https://github.com/bvaughn/react-virtualized)
- Built with [Vite](https://vitejs.dev/) and [React](https://reactjs.org/)
- Tested with [Vitest](https://vitest.dev/) and [fast-check](https://github.com/dubzzz/fast-check)

## Support

- 📖 [Documentation](https://github.com/yourusername/virtualization-demo)
- 🐛 [Issue Tracker](https://github.com/yourusername/virtualization-demo/issues)
- 💬 [Discussions](https://github.com/yourusername/virtualization-demo/discussions)

---

Made with ❤️ by the community
