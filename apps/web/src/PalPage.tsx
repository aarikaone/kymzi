import type {ReactNode} from 'react';
import type {PalSummary} from '@rymzi/core';
import './pal-page.css';

type Props={children:ReactNode;pal:PalSummary;onPlay:()=>void;onChat:()=>void};

export function PalPage({children,pal,onPlay,onChat}:Props) {
  const complete=pal.matches>=5;
  return <div className="pal-page">
    <div className="pal-detail">{children}</div>
    <footer className="pal-actions" role="group" aria-label="Roamie actions">
      <button className="pal-action-play" disabled={complete} aria-label={complete?'Play together · 5 of 5 complete':`Play together · ${pal.matches+1}/5`} onClick={onPlay}>Play together</button>
      <button className="pal-action-message" aria-label={`Message ${pal.alias}`} onClick={onChat}>Message</button>
    </footer>
  </div>;
}
