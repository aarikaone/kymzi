import {gemImpact,type PreviewState} from '@rymzi/core';
import {Icon} from './icons';
import './gem-task.css';
export function GemImpactLink({state,onOpen}:{state:PreviewState;onOpen:()=>void}){const impact=gemImpact(state);return <button className="gem-impact-link" onClick={onOpen}><span className="gem-link-symbol"><Icon name="spark" size={23}/></span><span><strong>My hidden gems</strong><small>{impact.count?`${impact.count} shared · ${impact.saves} ${impact.saves===1?'save':'saves'}`:'Share your side of the city'}</small></span><Icon name="arrow" size={19}/></button>;}
