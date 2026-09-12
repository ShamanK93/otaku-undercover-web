import React from 'react';

export default function PrimaryButton({ title, onClick, disabled, variant = 'primary', style }) {
  const cls = `btn ${variant === 'primary' ? 'btn-primary' : 'btn-secondary'}`;
  return (
    <button className={cls} onClick={onClick} disabled={disabled} style={style} type="button">
      {title}
    </button>
  );
}
