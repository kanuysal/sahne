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


let translateElements = [];


//


export const initTranslate = ({ scroll, breakpoint, isHorizontal }) => {

   translateElements = [...d.querySelectorAll('[translate-up], [translate-down], [translate-left], [translate-right]')].map(el => {

      return {
         el,

         // offset: isHorizontal ? el.getBoundingClientRect().left + window.scrollX : el.getBoundingClientRect().top + window.scrollY,

         strength: parseFloat(el.getAttribute('translate-strength')) || 0.5,
         originPoint: parseFloat(el.getAttribute('origin-point')) || 0,
         disableAtBreak: el.hasAttribute('disable-at-break'),
         direction:
            el.hasAttribute('translate-up') ? 'up' :
               el.hasAttribute('translate-down') ? 'down' :
                  el.hasAttribute('translate-left') ? 'left' :
                     el.hasAttribute('translate-right') ? 'right' :
                        null

      };


   });


   //


   Translate({ scroll, breakpoint, isHorizontal });


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


export const Translate = ({ scroll, breakpoint, isHorizontal }) => {

   const dimension = isHorizontal ? ww : wh;

   for (const { el, strength, originPoint, disableAtBreak, direction } of translateElements) {

      if (!disableAtBreak || (disableAtBreak && w.matchMedia('(min-width: ' + breakpoint + 'px)').matches)) {

         const offset = getAbsoluteOffset(el, isHorizontal)

         const base = dimension * originPoint;
         const value = (strength * (scroll + base)) - (offset * strength);

         switch (direction) {
            case 'up':
               el.style.transform = `translate3d(0, ${-value}px, 0)`;
               break;
            case 'down':
               el.style.transform = `translate3d(0, ${value}px, 0)`;
               break;
            case 'left':
               el.style.transform = `translate3d(${-value}px, 0, 0)`;
               break;
            case 'right':
               el.style.transform = `translate3d(${value}px, 0, 0)`;
               break;

         }

      } else {

         el.style.transform = `translate3d(0, 0, 0)`;

      }

   }

};
