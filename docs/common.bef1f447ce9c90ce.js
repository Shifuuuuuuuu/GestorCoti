"use strict";(self.webpackChunkapp=self.webpackChunkapp||[]).push([[2076],{4556:(k,v,r)=>{r.d(v,{c:()=>a});var t=r(4261),d=r(1086),l=r(8607);const a=(o,i)=>{let e,n;const f=(c,E,y)=>{if(typeof document>"u")return;const x=document.elementFromPoint(c,E);x&&i(x)&&!x.disabled?x!==e&&(s(),u(x,y)):s()},u=(c,E)=>{e=c,n||(n=e);const y=e;(0,t.w)(()=>y.classList.add("ion-activated")),E()},s=(c=!1)=>{if(!e)return;const E=e;(0,t.w)(()=>E.classList.remove("ion-activated")),c&&n!==e&&e.click(),e=void 0};return(0,l.createGesture)({el:o,gestureName:"buttonActiveDrag",threshold:0,onStart:c=>f(c.currentX,c.currentY,d.a),onMove:c=>f(c.currentX,c.currentY,d.b),onEnd:()=>{s(!0),(0,d.h)(),n=void 0}})}},8438:(k,v,r)=>{r.d(v,{g:()=>d});var t=r(8476);const d=()=>{if(void 0!==t.w)return t.w.Capacitor}},5572:(k,v,r)=>{r.d(v,{c:()=>t,i:()=>d});const t=(l,a,o)=>"function"==typeof o?o(l,a):"string"==typeof o?l[o]===a[o]:Array.isArray(a)?a.includes(l):l===a,d=(l,a,o)=>void 0!==l&&(Array.isArray(l)?l.some(i=>t(i,a,o)):t(l,a,o))},3351:(k,v,r)=>{r.d(v,{g:()=>t});const t=(i,e,n,f,u)=>l(i[1],e[1],n[1],f[1],u).map(s=>d(i[0],e[0],n[0],f[0],s)),d=(i,e,n,f,u)=>u*(3*e*Math.pow(u-1,2)+u*(-3*n*u+3*n+f*u))-i*Math.pow(u-1,3),l=(i,e,n,f,u)=>o((f-=u)-3*(n-=u)+3*(e-=u)-(i-=u),3*n-6*e+3*i,3*e-3*i,i).filter(c=>c>=0&&c<=1),o=(i,e,n,f)=>{if(0===i)return((i,e,n)=>{const f=e*e-4*i*n;return f<0?[]:[(-e+Math.sqrt(f))/(2*i),(-e-Math.sqrt(f))/(2*i)]})(e,n,f);const u=(3*(n/=i)-(e/=i)*e)/3,s=(2*e*e*e-9*e*n+27*(f/=i))/27;if(0===u)return[Math.pow(-s,1/3)];if(0===s)return[Math.sqrt(-u),-Math.sqrt(-u)];const c=Math.pow(s/2,2)+Math.pow(u/3,3);if(0===c)return[Math.pow(s/2,.5)-e/3];if(c>0)return[Math.pow(-s/2+Math.sqrt(c),1/3)-Math.pow(s/2+Math.sqrt(c),1/3)-e/3];const E=Math.sqrt(Math.pow(-u/3,3)),y=Math.acos(-s/(2*Math.sqrt(Math.pow(-u/3,3)))),x=2*Math.pow(E,1/3);return[x*Math.cos(y/3)-e/3,x*Math.cos((y+2*Math.PI)/3)-e/3,x*Math.cos((y+4*Math.PI)/3)-e/3]}},5083:(k,v,r)=>{r.d(v,{i:()=>t});const t=d=>d&&""!==d.dir?"rtl"===d.dir.toLowerCase():"rtl"===(null==document?void 0:document.dir.toLowerCase())},3126:(k,v,r)=>{r.r(v),r.d(v,{startFocusVisible:()=>a});const t="ion-focused",l=["Tab","ArrowDown","Space","Escape"," ","Shift","Enter","ArrowLeft","ArrowRight","ArrowUp","Home","End"],a=o=>{let i=[],e=!0;const n=o?o.shadowRoot:document,f=o||document.body,u=b=>{i.forEach(g=>g.classList.remove(t)),b.forEach(g=>g.classList.add(t)),i=b},s=()=>{e=!1,u([])},c=b=>{e=l.includes(b.key),e||u([])},E=b=>{if(e&&void 0!==b.composedPath){const g=b.composedPath().filter(p=>!!p.classList&&p.classList.contains("ion-focusable"));u(g)}},y=()=>{n.activeElement===f&&u([])};return n.addEventListener("keydown",c),n.addEventListener("focusin",E),n.addEventListener("focusout",y),n.addEventListener("touchstart",s,{passive:!0}),n.addEventListener("mousedown",s),{destroy:()=>{n.removeEventListener("keydown",c),n.removeEventListener("focusin",E),n.removeEventListener("focusout",y),n.removeEventListener("touchstart",s),n.removeEventListener("mousedown",s)},setFocus:u}}},1086:(k,v,r)=>{r.d(v,{I:()=>d,a:()=>e,b:()=>n,c:()=>i,d:()=>u,h:()=>f});var t=r(8438),d=function(s){return s.Heavy="HEAVY",s.Medium="MEDIUM",s.Light="LIGHT",s}(d||{});const a={getEngine(){const s=(0,t.g)();if(null!=s&&s.isPluginAvailable("Haptics"))return s.Plugins.Haptics},available(){if(!this.getEngine())return!1;const c=(0,t.g)();return"web"!==(null==c?void 0:c.getPlatform())||typeof navigator<"u"&&void 0!==navigator.vibrate},impact(s){const c=this.getEngine();c&&c.impact({style:s.style})},notification(s){const c=this.getEngine();c&&c.notification({type:s.type})},selection(){this.impact({style:d.Light})},selectionStart(){const s=this.getEngine();s&&s.selectionStart()},selectionChanged(){const s=this.getEngine();s&&s.selectionChanged()},selectionEnd(){const s=this.getEngine();s&&s.selectionEnd()}},o=()=>a.available(),i=()=>{o()&&a.selection()},e=()=>{o()&&a.selectionStart()},n=()=>{o()&&a.selectionChanged()},f=()=>{o()&&a.selectionEnd()},u=s=>{o()&&a.impact(s)}},909:(k,v,r)=>{r.d(v,{I:()=>i,a:()=>u,b:()=>o,c:()=>E,d:()=>x,f:()=>s,g:()=>f,i:()=>n,p:()=>y,r:()=>b,s:()=>c});var t=r(467),d=r(4920),l=r(4929);const o="ion-content",i=".ion-content-scroll-host",e=`${o}, ${i}`,n=g=>"ION-CONTENT"===g.tagName,f=function(){var g=(0,t.A)(function*(p){return n(p)?(yield new Promise(M=>(0,d.c)(p,M)),p.getScrollElement()):p});return function(M){return g.apply(this,arguments)}}(),u=g=>g.querySelector(i)||g.querySelector(e),s=g=>g.closest(e),c=(g,p)=>n(g)?g.scrollToTop(p):Promise.resolve(g.scrollTo({top:0,left:0,behavior:p>0?"smooth":"auto"})),E=(g,p,M,D)=>n(g)?g.scrollByPoint(p,M,D):Promise.resolve(g.scrollBy({top:M,left:p,behavior:D>0?"smooth":"auto"})),y=g=>(0,l.b)(g,o),x=g=>{if(n(g)){const M=g.scrollY;return g.scrollY=!1,M}return g.style.setProperty("overflow","hidden"),!0},b=(g,p)=>{n(g)?g.scrollY=p:g.style.removeProperty("overflow")}},3992:(k,v,r)=>{r.d(v,{a:()=>t,b:()=>E,c:()=>e,d:()=>y,e:()=>O,f:()=>i,g:()=>x,h:()=>l,i:()=>d,j:()=>_,k:()=>I,l:()=>n,m:()=>s,n:()=>b,o:()=>u,p:()=>o,q:()=>a,r:()=>j,s:()=>m,t:()=>c,u:()=>M,v:()=>D,w:()=>f,x:()=>g,y:()=>p});const t="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' class='ionicon' viewBox='0 0 512 512'><path stroke-linecap='square' stroke-miterlimit='10' stroke-width='48' d='M244 400L100 256l144-144M120 256h292' class='ionicon-fill-none'/></svg>",d="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' class='ionicon' viewBox='0 0 512 512'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='48' d='M112 268l144 144 144-144M256 392V100' class='ionicon-fill-none'/></svg>",l="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' class='ionicon' viewBox='0 0 512 512'><path d='M368 64L144 256l224 192V64z'/></svg>",a="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' class='ionicon' viewBox='0 0 512 512'><path d='M64 144l192 224 192-224H64z'/></svg>",o="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' class='ionicon' viewBox='0 0 512 512'><path d='M448 368L256 144 64 368h384z'/></svg>",i="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' class='ionicon' viewBox='0 0 512 512'><path stroke-linecap='round' stroke-linejoin='round' d='M416 128L192 384l-96-96' class='ionicon-fill-none ionicon-stroke-width'/></svg>",e="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' class='ionicon' viewBox='0 0 512 512'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='48' d='M328 112L184 256l144 144' class='ionicon-fill-none'/></svg>",n="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' class='ionicon' viewBox='0 0 512 512'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='48' d='M112 184l144 144 144-144' class='ionicon-fill-none'/></svg>",f="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' class='ionicon' viewBox='0 0 512 512'><path d='M136 208l120-104 120 104M136 304l120 104 120-104' stroke-width='48' stroke-linecap='round' stroke-linejoin='round' class='ionicon-fill-none'/></svg>",u="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' class='ionicon' viewBox='0 0 512 512'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='48' d='M184 112l144 144-144 144' class='ionicon-fill-none'/></svg>",s="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' class='ionicon' viewBox='0 0 512 512'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='48' d='M184 112l144 144-144 144' class='ionicon-fill-none'/></svg>",c="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' class='ionicon' viewBox='0 0 512 512'><path d='M289.94 256l95-95A24 24 0 00351 127l-95 95-95-95a24 24 0 00-34 34l95 95-95 95a24 24 0 1034 34l95-95 95 95a24 24 0 0034-34z'/></svg>",E="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' class='ionicon' viewBox='0 0 512 512'><path d='M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208 208-93.31 208-208S370.69 48 256 48zm75.31 260.69a16 16 0 11-22.62 22.62L256 278.63l-52.69 52.68a16 16 0 01-22.62-22.62L233.37 256l-52.68-52.69a16 16 0 0122.62-22.62L256 233.37l52.69-52.68a16 16 0 0122.62 22.62L278.63 256z'/></svg>",y="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' class='ionicon' viewBox='0 0 512 512'><path d='M400 145.49L366.51 112 256 222.51 145.49 112 112 145.49 222.51 256 112 366.51 145.49 400 256 289.49 366.51 400 400 366.51 289.49 256 400 145.49z'/></svg>",x="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' class='ionicon' viewBox='0 0 512 512'><circle cx='256' cy='256' r='192' stroke-linecap='round' stroke-linejoin='round' class='ionicon-fill-none ionicon-stroke-width'/></svg>",b="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' class='ionicon' viewBox='0 0 512 512'><circle cx='256' cy='256' r='48'/><circle cx='416' cy='256' r='48'/><circle cx='96' cy='256' r='48'/></svg>",g="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' class='ionicon' viewBox='0 0 512 512'><circle cx='256' cy='256' r='64'/><path d='M490.84 238.6c-26.46-40.92-60.79-75.68-99.27-100.53C349 110.55 302 96 255.66 96c-42.52 0-84.33 12.15-124.27 36.11-40.73 24.43-77.63 60.12-109.68 106.07a31.92 31.92 0 00-.64 35.54c26.41 41.33 60.4 76.14 98.28 100.65C162 402 207.9 416 255.66 416c46.71 0 93.81-14.43 136.2-41.72 38.46-24.77 72.72-59.66 99.08-100.92a32.2 32.2 0 00-.1-34.76zM256 352a96 96 0 1196-96 96.11 96.11 0 01-96 96z'/></svg>",p="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' class='ionicon' viewBox='0 0 512 512'><path d='M432 448a15.92 15.92 0 01-11.31-4.69l-352-352a16 16 0 0122.62-22.62l352 352A16 16 0 01432 448zM248 315.85l-51.79-51.79a2 2 0 00-3.39 1.69 64.11 64.11 0 0053.49 53.49 2 2 0 001.69-3.39zM264 196.15L315.87 248a2 2 0 003.4-1.69 64.13 64.13 0 00-53.55-53.55 2 2 0 00-1.72 3.39z'/><path d='M491 273.36a32.2 32.2 0 00-.1-34.76c-26.46-40.92-60.79-75.68-99.27-100.53C349 110.55 302 96 255.68 96a226.54 226.54 0 00-71.82 11.79 4 4 0 00-1.56 6.63l47.24 47.24a4 4 0 003.82 1.05 96 96 0 01116 116 4 4 0 001.05 3.81l67.95 68a4 4 0 005.4.24 343.81 343.81 0 0067.24-77.4zM256 352a96 96 0 01-93.3-118.63 4 4 0 00-1.05-3.81l-66.84-66.87a4 4 0 00-5.41-.23c-24.39 20.81-47 46.13-67.67 75.72a31.92 31.92 0 00-.64 35.54c26.41 41.33 60.39 76.14 98.28 100.65C162.06 402 207.92 416 255.68 416a238.22 238.22 0 0072.64-11.55 4 4 0 001.61-6.64l-47.47-47.46a4 4 0 00-3.81-1.05A96 96 0 01256 352z'/></svg>",M="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' class='ionicon' viewBox='0 0 512 512'><path stroke-linecap='round' stroke-miterlimit='10' d='M80 160h352M80 256h352M80 352h352' class='ionicon-fill-none ionicon-stroke-width'/></svg>",D="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' class='ionicon' viewBox='0 0 512 512'><path d='M64 384h384v-42.67H64zm0-106.67h384v-42.66H64zM64 128v42.67h384V128z'/></svg>",j="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' class='ionicon' viewBox='0 0 512 512'><path stroke-linecap='round' stroke-linejoin='round' d='M400 256H112' class='ionicon-fill-none ionicon-stroke-width'/></svg>",_="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' class='ionicon' viewBox='0 0 512 512'><path stroke-linecap='round' stroke-linejoin='round' d='M96 256h320M96 176h320M96 336h320' class='ionicon-fill-none ionicon-stroke-width'/></svg>",I="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' class='ionicon' viewBox='0 0 512 512'><path stroke-linecap='square' stroke-linejoin='round' stroke-width='44' d='M118 304h276M118 208h276' class='ionicon-fill-none'/></svg>",m="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' class='ionicon' viewBox='0 0 512 512'><path d='M221.09 64a157.09 157.09 0 10157.09 157.09A157.1 157.1 0 00221.09 64z' stroke-miterlimit='10' class='ionicon-fill-none ionicon-stroke-width'/><path stroke-linecap='round' stroke-miterlimit='10' d='M338.29 338.29L448 448' class='ionicon-fill-none ionicon-stroke-width'/></svg>",O="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' class='ionicon' viewBox='0 0 512 512'><path d='M464 428L339.92 303.9a160.48 160.48 0 0030.72-94.58C370.64 120.37 298.27 48 209.32 48S48 120.37 48 209.32s72.37 161.32 161.32 161.32a160.48 160.48 0 0094.58-30.72L428 464zM209.32 319.69a110.38 110.38 0 11110.37-110.37 110.5 110.5 0 01-110.37 110.37z'/></svg>"},243:(k,v,r)=>{r.d(v,{c:()=>a,g:()=>o});var t=r(8476),d=r(4920),l=r(4929);const a=(e,n,f)=>{let u,s;if(void 0!==t.w&&"MutationObserver"in t.w){const x=Array.isArray(n)?n:[n];u=new MutationObserver(b=>{for(const g of b)for(const p of g.addedNodes)if(p.nodeType===Node.ELEMENT_NODE&&x.includes(p.slot))return f(),void(0,d.r)(()=>c(p))}),u.observe(e,{childList:!0,subtree:!0})}const c=x=>{var b;s&&(s.disconnect(),s=void 0),s=new MutationObserver(g=>{f();for(const p of g)for(const M of p.removedNodes)M.nodeType===Node.ELEMENT_NODE&&M.slot===n&&y()}),s.observe(null!==(b=x.parentElement)&&void 0!==b?b:x,{subtree:!0,childList:!0})},y=()=>{s&&(s.disconnect(),s=void 0)};return{destroy:()=>{u&&(u.disconnect(),u=void 0),y()}}},o=(e,n,f)=>{const u=null==e?0:e.toString().length,s=i(u,n);if(void 0===f)return s;try{return f(u,n)}catch(c){return(0,l.a)("Exception in provided `counterFormatter`.",c),s}},i=(e,n)=>`${e} / ${n}`},1622:(k,v,r)=>{r.r(v),r.d(v,{KEYBOARD_DID_CLOSE:()=>o,KEYBOARD_DID_OPEN:()=>a,copyVisualViewport:()=>j,keyboardDidClose:()=>g,keyboardDidOpen:()=>x,keyboardDidResize:()=>b,resetKeyboardAssist:()=>u,setKeyboardClose:()=>y,setKeyboardOpen:()=>E,startKeyboardAssist:()=>s,trackViewportChanges:()=>D});var t=r(4379);r(8438),r(8476);const a="ionKeyboardDidShow",o="ionKeyboardDidHide";let e={},n={},f=!1;const u=()=>{e={},n={},f=!1},s=_=>{if(t.K.getEngine())c(_);else{if(!_.visualViewport)return;n=j(_.visualViewport),_.visualViewport.onresize=()=>{D(_),x()||b(_)?E(_):g(_)&&y(_)}}},c=_=>{_.addEventListener("keyboardDidShow",I=>E(_,I)),_.addEventListener("keyboardDidHide",()=>y(_))},E=(_,I)=>{p(_,I),f=!0},y=_=>{M(_),f=!1},x=()=>!f&&e.width===n.width&&(e.height-n.height)*n.scale>150,b=_=>f&&!g(_),g=_=>f&&n.height===_.innerHeight,p=(_,I)=>{const O=new CustomEvent(a,{detail:{keyboardHeight:I?I.keyboardHeight:_.innerHeight-n.height}});_.dispatchEvent(O)},M=_=>{const I=new CustomEvent(o);_.dispatchEvent(I)},D=_=>{e=Object.assign({},n),n=j(_.visualViewport)},j=_=>({width:Math.round(_.width),height:Math.round(_.height),offsetTop:_.offsetTop,offsetLeft:_.offsetLeft,pageTop:_.pageTop,pageLeft:_.pageLeft,scale:_.scale})},4379:(k,v,r)=>{r.d(v,{K:()=>a,a:()=>l});var t=r(8438),d=function(o){return o.Unimplemented="UNIMPLEMENTED",o.Unavailable="UNAVAILABLE",o}(d||{}),l=function(o){return o.Body="body",o.Ionic="ionic",o.Native="native",o.None="none",o}(l||{});const a={getEngine(){const o=(0,t.g)();if(null!=o&&o.isPluginAvailable("Keyboard"))return o.Plugins.Keyboard},getResizeMode(){const o=this.getEngine();return null!=o&&o.getResizeMode?o.getResizeMode().catch(i=>{if(i.code!==d.Unimplemented)throw i}):Promise.resolve(void 0)}}},4731:(k,v,r)=>{r.d(v,{c:()=>i});var t=r(467),d=r(8476),l=r(4379);const a=e=>{if(void 0===d.d||e===l.a.None||void 0===e)return null;const n=d.d.querySelector("ion-app");return null!=n?n:d.d.body},o=e=>{const n=a(e);return null===n?0:n.clientHeight},i=function(){var e=(0,t.A)(function*(n){let f,u,s,c;const E=function(){var p=(0,t.A)(function*(){const M=yield l.K.getResizeMode(),D=void 0===M?void 0:M.mode;f=()=>{void 0===c&&(c=o(D)),s=!0,y(s,D)},u=()=>{s=!1,y(s,D)},null==d.w||d.w.addEventListener("keyboardWillShow",f),null==d.w||d.w.addEventListener("keyboardWillHide",u)});return function(){return p.apply(this,arguments)}}(),y=(p,M)=>{n&&n(p,x(M))},x=p=>{if(0===c||c===o(p))return;const M=a(p);return null!==M?new Promise(D=>{const _=new ResizeObserver(()=>{M.clientHeight===c&&(_.disconnect(),D())});_.observe(M)}):void 0};return yield E(),{init:E,destroy:()=>{null==d.w||d.w.removeEventListener("keyboardWillShow",f),null==d.w||d.w.removeEventListener("keyboardWillHide",u),f=u=void 0},isKeyboardVisible:()=>s}});return function(f){return e.apply(this,arguments)}}()},7838:(k,v,r)=>{r.d(v,{c:()=>d});var t=r(467);const d=()=>{let l;return{lock:function(){var o=(0,t.A)(function*(){const i=l;let e;return l=new Promise(n=>e=n),void 0!==i&&(yield i),e});return function(){return o.apply(this,arguments)}}()}}},9001:(k,v,r)=>{r.d(v,{c:()=>l});var t=r(8476),d=r(4920);const l=(a,o,i)=>{let e;const n=()=>!(void 0===o()||void 0!==a.label||null===i()),u=()=>{const c=o();if(void 0===c)return;if(!n())return void c.style.removeProperty("width");const E=i().scrollWidth;if(0===E&&null===c.offsetParent&&void 0!==t.w&&"IntersectionObserver"in t.w){if(void 0!==e)return;const y=e=new IntersectionObserver(x=>{1===x[0].intersectionRatio&&(u(),y.disconnect(),e=void 0)},{threshold:.01,root:a});y.observe(c)}else c.style.setProperty("width",.75*E+"px")};return{calculateNotchWidth:()=>{n()&&(0,d.r)(()=>{u()})},destroy:()=>{e&&(e.disconnect(),e=void 0)}}}},7895:(k,v,r)=>{r.d(v,{S:()=>d});const d={bubbles:{dur:1e3,circles:9,fn:(l,a,o)=>{const i=l*a/o-l+"ms",e=2*Math.PI*a/o;return{r:5,style:{top:32*Math.sin(e)+"%",left:32*Math.cos(e)+"%","animation-delay":i}}}},circles:{dur:1e3,circles:8,fn:(l,a,o)=>{const i=a/o,e=l*i-l+"ms",n=2*Math.PI*i;return{r:5,style:{top:32*Math.sin(n)+"%",left:32*Math.cos(n)+"%","animation-delay":e}}}},circular:{dur:1400,elmDuration:!0,circles:1,fn:()=>({r:20,cx:48,cy:48,fill:"none",viewBox:"24 24 48 48",transform:"translate(0,0)",style:{}})},crescent:{dur:750,circles:1,fn:()=>({r:26,style:{}})},dots:{dur:750,circles:3,fn:(l,a)=>({r:6,style:{left:32-32*a+"%","animation-delay":-110*a+"ms"}})},lines:{dur:1e3,lines:8,fn:(l,a,o)=>({y1:14,y2:26,style:{transform:`rotate(${360/o*a+(a<o/2?180:-180)}deg)`,"animation-delay":l*a/o-l+"ms"}})},"lines-small":{dur:1e3,lines:8,fn:(l,a,o)=>({y1:12,y2:20,style:{transform:`rotate(${360/o*a+(a<o/2?180:-180)}deg)`,"animation-delay":l*a/o-l+"ms"}})},"lines-sharp":{dur:1e3,lines:12,fn:(l,a,o)=>({y1:17,y2:29,style:{transform:`rotate(${30*a+(a<6?180:-180)}deg)`,"animation-delay":l*a/o-l+"ms"}})},"lines-sharp-small":{dur:1e3,lines:12,fn:(l,a,o)=>({y1:12,y2:20,style:{transform:`rotate(${30*a+(a<6?180:-180)}deg)`,"animation-delay":l*a/o-l+"ms"}})}}},7166:(k,v,r)=>{r.r(v),r.d(v,{createSwipeBackGesture:()=>o});var t=r(4920),d=r(5083),l=r(8607);r(1970);const o=(i,e,n,f,u)=>{const s=i.ownerDocument.defaultView;let c=(0,d.i)(i);const y=M=>c?-M.deltaX:M.deltaX;return(0,l.createGesture)({el:i,gestureName:"goback-swipe",gesturePriority:101,threshold:10,canStart:M=>(c=(0,d.i)(i),(M=>{const{startX:j}=M;return c?j>=s.innerWidth-50:j<=50})(M)&&e()),onStart:n,onMove:M=>{const j=y(M)/s.innerWidth;f(j)},onEnd:M=>{const D=y(M),j=s.innerWidth,_=D/j,I=(M=>c?-M.velocityX:M.velocityX)(M),O=I>=0&&(I>.2||D>j/2),h=(O?1-_:_)*j;let C=0;if(h>5){const P=h/Math.abs(I);C=Math.min(P,540)}u(O,_<=0?.01:(0,t.j)(0,_,.9999),C)}})}},2935:(k,v,r)=>{r.d(v,{w:()=>t});const t=(a,o,i)=>{if(typeof MutationObserver>"u")return;const e=new MutationObserver(n=>{i(d(n,o))});return e.observe(a,{childList:!0,subtree:!0}),e},d=(a,o)=>{let i;return a.forEach(e=>{for(let n=0;n<e.addedNodes.length;n++)i=l(e.addedNodes[n],o)||i}),i},l=(a,o)=>{if(1!==a.nodeType)return;const i=a;return(i.tagName===o.toUpperCase()?[i]:Array.from(i.querySelectorAll(o))).find(n=>n.value===i.value)}},5039:(k,v,r)=>{r.d(v,{d:()=>I});var t=r(4438),d=r(4796),l=r(8079);let a=(()=>{var m;class O{constructor(h){this.firestore=h}getChatId(h,C){return[h,C].sort().join("_")}obtenerMensajes(h,C){const P=this.getChatId(h,C);return this.firestore.collection(`chats/${P}/messages`,T=>T.orderBy("timestamp","asc")).snapshotChanges()}enviarMensaje(h,C,P){const T=this.getChatId(h,C),L={remitenteId:h,receptorId:C,mensaje:P,timestamp:new Date};return this.firestore.collection(`chats/${T}/messages`).add(L)}marcarMensajeVisto(h){return this.firestore.collection("chats").doc(h).set({visto:!0},{merge:!0})}}return(m=O).\u0275fac=function(h){return new(h||m)(t.KVO(l.Qe))},m.\u0275prov=t.jDH({token:m,factory:m.\u0275fac,providedIn:"root"}),O})();var o=r(2872),i=r(4742),e=r(177),n=r(4341);const f=(m,O)=>({"mensaje-propio":m,"mensaje-ajeno":O});function u(m,O){if(1&m){const w=t.RV6();t.j41(0,"ion-title")(1,"ion-row",4)(2,"ion-col",5)(3,"ion-button",6),t.bIt("click",function(){t.eBV(w);const C=t.XpG();return t.Njj(C.cerrarMod())}),t.nrm(4,"ion-icon",7),t.k0s()(),t.j41(5,"ion-col"),t.EFF(6," chats "),t.k0s()()()}}function s(m,O){if(1&m){const w=t.RV6();t.j41(0,"ion-title")(1,"ion-row",8)(2,"ion-col",5)(3,"ion-button",9),t.bIt("click",function(){t.eBV(w);const C=t.XpG();return t.Njj(C.cerrarChat())}),t.nrm(4,"ion-icon",10),t.k0s()(),t.j41(5,"ion-col"),t.EFF(6),t.k0s()()()}if(2&m){const w=t.XpG();t.R7$(6),t.SpI(" ",w.obtenerNombreReceptor()," ")}}function c(m,O){if(1&m&&(t.j41(0,"ion-avatar"),t.nrm(1,"img",17),t.k0s()),2&m){const w=t.XpG().$implicit;t.R7$(),t.Y8G("src",w.photoURL,t.B4B)}}function E(m,O){1&m&&t.nrm(0,"ion-icon",18)}function y(m,O){if(1&m){const w=t.RV6();t.j41(0,"div",13),t.bIt("click",function(){const C=t.eBV(w).$implicit,P=t.XpG(2);return t.Njj(P.seleccionarUsuario(C))}),t.DNE(1,c,2,1,"ion-avatar",14)(2,E,1,0,"ng-template",null,0,t.C5r),t.j41(4,"div",15)(5,"p",16),t.EFF(6),t.k0s()()()}if(2&m){const w=O.$implicit,h=t.sdS(3);t.R7$(),t.Y8G("ngIf",w.photoURL)("ngIfElse",h),t.R7$(5),t.JRh(w.displayName||w.email)}}function x(m,O){if(1&m&&(t.j41(0,"div",11),t.DNE(1,y,7,3,"div",12),t.k0s()),2&m){const w=t.XpG();t.R7$(),t.Y8G("ngForOf",w.usuarios)}}function b(m,O){1&m&&t.nrm(0,"ion-icon",25)}function g(m,O){1&m&&t.nrm(0,"ion-icon",26)}function p(m,O){1&m&&t.nrm(0,"ion-icon",26)}function M(m,O){if(1&m&&(t.j41(0,"div",22)(1,"p")(2,"strong"),t.EFF(3),t.k0s(),t.EFF(4),t.k0s(),t.j41(5,"small"),t.EFF(6),t.nI1(7,"date"),t.k0s(),t.DNE(8,b,1,0,"ion-icon",23)(9,g,1,0,"ion-icon",24)(10,p,1,0,"ion-icon",24),t.k0s()),2&m){const w=O.$implicit,h=t.XpG(2);t.Y8G("ngClass",t.l_i(10,f,w.remitenteId===(null==h.remitente?null:h.remitente.uid),w.remitenteId!==(null==h.remitente?null:h.remitente.uid))),t.R7$(3),t.JRh(w.nombreRemitente),t.R7$(),t.SpI(": ",w.mensaje,""),t.R7$(2),t.JRh(t.i5U(7,7,w.timestamp,"short")),t.R7$(2),t.Y8G("ngIf",!w.visto),t.R7$(),t.Y8G("ngIf",w.visto),t.R7$(),t.Y8G("ngIf",w.visto&&w.vistoPorAmbos)}}function D(m,O){1&m&&(t.j41(0,"div",27),t.EFF(1," Escribiendo... "),t.k0s())}function j(m,O){if(1&m&&(t.j41(0,"div",19),t.DNE(1,M,11,13,"div",20)(2,D,2,0,"div",21),t.k0s()),2&m){const w=t.XpG();t.R7$(),t.Y8G("ngForOf",w.mensajes),t.R7$(),t.Y8G("ngIf",w.escribiendo)}}function _(m,O){if(1&m){const w=t.RV6();t.j41(0,"ion-footer")(1,"ion-toolbar")(2,"ion-row",28)(3,"ion-col",29)(4,"ion-input",30),t.mxI("ngModelChange",function(C){t.eBV(w);const P=t.XpG();return t.DH7(P.mensaje,C)||(P.mensaje=C),t.Njj(C)}),t.bIt("input",function(){t.eBV(w);const C=t.XpG();return t.Njj(C.onInput())}),t.k0s()(),t.j41(5,"ion-col",31)(6,"ion-button",32),t.bIt("click",function(){t.eBV(w);const C=t.XpG();return t.Njj(C.enviarMensaje())}),t.nrm(7,"ion-icon",33),t.k0s()()()()()}if(2&m){const w=t.XpG();t.R7$(4),t.R50("ngModel",w.mensaje),t.R7$(2),t.Y8G("disabled",!w.mensaje.trim())}}let I=(()=>{var m;class O{constructor(h,C,P,T){this.authService=h,this.chatService=C,this.navController=P,this.modalController=T,this.usuarios=[],this.chatActivo=!1,this.escribiendo=!1,this.receptorId="",this.mensajes=[],this.mensaje="",this.remitente=null}ngOnInit(){const h=localStorage.getItem("userId");h?this.obtenerUsuarios(h):console.log("Usuario no autenticado"),this.cargarMensajes()}onInput(){this.escribiendo=!0,clearTimeout(this.escribiendoTimeout),this.escribiendoTimeout=setTimeout(()=>{this.escribiendo=!1},3e3)}cerrarChat(){this.chatActivo=!1,this.mensajes=[],this.navController.pop()}cerrarMod(){this.modalController.dismiss()}enviarMensaje(){!this.remitente||!this.receptorId||this.mensaje.trim()&&this.chatService.enviarMensaje(this.remitente.uid,this.receptorId,this.mensaje).then(()=>{const h={remitenteId:this.remitente.uid,receptorId:this.receptorId,mensaje:this.mensaje.replace(/:/g,""),nombreRemitente:this.remitente.displayName||this.remitente.email,timestamp:new Date,visto:!1};this.mensajes.push(h),this.mensaje=""}).catch(h=>{console.error("Error al enviar el mensaje:",h)})}cargarMensajes(){this.remitente&&this.chatService.obtenerMensajes(this.remitente.uid,this.receptorId).subscribe(h=>{const C=h.map(P=>{var T;const L=P.payload.doc.data();return L.timestamp&&L.timestamp.seconds&&(L.timestamp=new Date(1e3*L.timestamp.seconds)),L.mensaje=L.mensaje.replace(/:/g,""),L.receptorId===(null===(T=this.remitente)||void 0===T?void 0:T.uid)&&!L.visto&&(this.chatService.marcarMensajeVisto(P.payload.doc.id),L.visto=!0),L});this.mensajes=C})}obtenerNombreRemitente(h){var C;const P=this.usuarios.find(T=>T.uid===h);return null!==(C=null==P?void 0:P.displayName)&&void 0!==C?C:"Desconocido"}obtenerNombreReceptor(){const h=this.usuarios.find(C=>C.uid===this.receptorId);return h?h.displayName||h.email:"Desconocido"}obtenerUsuarios(h){this.authService.obtenerUsuarios().subscribe(C=>{this.usuarios=C;const P=this.usuarios.find(T=>T.uid===h);P?(this.remitente=P,this.cargarMensajes()):console.log("Usuario autenticado no encontrado en la lista")})}seleccionarUsuario(h){this.receptorId=h.uid,this.chatActivo=!0,this.cargarMensajes(),console.log("Receptor seleccionado:",this.receptorId)}volverALista(){this.chatActivo=!1,this.receptorId="",this.mensajes=[]}}return(m=O).\u0275fac=function(h){return new(h||m)(t.rXU(d.u),t.rXU(a),t.rXU(o.q9),t.rXU(i.W3))},m.\u0275cmp=t.VBU({type:m,selectors:[["app-chat-modal"]],decls:8,vars:5,consts:[["noAvatar",""],[4,"ngIf"],["class","usuarios-container",4,"ngIf"],["class","chat-container",4,"ngIf"],[1,"title"],["size","auto"],["fill","clear",1,"cerrar-btn",3,"click"],["name","close-outline"],[1,"chats"],["fill","clear",3,"click"],["name","arrow-back-outline"],[1,"usuarios-container"],["class","usuario",3,"click",4,"ngFor","ngForOf"],[1,"usuario",3,"click"],[4,"ngIf","ngIfElse"],[1,"usuario-info"],[1,"nombre"],["alt","Avatar",3,"src"],["name","person-circle","size","large"],[1,"chat-container"],[3,"ngClass",4,"ngFor","ngForOf"],["class","escribiendo",4,"ngIf"],[3,"ngClass"],["name","checkmark","color","medium",4,"ngIf"],["name","checkmark-done","color","success",4,"ngIf"],["name","checkmark","color","medium"],["name","checkmark-done","color","success"],[1,"escribiendo"],[1,"paper"],["size","11"],["placeholder","Escribe un mensaje...",3,"ngModelChange","input","ngModel"],["size","1"],[3,"click","disabled"],["name","paper-plane-outline"]],template:function(h,C){1&h&&(t.j41(0,"ion-header")(1,"ion-toolbar"),t.DNE(2,u,7,0,"ion-title",1)(3,s,7,1,"ion-title",1),t.k0s()(),t.j41(4,"ion-content"),t.DNE(5,x,2,1,"div",2)(6,j,3,2,"div",3),t.k0s(),t.DNE(7,_,8,2,"ion-footer",1)),2&h&&(t.R7$(2),t.Y8G("ngIf",!C.chatActivo),t.R7$(),t.Y8G("ngIf",C.chatActivo),t.R7$(2),t.Y8G("ngIf",!C.chatActivo),t.R7$(),t.Y8G("ngIf",C.chatActivo),t.R7$(),t.Y8G("ngIf",C.chatActivo))},dependencies:[e.YU,e.Sq,e.bT,i.mC,i.Jm,i.hU,i.W9,i.M0,i.eU,i.iq,i.$w,i.ln,i.BC,i.ai,i.Gw,n.BC,n.vS,e.vh],styles:[".usuarios-container[_ngcontent-%COMP%]{display:flex;flex-direction:column;padding:10px;gap:15px;border-radius:10px}.usuario[_ngcontent-%COMP%]{display:flex;align-items:center;padding:12px;cursor:pointer;background-color:#333;border-radius:8px;box-shadow:0 2px 5px #5552521a;transition:transform .2s ease,background-color .2s ease}.usuario[_ngcontent-%COMP%]:hover{background-color:#888;transform:scale(1.02)}.usuario[_ngcontent-%COMP%]   ion-avatar[_ngcontent-%COMP%], .usuario[_ngcontent-%COMP%]   ion-icon[_ngcontent-%COMP%]{width:45px;height:45px;border-radius:50%;margin-right:15px}.usuario-info[_ngcontent-%COMP%]{display:flex;flex-direction:column;color:#fff}.nombre[_ngcontent-%COMP%]{font-size:14px;font-weight:700;margin:0}.email[_ngcontent-%COMP%]{font-size:12px;color:#ccc;margin:0}.chat-container[_ngcontent-%COMP%]{display:flex;flex-direction:column;padding:15px;background-color:#333;box-shadow:0 2px 5px #0000001a}.mensaje-propio[_ngcontent-%COMP%], .mensaje-ajeno[_ngcontent-%COMP%]{border-radius:20px;padding:12px;margin:10px 0;max-width:70%;font-size:14px;line-height:1.4;box-shadow:0 2px 5px #0000001a;display:inline-block;word-wrap:break-word}.mensaje-propio[_ngcontent-%COMP%]{background-color:#d4f7d4;text-align:right;color:#333;align-self:flex-end;margin-left:auto}.mensaje-ajeno[_ngcontent-%COMP%]{background-color:#f1f1f1;text-align:left;color:#333;align-self:flex-start;margin-right:auto}.cerrar-btn[_ngcontent-%COMP%]{margin-left:auto;padding:0;font-size:24px}ion-icon[name=checkmark][_ngcontent-%COMP%], ion-icon[name=checkmark-done][_ngcontent-%COMP%]{font-size:18px;margin-left:8px}ion-icon[color=success][_ngcontent-%COMP%]{color:#28a745!important}ion-icon[color=dark][_ngcontent-%COMP%]{color:#888!important}ion-footer[_ngcontent-%COMP%]{display:flex;padding:10px;width:100%;box-shadow:0 -2px 5px #0000001a}.title[_ngcontent-%COMP%]{display:flex;align-items:center;width:50%}.chats[_ngcontent-%COMP%]{display:flex;align-items:center;width:70%}.paper[_ngcontent-%COMP%]{display:flex;align-items:center;width:100%}ion-col[_ngcontent-%COMP%]:first-child{flex:1;padding-right:10px}ion-input[_ngcontent-%COMP%]{border-radius:25px;padding-left:15px;font-size:14px}ion-input[_ngcontent-%COMP%]:focus{border-color:#007bff}ion-col[_ngcontent-%COMP%]:last-child{display:flex;justify-content:flex-end}ion-title[_ngcontent-%COMP%]   ion-row[_ngcontent-%COMP%]{display:flex}ion-title[_ngcontent-%COMP%]   ion-col[_ngcontent-%COMP%]{display:flex;align-items:center;justify-content:center}ion-title[_ngcontent-%COMP%]   ion-col[_ngcontent-%COMP%]:first-child{padding-right:10px}ion-button[_ngcontent-%COMP%]{color:#fff!important}ion-icon[_ngcontent-%COMP%]{font-size:10px;color:#fff}ion-col[_ngcontent-%COMP%]:last-child{font-size:16px;font-weight:700;color:#fff}ion-icon[_ngcontent-%COMP%]{font-size:20px;color:#fff}ion-footer[_ngcontent-%COMP%]   ion-button[_ngcontent-%COMP%]{display:flex;align-items:center;justify-content:center;border-radius:50%;width:45px;height:45px;background:#007bff!important;color:#fff!important}ion-footer[_ngcontent-%COMP%]   ion-icon[name=paper-plane-outline][_ngcontent-%COMP%]{font-size:22px;color:#fff}.escribiendo[_ngcontent-%COMP%]{font-size:14px;color:#888;font-style:italic;opacity:0;animation:_ngcontent-%COMP%_aparecerDesaparecer 1.5s ease-in-out infinite;position:relative;left:-1px}@keyframes _ngcontent-%COMP%_aparecerDesaparecer{0%{opacity:0;transform:translate(-10px)}50%{opacity:1;transform:translate(0)}to{opacity:0;transform:translate(10px)}}"]}),O})()},4211:(k,v,r)=>{r.d(v,{h:()=>a});var t=r(6354),d=r(4438),l=r(8079);let a=(()=>{var o;class i{constructor(n){this.firestore=n}guardarSolpe(n){return this.firestore.collection("solpes").add(n)}obtenerSolpes(){return this.firestore.collection("solpes").snapshotChanges()}obtenerUltimaSolpe(){return this.firestore.collection("solpes",n=>n.orderBy("numero_solpe","desc").limit(1)).valueChanges()}obtenerTodasLasSolpes(){return this.firestore.collection("solpes").snapshotChanges().pipe((0,t.T)(n=>n.map(f=>{const u=f.payload.doc.data();return{id:f.payload.doc.id,...u}})))}}return(o=i).\u0275fac=function(n){return new(n||o)(d.KVO(l.Qe))},o.\u0275prov=d.jDH({token:o,factory:o.\u0275fac,providedIn:"root"}),i})()}}]);