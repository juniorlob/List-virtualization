/**
 * ModeToggle Component
 *
 * Provides a two-button toggle control for switching between virtualized
 * and non-virtualized list rendering modes.
 */

import styles from './mode-toggle.module.css';

export type ListMode = 'virtualized' | 'non-virtualized';

export interface ModeToggleProps {
  /** Current active mode */
  currentMode: ListMode;
  /** Callback when mode changes */
  onModeChange: (mode: ListMode) => void;
  /** Whether the toggle is disabled */
  disabled?: boolean;
}

/**
 * ModeToggle component for switching between list rendering modes
 */
export const ModeToggle: React.FC<ModeToggleProps> = ({
  currentMode,
  onModeChange,
  disabled = false,
}) => {
  return (
    <div className={styles.modeToggle} data-testid="mode-toggle">
      <button
        className={currentMode === 'non-virtualized' ? styles.active : ''}
        onClick={() => onModeChange('non-virtualized')}
        disabled={disabled}
        data-testid="mode-toggle-non-virtualized"
        aria-pressed={currentMode === 'non-virtualized'}
      >
        Non-Virtualized
      </button>
      <button
        className={currentMode === 'virtualized' ? styles.active : ''}
        onClick={() => onModeChange('virtualized')}
        disabled={disabled}
        data-testid="mode-toggle-virtualized"
        aria-pressed={currentMode === 'virtualized'}
      >
        Virtualized
      </button>
    </div>
  );
};
