import * as THREE from 'three';

// Utils

import { renderLoop } from './FPSCap.js';

// Loaders

import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

//

import { ReflectiveMaterial } from './ReflectiveMaterial.js';

//

import TWEEN from 'three/addons/libs/tween.module.js';
// import { transition } from 'three/examples/jsm/tsl/display/TransitionNode.js';



"use strict";


// Global Aliases

const d = document;
const de = d.documentElement;
const w = window;
const b = d.body;


// Get Mouse Position ( mouse.x / mouse.y )

let mouse = { x: 0, y: 0 };
let halfX = w.innerWidth / 2;
let halfY = w.innerHeight / 2;

let movementMultiplier = 0.2;

d.addEventListener('mousemove', (e) => {

   mouse.x = (e.clientX - halfX) / 2000 * movementMultiplier;
   mouse.y = (e.clientY - halfY) / 2000 * movementMultiplier;

})


let animate, labRenderControl, globalTransitionDuration;


// THREE Aliases

let renderer, scene, camera, stats;

let startRender, stopRender, pause, resume, intro, outro;

let introTween, introOpacityTween, outroTween, outroOpacityTween;

let sceneDummyScroller, sceneDummyScrollerHandler, updateScreen, resetScreen, currentIndex, direction, isLocked, touchStartY;


//


let wallMaterial, screenPlane, createVideoTexture, currentVideoTexture, currentVideoElement, videoElements;


//


// Loaders

const loadingManager = THREE.DefaultLoadingManager;

const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('./draco/gltf/')

const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

const rgbeLoader = new RGBELoader()

const textureLoader = new THREE.TextureLoader()


//


const labSceneContainer = d.getElementById('lab-scene-container')


//


const isHandheldCheck = () => /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
const isHandheld = isHandheldCheck()

let isSmall = w.matchMedia('(max-width: 932px)').matches;

let fovAdjustement = 0;

if (isSmall) fovAdjustement = 40;


//


const isFirefox = navigator.userAgent.toLowerCase().includes('firefox')
b.setAttribute('data-ff', isFirefox)

let baseDPR, originalPixelRatio;


//


const LabScene = (onReadyCallback) => {


   if (!labSceneContainer) return;


   //


   let loadHDR, loadGirders, sceneReady;


   //


   globalTransitionDuration = parseFloat(getComputedStyle(de).getPropertyValue('--global'))


   //


   function initScene() {


      function setupScene() {


         renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" })

         baseDPR = w.devicePixelRatio;
         originalPixelRatio = isFirefox ? baseDPR * 0.8 : baseDPR;

         renderer.setPixelRatio(originalPixelRatio)
         renderer.setSize(w.innerWidth, w.innerHeight)

         renderer.toneMapping = THREE.ACESFilmicToneMapping;
         renderer.toneMappingExposure = 1;

         renderer.outputColorSpace = THREE.SRGBColorSpace;

         renderer.autoClear = false;

         labSceneContainer.appendChild(renderer.domElement)


         //


         const sceneBackground = 0x020202;


         scene = new THREE.Scene()
         scene.background = new THREE.Color(sceneBackground)


         //


         camera = new THREE.PerspectiveCamera(80, w.innerWidth / w.innerHeight, 1, 100)

         camera.position.z = 5.5;

         camera.lookAt(
            scene.position.x,
            scene.position.y,
            scene.position.z + camera.position.z - 2
         )


         //


         scene.fog = new THREE.FogExp2(sceneBackground, 0.04)


         //


         // stats = new EnhancedStats(renderer, scene)
         // b.appendChild(stats.dom)


         //


         loadHDR = new Promise((resolve) => {

            rgbeLoader.load("./hdr/yellow_field_1k.hdr", texture => {

               const pmremGenerator = new THREE.PMREMGenerator(renderer)
               pmremGenerator.compileEquirectangularShader()
               const envTexture = pmremGenerator.fromEquirectangular(texture).texture;
               scene.environment = envTexture;
               pmremGenerator.dispose()

               resolve()

            },
               undefined,
               error => {
                  console.warn("HDR load failed, proceeding with default environment", error);
                  resolve(); // Don't block loading
               }
            )

         })


      } // setupScene()


      //


      function createScreens() {


         videoElements = Array.from(d.querySelectorAll('#video-textures video'))


         //


         createVideoTexture = (index) => {


            if (currentVideoElement) currentVideoElement.pause()
            if (currentVideoTexture) currentVideoTexture.dispose()

            const video = videoElements[index]
            if (!video) return null;

            // Ensure video metadata is ready
            const texture = new THREE.VideoTexture(video)

            // Sequential Loading: Start loading the next video after current one is ready
            const loadSequentially = (idx) => {
               if (idx >= videoElements.length - 1) return;
               const nextVid = videoElements[idx + 1];
               if (nextVid && !nextVid.dataset.initialized) {
                  const source = nextVid.querySelector('source');
                  if (source && !source.src) {
                     source.src = source.dataset.src;
                     nextVid.load();
                     nextVid.dataset.initialized = 'true';
                     // Wait for this one to have enough data before starting the next
                     nextVid.addEventListener('canplaythrough', () => loadSequentially(idx + 1), { once: true });
                  }
               }
            };

            // Cache management: Skip heavy reloading if already initialized
            if (!video.dataset.initialized) {
               const source = video.querySelector('source')
               if (source && !source.src) source.src = source.dataset.src;
               video.load()
               video.dataset.initialized = 'true';
               // Start sequential loading chain
               video.addEventListener('canplay', () => loadSequentially(index), { once: true });
            }

            // Only play if ready, otherwise wait for canplay
            if (video.readyState >= 2) {
               video.play().catch(() => { });
            } else {
               video.oncanplay = () => {
                  video.oncanplay = null;
                  video.play().catch(() => { });
               };
            }
            const orientation = video.getAttribute('data-orientation')
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

            if (orientation == 'square') {

               texture.repeat.set(1, 0.548)
               texture.offset.y = 0.228;

            }

            if (orientation == 'landscape') {

               texture.repeat.set(1, 1)
               texture.offset.y = 0;

            }

            // texture.minFilter = THREE.LinearFilter;
            // texture.magFilter = THREE.LinearFilter;

            if (!video.hasAttribute('default-cs'))
               texture.colorSpace = THREE.SRGBColorSpace;


            //


            if (texture) texture.needsUpdate = true


            //


            currentVideoElement = video;
            currentVideoTexture = texture;


            //

            return texture;


         } // createVideoTexture()


         //


         const firstTexture = createVideoTexture(0)


         // Auto-advance slider when video ends
         videoElements.forEach((vid, i) => {
            vid.addEventListener('ended', () => {
               const nextIndex = (i + 1) % videoElements.length;
               if (!isLocked) {
                  if (nextIndex === 0) {
                     // Loop back to start
                     resetScreen();
                  } else {
                     currentIndex = nextIndex;
                     updateScreen('down', currentIndex + 1);
                  }
               }
            });
         });


         // Video Walls


         const walls = new THREE.Group()
         scene.add(walls)

         const wallGeometry = new THREE.PlaneGeometry(16, 9)

         wallMaterial = new THREE.MeshBasicMaterial({
            map: firstTexture,
         })

         const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial)
         wallMesh.scale.set(0.3, 0.5)
         wallMesh.position.y = 4.75;  // up by 100% of wall height (4.5) from floor-aligned baseline

         const wallLeftNear = wallMesh.clone()
         wallLeftNear.rotation.y = Math.PI / 2;
         wallLeftNear.position.x = - 12;
         wallLeftNear.position.z = - 3.5;

         const wallLeftFar = wallMesh.clone()
         wallLeftFar.rotation.y = Math.PI / 2;
         wallLeftFar.position.x = - 12;
         wallLeftFar.position.z = - 9;

         const wallRightNear = wallMesh.clone()
         wallRightNear.rotation.y = - Math.PI / 2;
         wallRightNear.position.x = 12;
         wallRightNear.position.z = - 3.5;

         const wallRightFar = wallMesh.clone()
         wallRightFar.rotation.y = - Math.PI / 2;
         wallRightFar.position.x = 12;
         wallRightFar.position.z = - 9;

         wallMesh.matrixAutoUpdate = false;
         wallMesh.updateMatrix()

         walls.add(
            wallLeftNear,
            wallLeftFar,
            wallRightNear,
            wallRightFar,
         )


         // Screen (center main display)

         screenPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(16, 9),
            new THREE.MeshBasicMaterial({
               map: firstTexture,
            })
         )

         scene.add(screenPlane)

         screenPlane.scale.set(0.3, 0.3, 0.3)
         screenPlane.position.set(0, 0.16, 1.25)  // up 30% of screen height (0.81) from baseline


      } // createScreens()


      //


      sceneDummyScrollerHandler = () => {


         let transitionDuration = 2100;


         const numSlides = videoElements.length;
         const cooldown = transitionDuration + 100;

         currentIndex = 0;
         direction = 'down';
         isLocked = false;
         touchStartY = 0;


         //


         function preventDefaultScroll(e) {
            e.preventDefault()
         }


         function lockInput() {

            isLocked = true;

            w.addEventListener('wheel', preventDefaultScroll, { passive: false })
            w.addEventListener('touchmove', preventDefaultScroll, { passive: false })
            w.addEventListener('keydown', preventDefaultScroll, { passive: false })

            setTimeout(() => {

               isLocked = false;
               w.removeEventListener('wheel', preventDefaultScroll)
               w.removeEventListener('touchmove', preventDefaultScroll)
               w.removeEventListener('keydown', preventDefaultScroll)

            }, cooldown)

         } // lockInput()


         function trigger(dir) {

            if (isLocked) return;

            if (dir === 'down') {
               direction = 'down';
               currentIndex++;
               if (currentIndex >= numSlides) {
                  resetScreen();
                  lockInput();
                  return;
               }
            } else if (dir === 'up') {
               direction = 'up';
               currentIndex--;
               if (currentIndex < 0) {
                  goToSlide('up', numSlides);
                  lockInput();
                  return;
               }
            } else {
               return;
            }

            lockInput()

            updateScreen(direction, currentIndex + 1)

         } // trigger()


         //


         w.addEventListener('wheel', (e) => {

            if (isLocked || Math.abs(e.deltaY) < 10) return;
            trigger(e.deltaY > 0 ? 'down' : 'up')

         }, { passive: false })


         w.addEventListener('touchstart', (e) => {

            touchStartY = e.touches[0].clientY;

         }, { passive: true })


         w.addEventListener('touchend', (e) => {

            if (isLocked) return;

            const delta = touchStartY - e.changedTouches[0].clientY;

            if (Math.abs(delta) > 30) {
               trigger(delta > 0 ? 'down' : 'up')
            }

         }, { passive: true })


         w.addEventListener('keydown', (e) => {

            if (isLocked) return;

            if (e.code === 'Space') {

               e.preventDefault()
               trigger('down')

            }

         })


         //

         if (d.getElementById('cursor') !== null) {
            if (currentIndex == 0) {
               d.getElementById('cursor').classList.add('no-more-top')
            }
         }


         //


         updateScreen = (direction, index) => {


            let transitionSpeed = 2400;

            const cameraCompensationFactor = ((index - 1) * 0.33)


            //


            const previous = direction == 'down' ? index - 1 : index + 1;

            d.querySelectorAll('div[data-lab-slide="' + previous + '"').forEach(el => {
               el.classList.add('outgoing-' + direction);
               el.classList.remove('active');
            });

            d.querySelectorAll('div[data-lab-slide="' + index + '"').forEach(el => {
               el.classList.add('incoming-' + direction);
            });

            requestAnimationFrame(() => {
               setTimeout(() => {
                  d.querySelectorAll('div[data-lab-slide="' + index + '"').forEach(el => {
                     el.classList.add('active');
                  });
               }, 100)
            });


            //


            if (d.getElementById('cursor') !== null) {

               setTimeout(() => {

                  if ((index - 1) !== 0) {
                     d.getElementById('cursor').classList.remove('no-more-top')
                  } else {
                     d.getElementById('cursor').classList.add('no-more-top')
                  }

                  if (index == numSlides) {
                     d.getElementById('cursor').classList.add('no-more-bottom')
                  } else {
                     d.getElementById('cursor').classList.remove('no-more-bottom')
                  }

               }, 400)

            }


            //


            if (direction === 'down') {


               if (d.getElementById('cursor') !== null) {

                  d.getElementById('cursor').classList.add('highlight-direction-down')
                  setTimeout(() => {
                     d.getElementById('cursor').classList.remove('highlight-direction-down')
                  }, 200)

               }


               //


               new TWEEN.Tween({ z: screenPlane.position.z, o: 1 })
                  .to({ z: 4 - cameraCompensationFactor, o: 0 }, transitionSpeed * 0.4)
                  .delay(0)
                  .easing(TWEEN.Easing.Quintic.In)
                  .onUpdate(function (value) {

                     screenPlane.position.z = value.z;
                     screenPlane.material.opacity = value.o;

                  })
                  .start()

               new TWEEN.Tween({ z: -2 - cameraCompensationFactor, o: 0 })
                  .to({
                     z: 1 - cameraCompensationFactor, o: 1
                  }, transitionSpeed * 0.6)
                  .delay(transitionSpeed * 0.4)
                  .easing(TWEEN.Easing.Quintic.Out)
                  .onUpdate(function (value) {

                     screenPlane.position.z = value.z;
                     screenPlane.material.opacity = value.o;

                  })
                  .onStart(() => {

                     screenPlane.material.map = createVideoTexture(index - 1)
                     wallMaterial.map = createVideoTexture(index - 1)

                  })
                  .start()



               new TWEEN.Tween({ z: camera.position.z })
                  .to({ z: camera.position.z - 0.33, }, transitionSpeed)
                  .delay(0)
                  .easing(TWEEN.Easing.Quintic.InOut)
                  .onUpdate(function (value) {

                     camera.position.z = value.z;

                  })
                  .start()


            }

            if (direction === 'up') {


               if (d.getElementById('cursor') !== null) {

                  d.getElementById('cursor').classList.add('highlight-direction-up')
                  setTimeout(() => {
                     d.getElementById('cursor').classList.remove('highlight-direction-up')
                  }, 200)

               }


               //


               b.setAttribute('data-lab-slide', index)
               b.setAttribute('data-lab-dir', direction)


               //


               const nextIndex = index;

               d.querySelectorAll('div[data-lab-slide="' + nextIndex + '"').forEach(el => {
                  el.classList.add('incoming-up')
                  setTimeout(() => {
                     el.classList.remove('incoming-up')
                  }, 2000)
               })


               //


               new TWEEN.Tween({ z: screenPlane.position.z, o: 1 })
                  .to({ z: -2 - cameraCompensationFactor, o: 0 }, transitionSpeed * 0.4)
                  .delay(0)
                  .easing(TWEEN.Easing.Quintic.In)
                  .onUpdate(function (value) {

                     screenPlane.position.z = value.z;
                     screenPlane.material.opacity = value.o;

                  })
                  .start()

               new TWEEN.Tween({ z: 4 - cameraCompensationFactor, o: 0 })
                  .to({ z: 1 - cameraCompensationFactor, o: 1 }, transitionSpeed * 0.6)
                  .delay(transitionSpeed * 0.4)
                  .easing(TWEEN.Easing.Quintic.Out)
                  .onUpdate(function (value) {

                     screenPlane.position.z = value.z;
                     screenPlane.material.opacity = value.o;

                  })
                  .onStart(() => {

                     screenPlane.material.map = createVideoTexture(index - 1)
                     wallMaterial.map = createVideoTexture(index - 1)

                  })
                  .start()


               new TWEEN.Tween({ z: camera.position.z })
                  .to({ z: camera.position.z + 0.33, }, transitionSpeed)
                  .delay(0)
                  .easing(TWEEN.Easing.Quintic.InOut)
                  .onUpdate(function (value) {

                     camera.position.z = value.z;

                  })
                  .start()

            }

         } // updateScreen()


         //


      } // sceneDummyScrollerHandler()


      //


      goToSlide = (dir, index) => {
         const targetIndex = index - 1;
         const cameraZ = 5.5 - (targetIndex * 0.33);
         const screenZ = 1.25; // Base position

         currentIndex = targetIndex;
         direction = dir;

         // Instant jump for properties that shouldn't animate during reset
         camera.position.z = cameraZ;
         screenPlane.position.z = screenZ;

         screenPlane.material.map = createVideoTexture(currentIndex)
         wallMaterial.map = createVideoTexture(currentIndex)

         b.setAttribute('data-lab-slide', index)
         b.setAttribute('data-lab-dir', direction)

         d.querySelectorAll('div[data-lab-slide].active').forEach(el => {
            el.classList.remove('active')
         })
         d.querySelectorAll('div[data-lab-slide="' + index + '"]').forEach(el => {
            el.classList.add('active')
         })

         // Reset visual classes
         d.querySelectorAll('div[data-lab-slide]').forEach(el => {
            el.classList.remove('outgoing-down', 'outgoing-up', 'incoming-up', 'incoming-down')
         })
      };

      resetScreen = () => {
         console.log('reset')
         goToSlide('down', 1);
      } // resetScreen


      //


      function createFloor() {


         const distortionMapTexture = './textures/ground_normal_2.jpg';


         textureLoader.load(

            distortionMapTexture,

            (distortionMap) => {

               distortionMap.wrapS = distortionMap.wrapT = THREE.RepeatWrapping;
               distortionMap.repeat.set(20, 20)


               //


               const reflectiveSurfaceGeometry = new THREE.PlaneGeometry(40, 40)


               //


               const reflectiveSurface = new THREE.Mesh(reflectiveSurfaceGeometry)


               //


               const reflectiveSurfaceMap = textureLoader.load('./textures/diffuse.jpg')
               reflectiveSurfaceMap.wrapS = reflectiveSurfaceMap.wrapT = THREE.RepeatWrapping;
               reflectiveSurfaceMap.repeat.set(20, 20)

               reflectiveSurfaceMap.colorSpace = THREE.SRGBColorSpace;


               //


               const reflectiveSurfaceNormalMap = distortionMap;


               //


               const reflectiveSurfaceMaterial = new ReflectiveMaterial({


                  // MeshStandardMaterial Properties

                  color: 0x444444,
                  map: reflectiveSurfaceMap,

                  normalMap: reflectiveSurfaceNormalMap,
                  normalScale: new THREE.Vector2(-1, -1),

                  metalness: 0.2,
                  roughness: 1,


                  // Additional Reflective Material Properties

                  distortionMap: distortionMap,
                  reflectionStrength: 0.2,
                  distortionScale: 0.1,
                  reflectionResolution: 2048,


               }, reflectiveSurface)


               //


               reflectiveSurface.material = reflectiveSurfaceMaterial;


               //


               reflectiveSurface.rotation.x = - Math.PI / 2;

               reflectiveSurface.position.set(0, -2, 0)


               //


               scene.add(reflectiveSurface)


               //


               reflectiveSurface.matrixAutoUpdate = false;
               reflectiveSurface.updateMatrix()


            })


      } // createFloor()


      //


      function createGirders() {

         loadGirders = new Promise((resolve) => {
            gltfLoader.load('./models/girders.glb',
               function (gltf) {
                  const girders = gltf.scene;

                  // Position at floor level (floor is at Y=-2)
                  girders.scale.set(1, 1, 1)
                  girders.position.set(0, -2, 0)
                  girders.rotation.set(0, 0, 0)

                  scene.add(girders)

                  const girderMaterial = new THREE.MeshStandardMaterial({
                     color: 0x424242,
                     metalness: 0,
                     roughness: 1

                  })

                  const mannequinsMaterial = new THREE.MeshStandardMaterial({
                     color: 0x000000,
                     emissive: 0x088888,
                     emissiveIntensity: 0.033,
                     metalness: 0.9,
                     roughness: 0.1,
                  })

                  girders.traverse(function (child) {

                     if (child instanceof THREE.Mesh) {

                        child.material = girderMaterial;

                        if (child.name.indexOf('mannequin') == 0) child.material = mannequinsMaterial;

                        child.matrixAutoUpdate = false;
                        child.updateMatrix()

                     }

                  })

                  resolve()
               },
               undefined,
               error => {
                  console.warn("Girders GLB load failed, scene structure may be missing", error);
                  resolve(); // Don't block loading
               }
            )
         })

      } // createGirders()


      //


      setupScene()


      //


      createScreens()
      createFloor()
      createGirders()


      //


      setTimeout(() => sceneDummyScrollerHandler(), globalTransitionDuration * 6 + 100)


      //


      let HDMode = false;

      function setHDMode() {

         HDMode = !HDMode;

         const targetDPR = HDMode
            ? Math.min(3, w.devicePixelRatio * 2)
            : originalPixelRatio

         renderer.setPixelRatio(targetDPR)
         renderer.setSize(w.innerWidth, w.innerHeight, false)

         d.getElementById('hd-ind').innerText = HDMode ? 'Açık' : 'Kapalı';

      }

      w.addEventListener('keydown', e => {

         if (e.key.toLowerCase() === 'h') {
            setHDMode()
         }

      })


      //


      w.addEventListener('resize', onWindowResize)


   } // initScene()


   //


   function onWindowResize() {


      // Update Camera

      camera.aspect = w.innerWidth / w.innerHeight;
      camera.updateProjectionMatrix()


      // Update Renderer

      renderer.setSize(w.innerWidth, w.innerHeight)


      //


      isSmall = w.matchMedia('(max-width: 932px)').matches;
      fovAdjustement = isSmall ? 40 : 0;


   } // onWindowResize()


   //


   animate = () => {


      if (stats) stats.begin()


      //


      if (!b.classList.contains('open-navigation') && !isHandheld) {


         camera.position.x -= (mouse.x + camera.position.x) * .05;
         camera.position.y += (- mouse.y - camera.position.y) * .05;

         camera.lookAt(
            scene.position.x,
            scene.position.y,
            scene.position.z + camera.position.z - 2
         )


      }


      //


      TWEEN.update()


      //


      renderer.render(scene, camera)


      //


      if (stats) stats.end()


   } // animate()


   //


   // Wrap all load promises
   sceneReady = Promise.all([

      loadHDR,
      loadGirders,

   ])


   //


   labRenderControl = renderLoop(animate, 60)


   //


   loadingManager.onLoad = function () {


      let warmups = 0; // warm up shader compilation on chrome

      function warmup() {

         renderer.render(scene, camera)
         if (++warmups < 3) {
            requestAnimationFrame(warmup)
         }

      }


      // THREE Assets Ready         

      sceneReady.then(() => {

         renderer.compile(scene, camera)

         //

         warmup()

         //

         labRenderControl.start()

         // Wait for first video to be ready before calling onReady
         const resolveReady = () => {
            if (typeof onReadyCallback === 'function') {
               requestAnimationFrame(() => onReadyCallback())
            }
         };

         const checkVideoReady = () => {
            const firstVid = videoElements[0];
            if (firstVid && firstVid.readyState >= 3) { // HAVE_FUTURE_DATA
               resolveReady();
            } else if (firstVid) {
               firstVid.addEventListener('canplay', resolveReady, { once: true });
               // Fallback timeout in case video fails to load
               setTimeout(resolveReady, 5000);
            } else {
               resolveReady();
            }
         };

         // Slight delay to ensure textures are bound
         setTimeout(checkVideoReady, 500);

      })


      //


      d.addEventListener('visibilitychange', () => {

         if (d.hidden) {

            setTimeout(() => labRenderControl.stop(), 2000)
            // console.log('Tab Unfocused')

         } else {

            labRenderControl.start()
            // console.log('Tab Focused')

         }

      })


   };


   //


   initScene()


   //


   startRender = () => {

      labRenderControl.start()


      // console.log('Lab Scene Render: Starting')

   } // startRender()


   //


   stopRender = () => {

      if (sceneDummyScroller) sceneDummyScroller.slideTo(0, 10)

      labSceneContainer.style.filter = 'blur(0px)';

      //

      resetScreen()

      //

      setTimeout(() => {

         labRenderControl.stop()

      }, globalTransitionDuration * 2)


      // console.log('Lab Scene Render: Stopping')

   } // stopRender()


   //


   pause = () => {


      const pauseTween = new TWEEN.Tween({ fov: camera.fov, b: 0, o: 1 })

         .to({ fov: 84 + fovAdjustement, b: 8, o: 0.6 }, globalTransitionDuration * 4)
         .delay(0)
         .easing(TWEEN.Easing.Cubic.Out)
         .onUpdate(function (value) {

            camera.fov = value.fov;
            camera.updateProjectionMatrix()

            labSceneContainer.style.filter = 'blur(' + value.b + 'px)';
            labSceneContainer.style.opacity = value.o;

         })
         .onStart()

      setTimeout(() => {


         labRenderControl.stop()
         // console.log('Lab Scene Render: Stopping')

      }, globalTransitionDuration * 4)


      pauseTween.start()


   } // pause()


   //


   resume = () => {


      labRenderControl.start()
      // console.log('Lab Scene Render: Starting')


      const resumeTween = new TWEEN.Tween({ fov: camera.fov, b: 8, o: 0.2 })

         .to({ fov: 80 + fovAdjustement, b: 0, o: 1 }, globalTransitionDuration * 4)
         .delay(0)
         .easing(TWEEN.Easing.Cubic.InOut)
         .onUpdate(function (value) {

            camera.fov = value.fov;
            camera.updateProjectionMatrix()

            labSceneContainer.style.filter = 'blur(' + value.b + 'px)';
            labSceneContainer.style.opacity = value.o;

         })
         .onStart()

      requestAnimationFrame(() => {
         resumeTween.start()
      })


   } // resume()


   //


   intro = () => {


      resetScreen()


      if (d.getElementById('cursor') !== null)
         d.getElementById('cursor').classList.add('no-more-top')


      labSceneContainer.style.visibility = 'visible';


      introTween = new TWEEN.Tween({ fov: 60 + fovAdjustement, z: 12 })

         .to({ fov: 80 + fovAdjustement, z: 5.5 }, globalTransitionDuration * 6)
         .delay(0)
         .easing(TWEEN.Easing.Quintic.Out)
         .onUpdate(function (value) {

            camera.fov = value.fov;
            camera.position.z = value.z;
            camera.updateProjectionMatrix()

            // console.log('Intro: ' + camera.fov, camera.position.z)

         })
         .onStart()

      introOpacityTween = new TWEEN.Tween({ o: 0 })

         .to({ o: 1 }, globalTransitionDuration * 4)
         .delay(0)
         .easing(TWEEN.Easing.Linear.None)
         .onUpdate(function (value) {

            labSceneContainer.style.opacity = value.o;

         })
         .onStart()


      introTween.start()
      introOpacityTween.start()


   } // intro()


   //


   outro = () => {


      introTween.stop()
      introOpacityTween.stop()


      outroTween = new TWEEN.Tween({ fov: camera.fov, z: camera.position.z })

         .to({ fov: 55 + fovAdjustement, z: camera.position.z + 5 }, globalTransitionDuration * 4)
         .delay(0)
         .easing(TWEEN.Easing.Quintic.InOut)
         .onUpdate(function (value) {

            camera.fov = value.fov;
            camera.position.z = value.z;
            camera.updateProjectionMatrix()


            // console.log('Outro: ' + camera.fov, camera.position.z)

         })
         .onStart()

      outroOpacityTween = new TWEEN.Tween({ o: labSceneContainer.style.opacity })

         .to({ o: 0 }, globalTransitionDuration * 4)
         .delay(0)
         .easing(TWEEN.Easing.Quintic.InOut)
         .onUpdate(function (value) {

            labSceneContainer.style.opacity = value.o;

         })
         .onStart()


      outroTween.start()
      outroOpacityTween.start()


      setTimeout(() => {

         resetScreen()


         labSceneContainer.style.visibility = 'hidden';

      }, globalTransitionDuration * 4)


   } // outro()


   //


   return {
      startRender,
      stopRender,
      pause,
      resume,
      intro,
      outro,
   }


} // LabScene()

export default LabScene;