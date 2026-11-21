type Section='places'|'pals';
type Props={value:Section;pals:number|null;fresh:number;onChange:(value:Section)=>void;onPhotos:()=>void};
/** City navigation owns its styling instead of inheriting the legacy social segments. */
export function CitySections({value,pals,fresh,onChange,onPhotos}:Props){
 return <div className="city-section-switcher" role="group" aria-label="City sections">
  <button type="button" className="city-section" aria-pressed={value==='places'} onClick={()=>onChange('places')}>Places</button>
  {pals!==null&&<button type="button" className="city-section" aria-label={`Roamies · ${pals}`} aria-pressed={value==='pals'} onClick={()=>onChange('pals')}><span>Roamies</span><span className="city-section-count" aria-hidden="true">{pals>99?'99+':pals}</span></button>}
  <button type="button" className="city-section photos" aria-label={`Shared places${fresh>0?` · ${fresh} new`:''}`} aria-pressed={false} onClick={onPhotos}><span>Shared</span>{fresh>0&&<span className="city-section-count fresh" aria-hidden="true">{fresh>99?'99+':fresh}</span>}</button>
 </div>;
}
