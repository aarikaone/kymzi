import type {ReactNode} from 'react';
import type {PalSummary} from '@rymzi/core';
import './pal-page.css';

type Props={children:ReactNode;pal:PalSummary;onChat:()=>void};

export function PalPage({children,pal,onChat}:Props) {
  return <div className="pal-page">
    <div className="pal-detail">{children}</div>
    <footer className="pal-actions" role="group" aria-label="Roamie actions">
      <button className="pal-action-message" aria-label={`Message ${pal.alias}`} onClick={onChat}>Message</button>
    </footer>
  </div>;
}
