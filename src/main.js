import { ScrollHandler } from './ScrollModules/ScrollHandler.js';
import Form from './modules/Form.js';
import HomeScene from './modules/HomeScene.js';
import LabScene from './modules/LabScene.js';


//


"use strict";


//


// Global Aliases

const d = document;
const de = d.documentElement;
const w = window;
const b = d.body;


//


const isProduction = b.getAttribute('data-production') == 'true' ? true : false;


//


const debug = false;
let startTime;


//


let loadPage, incomingPage, outgoingPage, firstLoadPage;
firstLoadPage = b.getAttribute('data-current').replace('.php', '')
outgoingPage = firstLoadPage;
b.classList.add('open-' + firstLoadPage)


//


const contentContainer = d.getElementById('content')


//


let isTransitioning = false;


//


let scrollHandler, updateScrollHandler, onContentLoaded, hoverStateTriggersHandler, iframesCursorHandler, onboardingForm, cursor, homeScene, labScene;


//


// Set global duration and assign to css var to synchronise

const transitionDuration = 300;
const scrollTriggerDuration = 1500;

de.style.setProperty('--global', transitionDuration + 'ms')
de.style.setProperty('--st', scrollTriggerDuration + 'ms')


//


let initSliders, toggleLightMode;


//


// Handheld Detection

const isHandheld = () => /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

b.setAttribute('data-mobile', isHandheld())


// Get Mouse Position ( mouse.x / mouse.y )

let mouse = { x: 0, y: 0 };

d.addEventListener('mousemove', (e) => {

   mouse.x = e.clientX; mouse.y = e.clientY;

})


//


w.addEventListener('DOMContentLoaded', () => {


   // DOM Ready


   function initScrollHandler() {


      const scrollHandlerSettings = {

         scrollBreakpoint: 1280,

         wheelMultiplier: 0.5,
         duration: 1.4,
         lerp: 0.066,

         scrollTriggerDuration: scrollTriggerDuration,
         contentContainer: contentContainer,

      } // scrollHandlerSettings


      //


      scrollHandler = ScrollHandler(scrollHandlerSettings)


      //


      updateScrollHandler = () => {


         // Reinit Dynamic DOM Elem Functions

         if (!scrollHandler) return;

         scrollHandler.initModules()
         scrollHandler.toggleHorizontalScroll()
         scrollHandler.scrollTriggerHandler()
         scrollHandler.resetScroll()


      } // updateScrollHandler()


      //


      // scrollHandler.onScroll((s) => {
      //    console.log('Scroll position:' + s);
      // })


   } // initScrollHandler()


   //


   function navigationHandler() {


      b.addEventListener('click', function (e) { // add event to body so on DOM change, event still works 


         if (debug) startTime = performance.now()


         //


         let delay = 0;


         //


         if (e.target.matches('[data-internal-link]') || e.target.matches('[data-external-link]')) {

            e.preventDefault()


            //


            const linkElement = e.target; // get link element

            const linkTarget = linkElement.getAttribute('data-link-target') || linkElement.getAttribute('href') // get link target
            if (!linkTarget) return;


            //


            if (e.target.matches('[data-external-link]')) {

               w.open(linkTarget, '_blank') // needs to be a full url..

               return;

            } // e.target.matches('[data-external-link]')


            //


            b.classList.add('disable-interaction')


            //


            if (e.target.matches('[data-scroll-trigger]')) {

               delay = scrollTriggerDuration + 50;

            } // e.target.matches('[data-scroll-trigger]')


            //


            setTimeout(() => {

               loadPage(linkTarget)

            }, delay)


         } // if (e.target.matches('[data-internal-link]'))


      }) // b.addEventListener('click')


      //


      loadPage = (linkTarget) => { // split off and exposed to manually run if needed


         if (isTransitioning) return;
         isTransitioning = true;


         //


         incomingPage = linkTarget;


         //


         // *Disable navigating to current page..

         // if (incomingPage == outgoingPage) {

         //    isTransitioning = false;
         //    b.classList.remove('disable-interaction')
         //    return;

         // }


         //


         // Close navigation

         let navigationDelay = 0;

         if (b.classList.contains('open-navigation')) {

            navigationDelay = transitionDuration * 2;

            b.classList.add('closing-navigation')

            setTimeout(() => b.classList.remove('open-navigation', 'lock-scroll', 'closing-navigation'), navigationDelay)

         }


         //


         b.classList.remove('cursor-arrows')


         //


         let labSceneDelay = 0;

         if (outgoingPage == 'lab') {


            b.classList.remove('show-lab-content')


            if (b.classList.contains('open-navigation')) {

               labScene.startRender()

               requestAnimationFrame(() => {
                  labScene.outro()
               })

            } else {

               labScene.outro()

            }


            labSceneDelay = transitionDuration * 4;
            setTimeout(() => labScene.stopRender(), labSceneDelay)


         }


         //


         let homeSceneDelay = 0;


         if (outgoingPage == 'home') {


            b.classList.add('hide-slide')


            if (b.classList.contains('open-navigation')) {

               homeScene.startRender()

               requestAnimationFrame(() => {
                  homeScene.outro()
               })

            } else {

               homeScene.outro()

            }


            homeSceneDelay = transitionDuration * 4;
            setTimeout(() => homeScene.stopRender(), homeSceneDelay)


         }


         //


         setTimeout(() => {


            b.classList.add('loading', 'transitioning', 'close-' + outgoingPage)

            requestAnimationFrame(() => b.classList.add('setup-' + incomingPage))


         }, labSceneDelay + homeSceneDelay)


         //



         setTimeout(() => loadContent(incomingPage), transitionDuration + navigationDelay + labSceneDelay + homeSceneDelay) // allow page 'close' transitions before loading content


      } // loadPage()


      //


      async function loadContent(incomingPage) {


         try {

            const response = await fetch(incomingPage + '.php')

            if (!response.ok) throw new Error('Failed to fetch content. Status: ' + response.status)

            const incomingDocument = await response.text()
            const incomingContent = d.createElement('div')
            incomingContent.innerHTML = incomingDocument;


            //


            updatePage(incomingPage, incomingContent)


         } catch (error) {

            console.error(error)
            isTransitioning = false;
            b.classList.remove('transitioning')

         }


      } // loadContent()


      //


      function updatePage(incomingPage, incomingContent) {


         function updateMeta(incomingContent) {


            const newMetaTitle = incomingContent.querySelector('title').textContent;
            const newMetaDescription = incomingContent.querySelector('meta[name="description"]')?.getAttribute('content')


            //


            const currentMetaTitle = d.querySelector('title')
            const currentMetaDescription = d.querySelector('meta[name="description"]')


            //


            // Replace meta title and description

            if (currentMetaTitle) currentMetaTitle.textContent = newMetaTitle;
            if (currentMetaDescription) {

               currentMetaDescription.setAttribute('content', newMetaDescription)

            } else {

               // Create and append new meta description if one doesn't exist 

               const newMetaDescriptionElement = d.createElement('meta')
               newMetaDescriptionElement.setAttribute('name', 'description')
               newMetaDescriptionElement.setAttribute('content', newMetaDescription)
               dh.appendChild(newMetaDescriptionElement)

            }


         } // updateMeta()


         //


         function updateBrowserState(incomingPage) {


            if (isProduction) {

               const stateObj = { page: incomingPage };
               w.history.pushState(stateObj, '', incomingPage)

            } else {

               const stateObj = { page: incomingPage + '.php' };
               w.history.pushState(stateObj, '', incomingPage + '.php')

            }


         } // updateBrowserState()


         //


         function updateContent(incomingPage, incomingContent) {


            const content = incomingContent.querySelector('#content')

            contentContainer.innerHTML = content.innerHTML;


            //


            w.scrollTo(0, 0)


            //


            const checkMediaLoaded = true;


            //


            if (checkMediaLoaded) {


               const mediaElements = incomingContent.querySelectorAll('img, video')

               if (mediaElements.length > 0) {

                  if (debug) console.log('Processing ' + mediaElements.length + ' Media Elements')


                  let imgIndex = 0;
                  let videoIndex = 0;

                  const mediaLoadPromises = Array.from(mediaElements).map(media => {

                     return new Promise(resolve => {

                        if (media.tagName.toLowerCase() === 'img') {

                           const currentImgIndex = imgIndex++;

                           if (debug) console.log('Processing Image ' + currentImgIndex + ':', media)

                           const imgSrc = media.src;


                           // Check if media src is valid

                           if (!imgSrc || media.getAttribute('src') === '') {

                              if (debug) console.log('Skipping Image ' + currentImgIndex + ' no valid src:', media)
                              resolve()
                              return;

                           }

                           // Check if media is already loaded

                           if (media.complete && media.naturalWidth > 0) {
                              if (debug) console.log('Skipping Image ' + currentImgIndex + ' (already loaded):', media)
                              resolve()
                              return;
                           }

                           // Check if media file exists

                           fetch(imgSrc, { method: 'HEAD' })

                              .then(response => {

                                 if (!response.ok) throw new Error(`HTTP ${response.status}`)

                                 if (media.complete) {

                                    if (debug) console.log('Image ' + currentImgIndex + ' already loaded:', media)
                                    resolve()

                                 } else {

                                    media.addEventListener('load', () => {

                                       if (debug) console.log('Image ' + currentImgIndex + ' loaded:', media)
                                       resolve()

                                    })

                                    media.addEventListener('error', () => {

                                       if (debug) console.log('Image ' + currentImgIndex + ' error:', media)
                                       resolve()

                                    })

                                 }
                              })

                              .catch(() => {

                                 if (debug) console.log('Skipping Image ' + currentImgIndex + ' not found (404):', media)
                                 resolve()

                              })

                        }

                        else if (media.tagName.toLowerCase() === 'video') {

                           const currentVideoIndex = videoIndex++;

                           if (debug) console.log('Processing Video ' + currentVideoIndex + ':', media)


                           // Check if media src is valid

                           const videoSrc = media.src || media.querySelector('source')?.src;

                           if (!videoSrc) {

                              if (debug) console.log('Skipping Video ' + currentVideoIndex + ' no valid src:', media)
                              resolve()
                              return;

                           }

                           // Check if media is already loaded

                           if (media.complete && media.naturalWidth > 0) {
                              if (debug) console.log('Skipping Image ' + currentVideoIndex + ' (already loaded):', media)
                              resolve()
                              return;
                           }

                           // Check if media file exists

                           fetch(videoSrc, { method: 'HEAD' })

                              .then(response => {

                                 if (!response.ok) throw new Error(`HTTP ${response.status}`)

                                 if (media.readyState >= 3) {

                                    if (debug) console.log('Video ' + currentVideoIndex + ' already loaded:', media)
                                    resolve()

                                 } else {

                                    media.addEventListener('canplaythrough', () => {

                                       if (debug) console.log('Video ' + currentVideoIndex + ' loaded:', media)
                                       resolve()

                                    })

                                    media.addEventListener('error', () => {

                                       if (debug) console.log('Video ' + currentVideoIndex + ' error:', media)
                                       resolve()

                                    })

                                 }

                              })

                              .catch(() => {

                                 if (debug) console.log('Skipping Video ' + currentVideoIndex + ' not found (404):', media)
                                 resolve()

                              })
                        }

                     })

                  })



                  //


                  Promise.all(mediaLoadPromises)

                     .then(() => {

                        if (debug) console.log('All media loaded')


                        //


                        completeTransition(incomingPage)

                     })
                     .catch(err => console.error('Error waiting for media to load:', err))


               } else {

                  if (debug) console.log('No Media Found')


                  //


                  completeTransition(incomingPage)

               } // if mediaElements.length > 0


            } else {

               completeTransition(incomingPage)

            } // if (checkMediaLoaded)


            //


            function completeTransition(incomingPage) {


               onContentLoaded(incomingPage)


               //


               if (debug) console.log('Running onContentLoaded()')


            } // completeTransition()


         } // updateContent()


         //


         updateMeta(incomingContent)
         updateBrowserState(incomingPage)
         updateContent(incomingPage, incomingContent)


      } // updatePage()


      //


      w.addEventListener('popstate', (e) => {

         if (e.state && e.state.page) {
            loadPage(e.state.page.replace('.php', ''))
         } else {
            location.reload()
         }

      }) // w.addEventListener('popstate')

      // w.addEventListener('popstate', () => location.reload())


   } // navigationHandler()


   //


   onContentLoaded = (incomingPage) => {


      // Re-Run Intro if index

      if (incomingPage == 'index') siteIntro()


      // Re-Init DOM dependent functions

      updateScrollHandler()
      initSliders()
      toggleLightMode()
      loopText()
      hoverStateTriggersHandler()
      iframesCursorHandler()
      initOnboardingForm()


      //


      // Complete Transition

      b.setAttribute('data-current', incomingPage) // manually update current page

      b.classList.remove(outgoingPage)
      b.classList.add(incomingPage)

      b.classList.remove('loading', 'open-' + outgoingPage, 'close-' + outgoingPage)

      b.classList.add('open-' + incomingPage)


      //


      setTimeout(() => b.classList.remove('setup-' + incomingPage), transitionDuration / 4)


      //


      b.classList.remove('transitioning', 'hide-slide', 'reveal-slide')


      //


      if (incomingPage == 'home') {

         b.classList.add('progress')


         if (!homeScene) {

            homeScene = HomeScene(() => {

               homeScene.startRender()

               requestAnimationFrame(() => {

                  setTimeout(() => homeScene.intro(), 100) // run after DPR ramp-up

                  setTimeout(() => {

                     b.classList.remove('progress')
                     b.classList.add('cursor-arrows')

                  }, transitionDuration * 2)

               })

            })

         } else {

            homeScene.startRender()

            requestAnimationFrame(() => {

               setTimeout(() => homeScene.intro(), 100)

               setTimeout(() => {

                  b.classList.remove('progress')
                  b.classList.add('cursor-arrows')

               }, transitionDuration * 2)

            })

         }


         //


         setTimeout(() => {

            b.setAttribute('data-current-slide', 1)
            b.classList.add('reveal-slide')

         }, transitionDuration / 2)


      } // incomingPage == 'home'      


      //


      if (incomingPage == 'lab') {

         b.classList.add('progress')


         if (!labScene) {

            labScene = LabScene(() => {

               labScene.startRender()

               requestAnimationFrame(() => {

                  b.classList.add('show-lab-content')

                  setTimeout(() => labScene.intro(), 100)

                  setTimeout(() => {

                     b.classList.remove('progress')
                     b.classList.add('cursor-arrows')

                  }, transitionDuration * 2)

               })

            })

         } else {

            labScene.startRender()

            requestAnimationFrame(() => {

               b.classList.add('show-lab-content')

               setTimeout(() => labScene.intro(), 100)

               setTimeout(() => {

                  b.classList.remove('progress')
                  b.classList.add('cursor-arrows')

               }, transitionDuration * 2)

            })

         }


      } // incomingPage == 'lab'


      //


      // After Transition Completed Housekeeping

      setTimeout(() => {


         isTransitioning = false;
         b.classList.remove('transitioning')

         outgoingPage = incomingPage;

         b.classList.remove('disable-interaction')

         updateScrollHandler()

         if (debug) console.log('Transition complete: ' + (performance.now() - startTime) + 'ms')


      }, transitionDuration)


      //


      setTimeout(() => {

         if (scrollHandler) scrollHandler.resize()

      }, transitionDuration * 4)


   } // onContentLoaded()   


   //


   function siteIntro() {


      b.classList.add('hide-header')


      //


      const introMask = d.getElementById('intro-mask')
      const introContainer = d.getElementById('intro-container')

      introMask.classList.add('hide')


      setTimeout(() => {

         // introMask hidden

         loadHomePage()

      }, transitionDuration * 4)


      //


      function loadHomePage() {


         if (!homeScene) {

            homeScene = HomeScene(() => {

               requestAnimationFrame(() => {

                  homeReady()

               })

            })

         } else {

            homeScene.startRender()

            requestAnimationFrame(() => {

               homeReady()

            })

         }

      } // loadHomePage()


      function homeReady() {


         introContainer.classList.add('hide')
         introMask.remove()

         setTimeout(() => {

            introContainer.remove()

            b.classList.add('show-header')
            setTimeout(() => b.classList.remove('hide-header', 'show-header'), transitionDuration * 4)

            loadPage('home')

         }, transitionDuration * 4)


      } // homeReady()


   } // siteIntro()


   //


   function pageIntro() {


      const introContainer = d.getElementById('intro-container')

      introContainer.classList.add('hide')

      setTimeout(() => introContainer.remove(), transitionDuration * 4)


   } // pageIntro()


   //


   function menuHandler() {


      const menuButton = d.getElementById('menu-button')

      menuButton.addEventListener('click', () => {

         b.classList.add('disable-interaction')
         setTimeout(() => {
            b.classList.remove('disable-interaction')
         }, transitionDuration * 4)

         if (b.classList.contains('open-navigation')) {

            b.classList.add('closing-navigation')

            updateScrollHandler()

            if (b.getAttribute('data-current') == 'home') {
               setTimeout(() => homeScene.resume(), 0)
            }

            if (b.getAttribute('data-current') == 'lab') {
               setTimeout(() => labScene.resume(), transitionDuration / 2)
            }

            setTimeout(() => b.classList.remove('closing-navigation'), transitionDuration * 4)

            b.classList.remove('open-navigation', 'lock-scroll')

         } else {

            if (b.getAttribute('data-current') == 'home') homeScene.pause()

            if (b.getAttribute('data-current') == 'lab') labScene.pause()

            b.classList.add('open-navigation')

            setTimeout(() => {

               b.classList.add('lock-scroll')

            }, transitionDuration)

         }

      })


   } // menuHandler()


   //


   initSliders = () => {


      const sliders = d.querySelectorAll('[data-slider]')

      if (sliders.length == 0) return;


      sliders.forEach(slider => {

         const images = slider.querySelectorAll('img, video')
         if (images.length <= 1) return;

         const speed = parseInt(slider.getAttribute('data-slider-speed')) || 600; // ms
         const delay = parseInt(slider.getAttribute('data-slider-delay')) || 2000; // ms

         let currentIndex = 0;
         let nextIndex = 1;

         images.forEach((image, i) => {
            image.style.display = 'none';
            image.style.transitionDuration = speed + 'ms';
            image.style.zIndex = i === 0 ? '2' : '1';
         })

         images[currentIndex].style.display = 'block';
         images[nextIndex].style.display = 'block';

         function doTransition() {

            setTimeout(() => {

               images[currentIndex].style.opacity = 0;

               setTimeout(() => {
                  images[currentIndex].style.display = 'none';
                  images[currentIndex].style.opacity = 1;

                  currentIndex = (currentIndex + 1) % images.length;
                  nextIndex = (currentIndex + 1) % images.length;

                  images[nextIndex].style.display = 'block';
                  images[nextIndex].style.zIndex = '1';
                  images[currentIndex].style.zIndex = '2';

                  doTransition()

               }, speed)

            }, delay)

         }

         doTransition()


      })


   } // initSliders()


   //


   toggleLightMode = () => {

      if (d.getElementById('page') !== null && d.getElementById('page').classList.contains('light')) {
         de.classList.add('light')
      } else {
         de.classList.remove('light')
      }

   } // toggleLightMode()


   //


   function loopText() {

      d.querySelectorAll('.loop').forEach(loop => {
         const text = loop.innerHTML;
         loop.innerHTML = '<div style="transform: translateX(-50%)">' + text + text + text + text + text + text + text + text + '</div>';
      })

   } // loopText()    


   //


   function customCursor() {


      if (d.getElementById('cursor') == null) return;

      cursor = d.getElementById('cursor')

      if (cursor && isHandheld()) {

         cursor.remove()

         return;

      }


      //


      let firstMovement = true, rafId;

      d.addEventListener('mousemove', (e) => {


         if (firstMovement) {
            cursor.classList.remove('disable')
            firstMovement = false;
         }

         if (!rafId) {

            rafId = requestAnimationFrame(() => {

               cursor.style.transform = 'translate3d(' + (mouse.x - w.innerWidth / 2) + 'px, ' + (mouse.y - w.innerHeight / 2) + 'px, 0)';
               rafId = null;

            })

         }


      })


      //


      d.addEventListener('mouseout', () => {
         cursor.classList.add('hide')
      })

      d.addEventListener('mouseover', () => {
         cursor.classList.remove('hide')
      })


      //


      iframesCursorHandler()


      //


      hoverStateTriggersHandler()


      //     


   } // customCursor()   


   //


   iframesCursorHandler = () => {


      let iframes = d.querySelectorAll('iframe')


      iframes.forEach(el => {

         el.addEventListener('mouseover', () => {
            cursor.classList.add('iframe-disable')
         })

         el.addEventListener('mouseout', () => {
            cursor.classList.remove('iframe-disable')
         })

      })


   } // iframesCursorHandler      


   //


   hoverStateTriggersHandler = () => {


      const hoverStateTriggers = d.querySelectorAll('[data-hover-state-trigger], [data-internal-link], [data-external-link], #menu-button, #menu ul li div')

      hoverStateTriggers.forEach(el => {

         el.addEventListener('mouseover', () => {

            if (!b.classList.contains('loading', 'transitioning', 'closing-navigation')) {
               cursor.classList.add('hover-state')
            } else {
               cursor.classList.remove('hover-state')
            }

         })

         el.addEventListener('mouseleave', () => cursor.classList.remove('hover-state'))

      })


   } // hoverStateTriggersHandler()      


   //


   function initOnboardingForm() {


      if (d.getElementById('form-container') !== null) {
         if (!onboardingForm) onboardingForm = Form()
      }


   } // initOnboardingForm()


   //


   function emailLinks() {


      d.querySelectorAll(".email-link-a").forEach(el => el.addEventListener("click", () => {
         const email = "sales@konser.com";
         w.location.href = "mailto:" + email;
      }))

      d.querySelectorAll(".email-link-b").forEach(el => el.addEventListener("click", () => {
         const email = "studio@konser.com";
         w.location.href = "mailto:" + email;
      }))

      d.querySelectorAll(".email-link-c").forEach(el => el.addEventListener("click", () => {
         const email = "careers@konser.com";
         w.location.href = "mailto:" + email;
      }))


   } // emailLinks()   


   //


   function onFirstLoad() {


      firstLoadPage == 'index' ? siteIntro() : pageIntro()


      //


      if (firstLoadPage == 'home') {

         homeScene = HomeScene(() => {

            homeScene.startRender()

            requestAnimationFrame(() => {

               setTimeout(() => homeScene.intro(), 100)

               setTimeout(() => {

                  b.setAttribute('data-current-slide', 1)
                  b.classList.add('reveal-slide')

               }, 100)


               setTimeout(() => {

                  b.classList.add('cursor-arrows')

               }, transitionDuration * 2)

            })

         })

      }


      //


      if (firstLoadPage == 'lab') {

         b.classList.add('progress')

         labScene = LabScene(() => {

            labScene.startRender()

            requestAnimationFrame(() => {

               b.classList.add('show-lab-content')

               setTimeout(() => {

                  b.classList.remove('progress')
                  b.classList.add('cursor-arrows')

               }, transitionDuration * 2)


               setTimeout(() => labScene.intro(), 100)

            })

         })

      }


      //


      if (scrollHandler) scrollHandler.resetScroll()


      // DOM 

      toggleLightMode()
      loopText()
      initOnboardingForm()

   } // onFirstLoad()


   //


   w.addEventListener('load', () => {


      // All Resources Loaded


      navigationHandler()
      initScrollHandler()


      //


      menuHandler()
      initSliders()
      customCursor()
      emailLinks()


      //




      //


      onFirstLoad()


   }) // window.load


}) // DOM Ready
