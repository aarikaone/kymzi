import type {PalSummary} from '@rymzi/core';
import {Icon} from './icons';
import './pal-connection-card.css';

type Props = {pal: PalSummary};

export function PalConnectionCard({pal}: Props) {
  const frame = pal.photoUnlocked ? pal.photoFrame : undefined;
  return <section className="pal-connection" aria-label="Your connection progress">
    <div className="connection-overview">
      <div className="connection-progress">
        <div className="connection-count"><strong>{pal.matches}<span>/5</span></strong><small>matches</small></div>
        <div className="connection-pips" role="progressbar" aria-label={`${pal.matches} of 5 matches`} aria-valuemin={0} aria-valuemax={5} aria-valuenow={pal.matches}>
          {[1, 2, 3, 4, 5].map(step => <i key={step} aria-hidden="true" className={step <= pal.matches ? 'filled' : step === 3 ? 'photo-step' : ''}/>)}
        </div>
        <span className={`connection-photo-status ${pal.photoUnlocked ? 'unlocked' : ''}`}><Icon name={pal.photoUnlocked ? 'check' : 'lock'} size={13}/>{pal.photoUnlocked ? 'Photo unlocked' : 'Photo at 3'}</span>
      </div>
      <div className={`connection-photo ${frame ? 'is-revealed' : ''}`}>
        {frame ? <>
          <div className="connection-portrait" role="img" aria-label={`${pal.alias}’s fictional profile photo`} style={{backgroundPosition:`${-frame.column*96-6}px ${-frame.row*96}px`}}/>
          <small title="Fictional photo preview">Preview</small>
        </> : <div className="connection-sealed" role="img" aria-label="Profile photo locked"><Icon name="lock" size={24}/></div>}
      </div>
    </div>

  </section>;
}
