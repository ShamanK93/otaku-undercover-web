import React from 'react';

// Emplacement publicitaire. En développement, affiche juste un cadre en
// pointillés pour visualiser l'espace réservé. Voir README.md ("Monétisation")
// pour l'intégration réelle de Google AdSense.
export default function AdSlot({ variant = 'rail' }) {
  return (
    <div className={variant === 'banner' ? 'ad-slot ad-slot--banner' : 'ad-slot'}>
      Emplacement publicitaire
      <br />
      ({variant === 'banner' ? '728×90' : '300×250'})
    </div>
  );
}
