import React from 'react';

export default function Stepper({ label, value, min, max, step = 1, onChange }) {
  return (
    <div className="stepper">
      <div className="stepper-label">{label}</div>
      <div className="stepper-controls">
        <button
          type="button"
          className="stepper-btn"
          onClick={() => onChange(Math.max(min, value - step))}
        >
          −
        </button>
        <span className="stepper-value">{value}</span>
        <button
          type="button"
          className="stepper-btn"
          onClick={() => onChange(Math.min(max, value + step))}
        >
          +
        </button>
      </div>
    </div>
  );
}
