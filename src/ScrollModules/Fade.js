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


let fadeElements = [];


//


export const initFade = ({ scroll, breakpoint, isHorizontal }) => {

   fadeElements = [...d.querySelectorAll('[fade-in], [fade-out]')].map(el => {

      return {
         el,
         offset: isHorizontal ? el.getBoundingClientRect().left + window.scrollX : el.getBoundingClientRect().top + window.scrollY,
         fadeStart: parseFloat(el.getAttribute('fade-start')) || 0.5,
         fadeDistance: parseFloat(el.getAttribute('fade-distance')) || 0.2,
         disableAtBreak: el.hasAttribute('disable-at-break'),
         type: el.hasAttribute('fade-in') ? 'in' : 'out'

      };

   });


   //


   Fade({ scroll, breakpoint, isHorizontal });

};


//


export const Fade = ({ scroll, breakpoint, isHorizontal }) => {

   const dimension = isHorizontal ? ww : wh;

   for (const { el, offset, fadeStart, fadeDistance, disableAtBreak, type } of fadeElements) {

      if (!disableAtBreak || (disableAtBreak && w.matchMedia('(min-width: ' + breakpoint + 'px)').matches)) {

         const start = offset - dimension * fadeStart;
         const end = start + fadeDistance * dimension;
         const progress = (scroll - start) / (end - start);

         let opacity = type === 'in' ? progress : 1 - progress;
         opacity = Math.max(0, Math.min(1, opacity)); // clamp

         el.style.opacity = opacity;

      }

   }

};
