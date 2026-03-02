import * as THREE from 'three';

// Utils

import { renderLoop } from './FPSCap.js';

// Loaders

import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

//

import CameraPath from './CameraPath.js';
import { ReflectiveMaterial } from './ReflectiveMaterial.js';
import Lensflare from './Lensflare.js';

//

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { LUTPass } from 'three/addons/postprocessing/LUTPass.js';
import { LUTCubeLoader } from 'three/addons/loaders/LUTCubeLoader.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

//

import TWEEN from 'three/addons/libs/tween.module.js';



"use strict";


// Global Aliases

const d = document;
const de = d.documentElement;
const w = window;
const b = d.body;


//


let animate, homeRenderControl, traverse, globalTransitionDuration;


// THREE Aliases

let renderer, composer, scene, camera, stats, sceneDummyScroller, sceneDummyScrollerHandler;

let startRender, stopRender, pause, resume, intro, outro;

let introTween, introOpacityTween, outroTween, outroOpacityTween;


//


let chromaticAbborationPass,
   motionBlurPass,
   getCameraSpeed,
   updateFX,
   cameraPath,
   cameraPathSettings,
   mannequins,
   shards,
   cubeEnvMap,
   cubeEnvMapDark,
   lensflare,
   tweenDown,
   tweenUp,
   updatePosition,
   snapToPosition,
   trigger,
   isLocked;


let traversalPosition = 0;
let traversalDuration = 2400;


//


let currentIndex = 0;
let direction = 'down';
const numSlides = 5;
isLocked = false;
const cooldown = traversalDuration;
let touchStartY = 0;
let touchPreventPull;


//


let frameCount = 0;
let dprReady = false;

let fxToggleTime = 0;
const fxDelay = 100; // ms
let fxState = false;
let lastSpeedAboveThreshold = false;



// Loaders

const loadingManager = THREE.DefaultLoadingManager;

const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('./draco/gltf/')

const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

// const rgbeLoader = new RGBELoader()

const textureLoader = new THREE.TextureLoader()
const cubeTextureLoader = new THREE.CubeTextureLoader()


//


const homeSceneContainer = d.getElementById('home-scene-container')


//


const isHandheldCheck = () => /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
const isHandheld = isHandheldCheck()
const isSmall = w.matchMedia('(max-width: 1280px)').matches;

const isFirefox = navigator.userAgent.toLowerCase().includes('firefox')
b.setAttribute('data-ff', isFirefox)


//


const HomeScene = (onReadyCallback) => {


   if (!homeSceneContainer) return;


   //


   let loadMannequins, loadShards, sceneReady;


   //


   globalTransitionDuration = parseFloat(getComputedStyle(de).getPropertyValue('--global'))


   //


   function initScene() {


      function setupScene() {


         renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" })

         renderer.setPixelRatio(w.devicePixelRatio);
         renderer.setSize(w.innerWidth, w.innerHeight)

         renderer.toneMapping = THREE.ACESFilmicToneMapping;

         // renderer.toneMappingExposure = isHandheld ? 0.75 : 1.25;
         renderer.toneMappingExposure = 1.5;

         renderer.outputColorSpace = THREE.SRGBColorSpace;

         renderer.autoClear = false;

         homeSceneContainer.appendChild(renderer.domElement)


         //


         scene = new THREE.Scene()


         //


         scene.fog = new THREE.FogExp2(0x010101, 0.05)


         //


         camera = new THREE.PerspectiveCamera(50, w.innerWidth / w.innerHeight, 0.1, 100)
         camera.position.z = 5;


         //


         // stats = new EnhancedStats(renderer, scene)
         // b.appendChild(stats.dom)


         //


         // gui = new GUI().close()


         //



         const urls = [
            './textures/cube/standard/px.png',
            './textures/cube/standard/nx.png',
            './textures/cube/standard/py.png',
            './textures/cube/standard/ny.png',
            './textures/cube/standard/pz.png',
            './textures/cube/standard/nz.png'
         ];

         cubeEnvMap = cubeTextureLoader.load(urls)
         cubeEnvMap.flipY = true;

         const urlsDark = [
            './textures/cube/dark/px.png',
            './textures/cube/dark/nx.png',
            './textures/cube/dark/py.png',
            './textures/cube/dark/ny.png',
            './textures/cube/dark/pz.png',
            './textures/cube/dark/nz.png'
         ];

         cubeEnvMapDark = cubeTextureLoader.load(urlsDark)
         cubeEnvMapDark.flipY = true;


      } // setupScene()


      //


      function initCameraPath() {


         // Initialize Camera Path

         cameraPathSettings = {

            path: './paths/camera-path.glb',
            lookAtPath: './paths/lookat-path.glb',

            useLookAtPath: true,

            reversePath: false,
            reverseLookAtPath: false,


            //


            positionSmoothing: 0.08,
            rotationSmoothing: 0.1,


            //


            // positionOffset: deviceType == "mobile" ? { x: -0.5, y: 0, z: 2.5 } : { x: 0, y: 0, z: 2 },

            positionOffset: { x: 0, y: 0, z: 2 },
            rotationOffset: { x: 0, y: 1, z: 1 },


            //


            startSegment: 0,


            //


            debug: {

               log: false,

               visualise: {

                  mesh: false,
                  steps: false,
                  axes: false,

                  lookAtSteps: false,

               },

            },

            dracoDecoderPath: './draco/gltf/',

         }


         cameraPath = new CameraPath(scene, camera, cameraPathSettings)


      } // initCameraPath()         


      //


      sceneDummyScrollerHandler = () => {


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


         trigger = (dir) => {

            if (isLocked || b.getAttribute('data-current') !== 'home') return;

            if (dir === 'down' && currentIndex < numSlides - 1) {
               direction = 'down';
               currentIndex++;
            } else if (dir === 'up' && currentIndex > 0) {
               direction = 'up';
               currentIndex--;
            } else {
               return;
            }

            lockInput()

            updatePosition(direction, currentIndex + 1, false)

         } // trigger()


         //


         w.addEventListener('wheel', (e) => {

            if (isLocked || Math.abs(e.deltaY) < 10) return;
            trigger(e.deltaY > 0 ? 'down' : 'up')

            // console. log('HS: Wheel')

         }, { passive: false })


         w.addEventListener('touchstart', (e) => {

            touchStartY = e.touches[0].clientY

            const scrollTop = de.scrollTop || b.scrollTop

            if (scrollTop === 0) {
               touchPreventPull = true
            } else {
               touchPreventPull = false
            }

            // console. log('HS: Touchstart')

         }, { passive: true })


         w.addEventListener('touchmove', (e) => {
            if (touchPreventPull && e.touches[0].clientY > touchStartY) {
               e.preventDefault()
            }

            // console. log('HS: Touchmove')

         }, { passive: false })


         w.addEventListener('touchend', (e) => {

            if (isLocked) return;

            const delta = touchStartY - e.changedTouches[0].clientY;

            if (Math.abs(delta) > 30) {
               trigger(delta > 0 ? 'down' : 'up')
            }

            // console. log('HS: Touchend')

         }, { passive: true })


         w.addEventListener('keydown', (e) => {

            if (isLocked) return;

            if (e.code === 'Space') {

               e.preventDefault()
               trigger('down')

            }

            // console. log('HS: Keydown')

         })


         //


         if (currentIndex == 0 && d.getElementById('cursor') !== null) {
            d.getElementById('cursor').classList.add('no-more-top')
         }


         //


         d.getElementById('scene-trigger').addEventListener('click', () => {

            trigger('down')

         })


         //


         updatePosition = (direction, index, instant) => {


            //


            b.classList.add('hide-slide')
            b.setAttribute('data-current-slide', index)
            setTimeout(() => {
               b.classList.remove('reveal-slide')
               b.classList.remove('hide-slide')
            }, 100)

            setTimeout(() => {
               b.classList.add('reveal-slide')
            }, traversalDuration / 2)


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


               if (tweenUp) tweenUp.stop()

               tweenDown = new TWEEN.Tween({ s: traversalPosition })
                  .to({ s: (0.25 * (index - 1)) }, instant ? 0 : traversalDuration)
                  .delay(0)
                  .easing(TWEEN.Easing.Quintic.Out)
                  .onUpdate(function (value) {

                     traversalPosition = value.s;
                     traverse(value.s, true, false)

                     // console.log(traversalPosition)

                  })
                  .start()
                  .onComplete()

            }

            if (direction === 'up') {


               if (d.getElementById('cursor') !== null) {

                  d.getElementById('cursor').classList.add('highlight-direction-up')
                  setTimeout(() => {
                     d.getElementById('cursor').classList.remove('highlight-direction-up')
                  }, 200)

               }


               if (tweenDown) tweenDown.stop()

               tweenDown = new TWEEN.Tween({ s: traversalPosition })
                  .to({ s: (0.25 * (index - 1)) }, instant ? 0 : traversalDuration)
                  .delay(0)
                  .easing(TWEEN.Easing.Cubic.Out)
                  .onUpdate(function (value) {

                     traversalPosition = value.s;
                     traverse(value.s, true, false)

                     // console.log(traversalPosition)

                  })
                  .start()

            }


         } // updatePosition()


         //


      } // sceneDummyScrollerHandler()


      //



      snapToPosition = (position) => {

         if (tweenUp) tweenUp.stop()
         if (tweenDown) tweenDown.stop()

         currentIndex = (position - 1);
         traversalPosition = 0.25 * (position - 1);
         cameraPath.traversePath(traversalPosition, true, true)
         b.setAttribute('data-current-slide', position)

         isLocked = true;

      } // snapToPosition()         


      //


      function createMannequins() {


         loadMannequins = new Promise((resolve) => {


            const mannaquinsPath = isSmall ? './models/mannequins-mob.glb' : './models/mannequins.glb';


            gltfLoader.load(mannaquinsPath, function (gltf) {

               mannequins = gltf.scene;

               mannequins.scale.set(1, 1, 1)
               mannequins.position.set(48, 0, 0)
               mannequins.rotation.set(0, 0, 0)

               scene.add(mannequins)

               const mannequinsMaterial = new THREE.MeshPhongMaterial({

                  color: 0x000000,
                  emissive: 0x050505,
                  specular: 0x111111,
                  reflectivity: 0.9,
                  shininess: 1000,
                  envMap: cubeEnvMapDark,
                  combine: THREE.AddOperation,

               })

               mannequins.traverse(function (child) {

                  if (child instanceof THREE.Mesh) {

                     child.frustumCulled = true;

                     child.material = mannequinsMaterial;

                  }

               })

               resolve()

            })

         })


      } // createMannequins()


      //


      function createShards() {


         loadShards = new Promise((resolve) => {

            gltfLoader.load('./models/shards.glb', function (gltf) {

               shards = gltf.scene;

               shards.position.set(0, 0, 0)
               shards.scale.set(1, 1, 1)

               scene.add(shards)

               //

               const shardMaterial = new THREE.MeshStandardMaterial({

                  color: 0xFFFFFF,
                  roughness: 0.03,
                  metalness: 1,

                  envMap: cubeEnvMapDark,
                  envMapIntensity: 1,

                  transparent: true,
                  opacity: 0.1,

                  side: THREE.DoubleSide,
                  depthWrite: false,
                  alphaTest: 0.0001,

               })

               shards.traverse(function (child) {

                  if (child instanceof THREE.Mesh) {

                     child.material = shardMaterial;

                  }

               })

               resolve()

            })

         })


      } // createShards()      


      //



      function createGround() {


         const normalMap = textureLoader.load("./textures/asphalt_track_nor_gl_2k.jpg")
         normalMap.wrapS = THREE.RepeatWrapping; normalMap.wrapT = THREE.RepeatWrapping;
         normalMap.repeat.set(100, 100)

         //

         const groundPlane = new THREE.Mesh(new THREE.PlaneGeometry(1500, 1500, 1, 1))

         const groundPlaneMaterial = new ReflectiveMaterial({

            color: 0x777777,
            emissive: 0x000000,

            normalMap: normalMap,
            normalScale: new THREE.Vector2(-10, -10),

            envMap: cubeEnvMap,
            envMapIntensity: 1,

            roughness: 1,
            metalness: 0,

            reflectionStrength: 0.75,
            reflectionResolution: 512,
            distortionMap: normalMap,
            distortionScale: 0.05,

         }, groundPlane)

         groundPlane.material = groundPlaneMaterial;


         groundPlane.rotation.x = - Math.PI / 2;
         groundPlane.position.y = 0;

         scene.add(groundPlane)


      } // createGround()


      //


      function lensflareHandler() {

         lensflare = Lensflare(scene, camera);

      } // lensflareHandler()


      //


      function postProcessing() {


         // Composer

         composer = new EffectComposer(renderer)

         const renderPass = new RenderPass(scene, camera)
         composer.addPass(renderPass)


         //


         function initChromaticAbborationPass() {


            // Chromatic Abboration

            const chromaticAbborationShader = {

               uniforms: {

                  'tDiffuse': { value: null },
                  'rOffset': { value: 0.0 },
                  'gOffset': { value: 0.0 },
                  'bOffset': { value: 0.0 },
               },

               vertexShader: /* glsl */`
            
                     uniform sampler2D tDiffuse;
                     varying vec2 vUv;
            
                     varying float rOffset;
                     varying float gOffset;
                     varying float bOffset;
            
                     void main() {
            
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            
                     }`,

               fragmentShader: /* glsl */`
            
                     #include <common>
            
                        uniform sampler2D tDiffuse;
                        varying vec2 vUv;
            
                        uniform float rOffset;
                        uniform float gOffset;
                        uniform float bOffset;
            
                        void main() {
            
                           // Sample the input texture
            
                           vec3 color = texture2D(tDiffuse, vUv).rgb;
            
            
                           // Apply chromatic aberration by offsetting each channel
            
                           vec3 finalColor;
                           finalColor.r = texture2D(tDiffuse, vUv + vec2(rOffset, 0.0)).r;
                           finalColor.g = texture2D(tDiffuse, vUv + vec2(0.0, gOffset)).g;
                           finalColor.b = texture2D(tDiffuse, vUv + vec2(0.0, bOffset)).b;
            
            
                           // Output the final color
            
                           gl_FragColor = vec4(finalColor, 1.0);
            
                     }
                     `

            }

            chromaticAbborationPass = new ShaderPass(chromaticAbborationShader)
            composer.addPass(chromaticAbborationPass)

            chromaticAbborationPass.enabled = false;

         } // initChromaticAbborationPass()


         //


         function initLUTPass() {


            // LUT Pass

            const lutLoader = new LUTCubeLoader()
            const lutPass = new LUTPass()

            lutPass.intensity = 0.95;

            lutPass.enabled = true;

            lutLoader.load('./lut/Landscape5.cube', function (loadedLUT) {
               lutPass.lut = loadedLUT.texture3D;
            })

            composer.addPass(lutPass)


         } // initLUTPass()


         //


         function initMotionBlurPass() {


            // Motion Blur

            const motionBlurShader = {

               uniforms: {

                  'tDiffuse': { value: null },
                  'v': { value: 0.0 }

               },

               vertexShader: /* glsl */`
            
                     varying vec2 vUv;
            
                     void main() {
            
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            
                     }`,

               fragmentShader: /* glsl */`
            
                     uniform sampler2D tDiffuse;
                     uniform float v;
                     varying float s;
                     varying vec2 vUv;
            
                     void main() {
            
                        float s = v / 2048.0;
            
                        vec4 sum = vec4( 0.0 );
            
                        sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 4.0 * s ) ) * 0.051;
                        sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 3.0 * s ) ) * 0.0918;
                        sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 2.0 * s ) ) * 0.12245;
                        sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 1.0 * s ) ) * 0.1531;
                        sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y ) ) * 0.1633;
                        sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 1.0 * s ) ) * 0.1531;
                        sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 2.0 * s ) ) * 0.12245;
                        sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 3.0 * s ) ) * 0.0918;
                        sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 4.0 * s ) ) * 0.051;
            
                        gl_FragColor = sum;
            
                     }`

            }

            motionBlurPass = new ShaderPass(motionBlurShader)
            composer.addPass(motionBlurPass)

            motionBlurPass.enabled = false;

         } // initMotionBlurPass()


         //


         function initOutputPass() {


            // Output Pass

            const outputPass = new OutputPass()
            composer.addPass(outputPass)


         } // initOutputPass()


         //


         initChromaticAbborationPass()
         initLUTPass()
         initMotionBlurPass()
         initOutputPass()


         //


         let prevCameraPosition = new THREE.Vector3();
         let prevFrameTime = performance.now();


         //


         getCameraSpeed = (camera) => {

            const currFrameTime = performance.now();
            const deltaTime = (currFrameTime - prevFrameTime) / 1000; // Convert to seconds
            const currentPosition = camera.position.clone();

            // Calculate distance between current and previous positions
            const distance = currentPosition.distanceTo(prevCameraPosition);

            // Calculate speed as distance divided by time
            const speed = distance / deltaTime;

            // Update previous position and time for next frame
            prevCameraPosition.copy(currentPosition);
            prevFrameTime = currFrameTime;

            return speed;

         } // getCameraSpeed()


         //


         updateFX = (cameraSpeed) => {

            const motionThreshold = 0.1;

            motionBlurPass.enabled = cameraSpeed > motionThreshold;
            chromaticAbborationPass.enabled = cameraSpeed > motionThreshold;

            motionBlurPass.uniforms.v.value = cameraSpeed * 0.3;

            chromaticAbborationPass.uniforms.rOffset.value = cameraSpeed * 0.0003 * 5;
            chromaticAbborationPass.uniforms.bOffset.value = cameraSpeed * 0.0004 * 5;

         } // updateFX()


      } // postProcessing()         


      //


      setupScene()
      initCameraPath()
      createMannequins()
      createShards()
      createGround()
      postProcessing()
      lensflareHandler()


      //


      setTimeout(() => sceneDummyScrollerHandler(), globalTransitionDuration * 6 + 100)


      //


      w.addEventListener('resize', onWindowResize)


   } // init()


   //


   function onWindowResize() {

      const width = w.innerWidth;
      const height = w.innerHeight;

      if (camera) {
         camera.aspect = width / height;
         camera.updateProjectionMatrix();
      }

      if (renderer) renderer.setSize(width, height);

      if (composer) composer.setSize(width, height);

   } // onWindowResize()


   //


   animate = () => {


      if (stats) stats.begin()


      //


      if (!dprReady && frameCount++ > 2) {

         renderer.setPixelRatio(window.devicePixelRatio * 0.8);
         renderer.setSize(w.innerWidth, w.innerHeight);
         dprReady = true;

      }


      //


      if (!isFirefox) {


         const cameraSpeed = getCameraSpeed(camera);
         const now = performance.now();
         const speedAbove = cameraSpeed >= 0.005;

         if (speedAbove !== lastSpeedAboveThreshold) {
            fxToggleTime = now;
            lastSpeedAboveThreshold = speedAbove;
         }

         if (now - fxToggleTime > fxDelay) {
            if (speedAbove && !fxState) {
               fxState = true;
               motionBlurPass.enabled = true;
               chromaticAbborationPass.enabled = true;
            } else if (!speedAbove && fxState) {
               fxState = false;
               motionBlurPass.enabled = false;
               chromaticAbborationPass.enabled = false;
               motionBlurPass.uniforms.v.value = 0;
               chromaticAbborationPass.uniforms.rOffset.value = 0;
               chromaticAbborationPass.uniforms.bOffset.value = 0;
            }
         }

         if (fxState) updateFX(cameraSpeed);


      }


      //


      if (lensflare) lensflare.updateLensflare()

      if (lensflare && camera.position.z > 20) {
         lensflare.show()
      } else {
         lensflare.hide()
      }


      //


      TWEEN.update()


      //


      // renderer.render(scene, camera)
      composer.render()


      //


      if (stats) stats.end()


   } // animate()


   //


   traverse = (traversalValue) => {

      if (cameraPath) cameraPath.traversePath(traversalValue, true, false) // Traverse

   } // traverse()


   //


   // Wrap all load promises
   sceneReady = Promise.all([

      loadMannequins,
      loadShards,

   ])


   //


   homeRenderControl = renderLoop(animate, 60)


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


         homeRenderControl.start()


         //




         //


         if (typeof onReadyCallback === 'function') {

            requestAnimationFrame(() => onReadyCallback())

         }


      })


      //


      d.addEventListener('visibilitychange', () => {

         if (d.hidden) {

            setTimeout(() => homeRenderControl.stop(), 2000)
            // console.log('Tab Unfocused')

         } else {

            homeRenderControl.start()
            // console.log('Tab Focused')

         }

      })


   };


   //


   initScene()


   //


   startRender = () => {

      homeRenderControl.start()

      // console.log('Home Scene Render: Starting')

   } // startRender()


   //


   stopRender = () => {

      if (sceneDummyScroller) sceneDummyScroller.slideTo(0, 10)

      homeSceneContainer.style.filter = 'blur(0px)';

      snapToPosition(1)

      requestAnimationFrame(() => {
         homeRenderControl.stop()
      })

      // console.log('Home Scene Render: Stopping')

   } // stopRender()


   //


   pause = () => {


      const pauseTween = new TWEEN.Tween({ fov: camera.fov, b: 0, o: 1 })

         .to({ fov: isSmall ? 94 : 54, b: 8, o: 0.9 }, globalTransitionDuration * 4)
         .delay(0)
         .easing(TWEEN.Easing.Cubic.Out)
         .onUpdate(function (value) {

            camera.fov = value.fov;
            camera.updateProjectionMatrix()

            homeSceneContainer.style.filter = 'blur(' + value.b + 'px)';
            homeSceneContainer.style.opacity = value.o;

         })
         .onStart()

      setTimeout(() => {

         homeRenderControl.stop()
         // console.log('Home Scene Render: Stopping')

      }, globalTransitionDuration * 4)


      pauseTween.start()


   } // pause()


   //


   resume = () => {


      homeRenderControl.start()
      // console.log('Home Scene Render: Starting')


      const resumeTween = new TWEEN.Tween({ fov: camera.fov, b: 8, o: homeSceneContainer.style.opacity })

         .to({ fov: isSmall ? 90 : 50, b: 0, o: 1 }, globalTransitionDuration * 4)
         .delay(0)
         .easing(TWEEN.Easing.Cubic.InOut)
         .onUpdate(function (value) {

            camera.fov = value.fov;
            camera.updateProjectionMatrix()

            homeSceneContainer.style.filter = 'blur(' + value.b + 'px)';
            homeSceneContainer.style.opacity = value.o;

         })
         .onStart()

      requestAnimationFrame(() => {
         resumeTween.start()
      })


   } // resume()


   //


   intro = () => {


      if (d.getElementById('cursor') !== null)
         d.getElementById('cursor').classList.add('no-more-top')

      snapToPosition(1)
      isLocked = false;


      homeSceneContainer.style.visibility = 'visible';


      introTween = new TWEEN.Tween({ fov: isSmall ? 86 : 34, mPos: 2 })

         .to({ fov: isSmall ? 90 : 50, mPos: 0 }, globalTransitionDuration * 4)
         .delay(0)
         .easing(TWEEN.Easing.Exponential.Out)
         .onUpdate(function (value) {

            camera.fov = value.fov;
            camera.updateProjectionMatrix()

            mannequins.position.y = value.mPos;

         })
         .onStart()

      introOpacityTween = new TWEEN.Tween({ o: 0 })

         .to({ o: 1 }, globalTransitionDuration * 3)
         .delay(0)
         .easing(TWEEN.Easing.Linear.None)
         .onUpdate(function (value) {

            homeSceneContainer.style.opacity = value.o;

         })
         .onStart()


      introTween.start()
      introOpacityTween.start()


   } // intro()


   //


   outro = () => {


      introTween.stop()
      introOpacityTween.stop()


      //


      outroTween = new TWEEN.Tween({ fov: camera.fov, mPos: 0 })

         .to({ fov: isSmall ? 90 : 40, mPos: 14 }, globalTransitionDuration * 4)
         .delay(0)
         .easing(TWEEN.Easing.Quintic.InOut)
         .onUpdate(function (value) {

            camera.fov = value.fov;
            camera.updateProjectionMatrix()

            mannequins.position.y = value.mPos;

         })
         .onStart()

      outroOpacityTween = new TWEEN.Tween({ o: homeSceneContainer.style.opacity })

         .to({ o: 0 }, globalTransitionDuration * 4)
         .delay(0)
         .easing(TWEEN.Easing.Quintic.InOut)
         .onUpdate(function (value) {

            homeSceneContainer.style.opacity = value.o;

         })
         .onStart()


      outroTween.start()
      outroOpacityTween.start()

      setTimeout(() => {

         homeSceneContainer.style.visibility = 'hidden';

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


} // HomeScene()

export default HomeScene;