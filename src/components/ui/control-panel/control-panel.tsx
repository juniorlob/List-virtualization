/**
 * ControlPanel Component
 *
 * Provides interactive controls for adjusting demo parameters including
 * dataset size, item height, and overscan (when applicable).
 */

import styles from './control-panel.module.css';

export interface ControlPanelProps {
  /** Current dataset size */
  datasetSize: number;
  /** Current overscan value */
  overscan: number;
  /** Whether to show the overscan control */
  showOverscan: boolean;
  /** Callback when dataset size changes */
  onDatasetSizeChange: (size: number) => void;
  /** Callback when overscan changes */
  onOverscanChange: (overscan: number) => void;
}

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  testId?: string;
}

/**
 * SliderControl - Reusable slider input with label and value display
 */
const SliderControl: React.FC<SliderControlProps> = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
  testId,
}) => {
  return (
    <div className={styles.sliderControl} data-testid={testId}>
      <div className={styles.sliderHeader}>
        <label className={styles.sliderLabel}>{label}</label>
        <span className={styles.sliderValue}>{value.toLocaleString()}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={styles.slider}
        data-testid={`${testId}-input`}
      />
      <div className={styles.sliderRange}>
        <span>{min.toLocaleString()}</span>
        <span>{max.toLocaleString()}</span>
      </div>
    </div>
  );
};

/**
 * ControlPanel component for adjusting demo parameters
 */
export const ControlPanel: React.FC<ControlPanelProps> = ({
  datasetSize,
  overscan,
  showOverscan,
  onDatasetSizeChange,
  onOverscanChange,
}) => {
  return (
    <div className={styles.controlPanel} data-testid="control-panel">
      <h3 className={styles.title}>Configuration</h3>

      <SliderControl
        label="Dataset Size"
        value={datasetSize}
        min={100}
        max={100000}
        step={100}
        onChange={onDatasetSizeChange}
        testId="dataset-size-control"
      />

      {showOverscan && (
        <SliderControl
          label="Overscan"
          value={overscan}
          min={0}
          max={10}
          step={1}
          onChange={onOverscanChange}
          testId="overscan-control"
        />
      )}
    </div>
  );
};
