import Lenis from 'lenis';

import { initTranslate, Translate } from './Translate.js';
import { initStick, Stick } from './Stick.js';
import { initFade, Fade } from './Fade.js';
import { initScale, Scale } from './Scale.js';


//


"use strict"


//


let externalScrollCallback = null;


//


// Handheld Detection

const isHandheldCheck = () => /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
const isHandheld = isHandheldCheck()


//


export const ScrollHandler = (options = {}) => {


   const defaults = {

      contentContainer: document.getElementById('content'),

      scrollBreakpoint: 1280,
      wheelMultiplier: 0.33,
      duration: 1.2,
      lerp: 0.066,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      scrollTriggerDuration: 1500,

      smooth: true,
      direction: "vertical",
      wrapper: document.documentElement,
      content: document.body,
      autoRestore: false,
      autoRaf: true,
      smoothTouch: false,
      syncTouch: false,

   }

   const settings = { ...defaults, ...options }


   //


   // Global Aliases

   const d = document;
   const de = d.documentElement;
   const w = window;
   const b = d.body;


   //


   let scrollHandler, toggleHorizontalScroll, horizontalScrollHandler, scrollDummy, scrollTriggerHandler, onScroll, resetScroll, initModules;

   const scrollBreakpoint = settings.scrollBreakpoint;


   //


   let horizontalScroll;


   //


   if (!isHandheld) {

      scrollHandler = new Lenis(settings) // scrollHandler

   } else {

      w.addEventListener('scroll', () => {

         const s = w.scrollY;

         onScroll(s, s)

      })

   }


   //


   if (scrollHandler) scrollHandler.on('scroll', (e) => {

      if (e.scroll >= e.limit) return;

      const windowScrollDistance = w.scrollY;
      const smoothScrollDistance = e.scroll;

      if (!horizontalScroll) {

         onScroll(windowScrollDistance, smoothScrollDistance)

         // console.log('Normal Scrolling')

      } else {


         const horizontalScrollContainer = d.getElementById('horizontal-scroll-container')
         if (!horizontalScrollContainer) return;


         const maxScroll = scrollDummy.scrollHeight - w.innerHeight;
         const maxTranslate = horizontalScrollContainer.offsetWidth - w.innerWidth;

         const x = (smoothScrollDistance / maxScroll) * maxTranslate;

         horizontalScrollContainer.style.transform = 'translateX(' + -x + 'px)';

         onScroll(0, x)

         // console.log('Horizontal Scrolling')         

      }

   }) // scrollHandler.on('scroll')


   //


   const getModuleContext = (s) => {

      const scroll = typeof s === 'number'
         ? s
         : horizontalScroll
            ? scrollHandler?.scroll || 0
            : window.pageYOffset;

      return {
         scroll,
         breakpoint: scrollBreakpoint,
         isHorizontal: horizontalScroll
      }

   } // getModulesContext()



   //


   onScroll = (ws, s) => {

      if (!isHandheld) Stick(getModuleContext(horizontalScroll ? s : ws))
      Translate(getModuleContext(s))
      Fade(getModuleContext(s))
      Scale(getModuleContext(s))


      //


      if (externalScrollCallback) externalScrollCallback(s)


   } // onScroll()   


   //


   resetScroll = () => {

      if (!scrollHandler) return;

      scrollHandler.stop()

      w.scrollTo(0, 0)
      onScroll(0, 0)

      scrollHandler.resize()

      scrollHandler.scrollTo(0, { immediate: true })

      scrollHandler.start()

   } // resetScroll()   


   //


   function resize() {

      if (scrollHandler) scrollHandler.resize()

   } // resize()


   //


   toggleHorizontalScroll = () => {

      if (
         d.getElementById('horizontal-scroll-container') == null
         || w.matchMedia('(max-width: ' + scrollBreakpoint + 'px)').matches
      ) {

         // normal scroll

         if (horizontalScroll) {

            horizontalScroll = false;

            disableHorizontalScroll()

         }

      } else {

         // horizontal scroll

         if (!horizontalScroll) {

            horizontalScroll = true;

            enableHorizontalScroll()

         }

      }


      //


      function disableHorizontalScroll() {

         if (d.getElementById('dummy')) d.getElementById('dummy').remove()

         settings.contentContainer.style.position = 'initial';

         if (d.getElementById('horizontal-scroll-container') !== null) d.getElementById('horizontal-scroll-container').style.transform = 'unset';

         resetScroll()

      } // disableHorizontalScroll()


      //


      function enableHorizontalScroll() {

         settings.contentContainer.style.position = 'fixed';

         createDummy()

         resetScroll()

      } // enableHorizontalScroll()


      //


      function createDummy() {


         if (scrollDummy) scrollDummy.remove()

         const dummyElement = d.createElement('div')
         dummyElement.id = 'dummy';
         b.appendChild(dummyElement)
         scrollDummy = d.getElementById('dummy')

         updateDummyHeight()


      } // createDummy()      


      //


      function updateDummyHeight() {


         if (!horizontalScroll) return;


         const contentWidth = d.getElementById('horizontal-scroll-container').offsetWidth;
         const dummyHeight = contentWidth - w.innerWidth + w.innerHeight;

         scrollDummy.style.height = dummyHeight + 'px';


      } // updateDummyHeight()


   } // toggleHorizontalScroll()


   //


   toggleHorizontalScroll()
   w.addEventListener('resize', toggleHorizontalScroll)


   //


   initModules = () => {

      const moduleContext = getModuleContext(0)

      if (!isHandheld) initStick(moduleContext)
      initTranslate(moduleContext)
      initFade(moduleContext)
      initScale(moduleContext)

   } // initModules()


   //


   initModules()


   //


   function updateModulesOnResize() {


      const currentScroll = horizontalScroll ? scrollHandler.scroll : w.pageY;
      const moduleContext = getModuleContext(currentScroll)

      // console.log(moduleContext)

      if (!isHandheld) initStick(moduleContext)
      initTranslate(moduleContext)
      initFade(moduleContext)
      initScale(moduleContext)

      if (!isHandheld) Stick(moduleContext)
      Translate(moduleContext)
      Fade(moduleContext)
      Scale(moduleContext)


   } // updateModulesOnResize()


   //


   w.addEventListener('resize', updateModulesOnResize)


   //


   scrollTriggerHandler = () => {


      d.querySelectorAll('[data-scroll-trigger]').forEach(el => {

         el.addEventListener('click', () => {

            const target = el.getAttribute('data-scroll-target')
            if (!target) return;

            const targetElem = d.getElementById(target)

            scrollHandler.scrollTo(targetElem.offsetTop, settings.scrollTriggerDuration)

         })

      })


   } // scrollTriggerHandler()


   //


   scrollTriggerHandler()


   //


   return {

      initModules,
      resetScroll,
      toggleHorizontalScroll,
      scrollTriggerHandler,
      resize,

      onScroll: (fn) => {
         externalScrollCallback = typeof fn === 'function' ? fn : null;
      }

   }


} // ScrollHandler()