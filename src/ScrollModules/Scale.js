const d = document;
const w = window;


//


let ww = w.innerWidth;
let wh = w.innerHeight;


//


w.addEventListener('resize', () => {
   ww = w.innerWidth;
   wh = w.innerHeight;
})


//


let scaleElements = [];


//


export const initScale = ({ scroll, breakpoint, isHorizontal }) => {

   scaleElements = [...d.querySelectorAll('[scale-up], [scale-down]')].map(el => {

      return {
         el,
         scaleStart: parseFloat(el.getAttribute('scale-start')) || 1,
         scaleDistance: parseFloat(el.getAttribute('scale-distance')) || 1,
         strength: parseFloat(el.getAttribute('scale-strength')) || 0.5,
         initial: parseFloat(el.getAttribute('initial-scale')) || 1,
         disableAtBreak: el.hasAttribute('disable-at-break'),
         type: el.hasAttribute('scale-up') ? 'up' : 'down'
      };

   });


   //


   Scale({ scroll, breakpoint, isHorizontal });

};


//


const getAbsoluteOffset = (el, isHorizontal) => {

   let offset = 0;

   while (el) {
      offset += isHorizontal ? el.offsetLeft : el.offsetTop;
      el = el.offsetParent;
   }

   return offset;

};


//


export const Scale = ({ scroll, breakpoint, isHorizontal }) => {

   const dimension = isHorizontal ? ww : wh;


   //


   for (const { el, scaleStart, scaleDistance, strength, initial, disableAtBreak, type } of scaleElements) {

      if (!disableAtBreak || (disableAtBreak && w.matchMedia('(min-width: ' + breakpoint + 'px)').matches)) {

         const offset = getAbsoluteOffset(el, isHorizontal)

         const start = offset - dimension * scaleStart;
         const end = start + scaleDistance * dimension;
         const progress = (scroll - start) / (end - start);

         const t = Math.max(0, Math.min(1, progress));

         const scale = type === 'up'
            ? initial + t * strength
            : initial - t * strength;

         el.style.transformOrigin = 'center center';
         el.style.transform = `scale(${scale})`;

      }

   }

};
