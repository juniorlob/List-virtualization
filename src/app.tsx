import { useState } from 'react'
import { ComparisonDemo, InteractiveDemo, UnifiedDemoPage } from '@/demo/pages'

import './app.css'

type DemoPage = 'comparison' | 'interactive' | 'unified' | 'home'

function App() {
  const [currentPage, setCurrentPage] = useState<DemoPage>('home')

  return (
    <div className="app">
      <nav className="app-nav" role="navigation">
        <div className="app-nav-container">
          <h1 className="app-title">List Virtualization Demo</h1>
          <div className="app-nav-links">
            <button
              className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
              onClick={() => setCurrentPage('home')}
            >
              Home
            </button>
            <button
              className={`nav-link ${currentPage === 'unified' ? 'active' : ''}`}
              onClick={() => setCurrentPage('unified')}
            >
              Unified Demo
            </button>
            <button
              className={`nav-link ${currentPage === 'comparison' ? 'active' : ''}`}
              onClick={() => setCurrentPage('comparison')}
            >
              Comparison Demo
            </button>
            <button
              className={`nav-link ${currentPage === 'interactive' ? 'active' : ''}`}
              onClick={() => setCurrentPage('interactive')}
            >
              Interactive Demo
            </button>
          </div>
        </div>
      </nav>

      <main className="app-main">
        {currentPage === 'home' && <HomePage onNavigate={setCurrentPage} />}
        {currentPage === 'unified' && <UnifiedDemoPage />}
        {currentPage === 'comparison' && <ComparisonDemo />}
        {currentPage === 'interactive' && <InteractiveDemo />}
      </main>
    </div>
  )
}

function HomePage({ onNavigate }: { onNavigate: (page: DemoPage) => void }) {
  return (
    <div className="home-page">
      <header className="home-header">
        <h1>Welcome to List Virtualization Demo</h1>
        <p className="home-subtitle">
          Explore efficient rendering techniques for large datasets in React
        </p>
      </header>

      <div className="home-content">
        <section className="home-section">
          <h2>What is List Virtualization?</h2>
          <p>
            List virtualization is a performance optimization technique that renders only
            the items visible in the viewport, plus a small buffer. This dramatically
            reduces the number of DOM nodes and improves performance when working with
            large datasets.
          </p>
        </section>

        <div className="demo-cards">
          <div className="demo-card">
            <h3>Unified Demo</h3>
            <p>
              Switch between virtualized and non-virtualized modes to see resource savings
              in real-time with side-by-side metrics comparison.
            </p>
            <button
              className="demo-card-button"
              onClick={() => onNavigate('unified')}
            >
              Try Unified Demo
            </button>
          </div>

          <div className="demo-card">
            <h3>Comparison Demo</h3>
            <p>
              See side-by-side comparison of virtualized vs non-virtualized lists with
              real-time performance metrics.
            </p>
            <button
              className="demo-card-button"
              onClick={() => onNavigate('comparison')}
            >
              View Comparison
            </button>
          </div>

          <div className="demo-card">
            <h3>Interactive Demo</h3>
            <p>
              Experiment with different configurations and see how they affect performance
              in real-time.
            </p>
            <button
              className="demo-card-button"
              onClick={() => onNavigate('interactive')}
            >
              Try Interactive Demo
            </button>
          </div>
        </div>

        <section className="home-section">
          <h2>Key Benefits</h2>
          <ul className="benefits-list">
            <li>
              <strong>Constant Performance:</strong> Rendering time stays consistent
              regardless of list size
            </li>
            <li>
              <strong>Low Memory Usage:</strong> Only visible items consume memory
            </li>
            <li>
              <strong>Smooth Scrolling:</strong> Maintains 60 FPS even with thousands of
              items
            </li>
            <li>
              <strong>Scalability:</strong> Can handle millions of items efficiently
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}

export default App
