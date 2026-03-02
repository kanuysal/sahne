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


let stickyElements = [];


//


export const initStick = ({ scroll, breakpoint, isHorizontal }) => {

   stickyElements = [...d.querySelectorAll('[stick]')].map(el => {

      return {

         el,
         stickStart: parseFloat(el.getAttribute('stick-start')) || 0,
         stickDistance: parseFloat(el.getAttribute('stick-distance')) || 1,
         disableAtBreak: el.hasAttribute('disable-at-break'),

      };

   })


   //


   Stick({ scroll, breakpoint, isHorizontal })


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


export const Stick = ({ scroll, breakpoint, isHorizontal }) => {

   const dimension = isHorizontal ? ww : wh;

   for (const { el, stickDistance, stickStart, disableAtBreak } of stickyElements) {

      const offset = getAbsoluteOffset(el, isHorizontal)

      if (!disableAtBreak || (disableAtBreak && w.matchMedia('(min-width: ' + breakpoint + 'px)').matches)) {

         const triggerPoint = offset - dimension * stickStart;
         const maxStick = stickDistance * dimension;
         const progress = scroll - triggerPoint;

         if (progress >= 0 && progress <= maxStick) {

            el.style.transform = isHorizontal
               ? `translate3d(${progress}px, 0, 0)`
               : `translate3d(0, ${progress}px, 0)`;

         } else if (progress > maxStick) {

            el.style.transform = isHorizontal
               ? `translate3d(${maxStick}px, 0, 0)`
               : `translate3d(0, ${maxStick}px, 0)`;

         } else {

            el.style.transform = `translate3d(0, 0, 0)`;

         }

      } else {

         el.style.transform = `translate3d(0, 0, 0)`;

      }

   }

};
