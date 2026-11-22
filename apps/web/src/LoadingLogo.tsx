import './loading-logo.css';

/** Inline brand artwork is available before the catalogue and CDN settings load. */
export function LoadingLogo({loading=true}:{loading?:boolean}){
 return <span className="kymzi-loading-logo" role={loading?'progressbar':'img'} aria-label={loading?'Loading Kymzi':'Kymzi'}>
  <svg width="96" height="96" viewBox="0 0 96 96" fill="none" aria-hidden="true" focusable="false">
   <path fill="#D5F88F" d="M13 25A15 15 0 0 1 28 10h4a15 15 0 0 1 15 15v13l23-23a13 13 0 0 1 18 18L51 70a17 17 0 0 1-12 5h-9L13 88V25Z"/>
   <path fill="#C8BEFF" d="m54 45 30 26a12 12 0 0 1-8 21H65L51 82H40a15 15 0 0 1-10-26l4-4a15 15 0 0 1 20-7Z"/>
   <g fill="#171624"><circle cx="26" cy="30" r="3.5"/><circle cx="36" cy="30" r="3.5"/><circle cx="54" cy="68" r="3.5"/><circle cx="64" cy="68" r="3.5"/></g>
  </svg>
  {loading&&<span className="kymzi-loading-spinner" aria-hidden="true"/>}
 </span>;
}
