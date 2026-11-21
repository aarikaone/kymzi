import {Icon} from './icons';
import {TravelHero} from './TravelHero';
export function UnknownPalHero(){return <div className="unknown-pal-hero" aria-hidden="true"><div className="unknown-pal-world"><TravelHero/></div><span className="unknown-pal-orbit"/><span className="unknown-roamie-photo photo-one"><Icon name="camera" size={26}/></span><span className="unknown-roamie-photo photo-two"><Icon name="globe" size={25}/></span><span className="unknown-pal-mask">?</span><span className="unknown-pal-spark"><Icon name="spark" size={17}/></span></div>;}
