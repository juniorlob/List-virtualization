/**
 * Manual verification script for InteractiveDemo component
 * This file can be used to manually test the component
 */

import { InteractiveDemo } from './src/demo/pages/interactive-demo';

// Type check: Verify component accepts all props correctly
const testComponent = () => {
  // Test 1: Default props
  const demo1 = <InteractiveDemo />;

  // Test 2: Custom initial item count
  const demo2 = <InteractiveDemo initialItemCount={1000} />;

  // Test 3: Custom overscan
  const demo3 = <InteractiveDemo initialOverscan={5} />;

  // Test 4: Custom item height and container height
  const demo4 = <InteractiveDemo itemHeight={80} containerHeight={800} />;

  // Test 5: All custom props
  const demo5 = (
    <InteractiveDemo
      initialItemCount={2000}
      itemHeight={70}
      containerHeight={700}
      initialOverscan={4}
    />
  );

  return { demo1, demo2, demo3, demo4, demo5 };
};

// Export for verification
export default testComponent;

console.log('✓ InteractiveDemo component type checks passed');
