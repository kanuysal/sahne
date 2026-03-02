import {
   Mesh,
   MeshBasicMaterial,
   Vector3,
   Quaternion,
   Group,
   SphereGeometry,
   BoxGeometry,
   AxesHelper,
   MathUtils,
   LoadingManager
} from 'three';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

class CameraPath {

   constructor(scene, camera, settings) {


      // Default Settings

      this.settings = {

         path: '',
         lookAtPath: '',

         useLookAtPath: false,

         reversePath: false,
         reverseLookAtPath: false,

         //

         positionSmoothing: 0.05,
         rotationSmoothing: 0.05,

         //

         positionOffset: { x: 0, y: 0.1, z: 0 },
         rotationOffset: { x: 0, y: 0, z: 0 },

         //

         startSegment: 0,

         //

         debug: {

            log: true,

            visualise: {

               mesh: true,
               steps: true,
               axes: false,

               lookAtSteps: true,

            },

         },

         dracoDecoderPath: './assets/draco/gltf/',

         ...settings

      };


      // Scene

      this.scene = scene;
      this.camera = camera;


      // Array Vars

      this.pathPositions = [];
      this.pathQuaternions = [];

      this.lookAtPositions = [];


      // Loaders

      this.loadingManager = new LoadingManager();

      this.dracoLoader = new DRACOLoader()
      this.dracoLoader.setDecoderPath(this.settings.dracoDecoderPath)

      this.loader = new GLTFLoader(this.loadingManager)
      this.loader.setDRACOLoader(this.dracoLoader)


      // Models / Meshes

      this.pathModel;
      this.pathMesh;
      this.lookAtPathModel;
      this.lookAtPathMesh;


      // Expose Init

      this.pathInitialized = false;


      //


      this.initCameraPath();


   } // constructor()


   initCameraPath() {


      // On Start Loading

      this.loadingManager.onStart = () => {

         if (this.settings.debug.log) console.log('Loading Paths Model(s)..')

      };


      // Load paths

      this.loader.load(this.settings.path, (gltf) => {

         this.pathModel = gltf.scene;

      })


      if (this.settings.lookAtPath && this.settings.lookAtPath !== '' && this.settings.lookAtPath !== null) {

         this.loader.load(this.settings.lookAtPath, (gltf) => {

            this.lookAtPathModel = gltf.scene;

         })

      }


      // On Loading Complete 

      this.loadingManager.onLoad = () => {

         if (this.settings.debug.log) console.log('Path Model(s) Loaded.')

         processPaths(this.pathModel, this.lookAtPathModel)

      };


      // On Loading Error

      this.loadingManager.onError = (url) => console.log('Error loading ' + url)


      //




      const processPaths = () => {


         // Debug - Log

         let logStart = this.settings.debug.log ? performance.now() : null;


         // Traverse Model & Populate Arrays

         this.pathModel.traverse((child) => {

            if (child instanceof Mesh) {

               this.pathMesh = child;

               const v = this.pathMesh.geometry.attributes.position.array;

               for (let i = 0; i < v.length; i += 12) {


                  // Calculate segment center position

                  const v1 = new Vector3(v[i] + this.settings.positionOffset.x, v[i + 1] + this.settings.positionOffset.y, v[i + 2] + this.settings.positionOffset.z)
                  const v2 = new Vector3(v[i + 3] + this.settings.positionOffset.x, v[i + 4] + this.settings.positionOffset.y, v[i + 5] + this.settings.positionOffset.z)
                  const v3 = new Vector3(v[i + 6] + this.settings.positionOffset.x, v[i + 7] + this.settings.positionOffset.y, v[i + 8] + this.settings.positionOffset.z)
                  const v4 = new Vector3(v[i + 9] + this.settings.positionOffset.x, v[i + 10] + this.settings.positionOffset.y, v[i + 11] + this.settings.positionOffset.z)

                  const vCenter = new Vector3((v1.x + v2.x + v3.x + v4.x) / 4, (v1.y + v2.y + v3.y + v4.y) / 4, (v1.z + v2.z + v3.z + v4.z) / 4)


                  // Populate POSITIONS array

                  this.pathPositions.push(vCenter)


                  // Populate QUATERNIONS array


                  // From pathModel:

                  if (!this.settings.useLookAtPath || !this.settings.lookAtPath || this.settings.lookAtPath == '' || this.settings.lookAtPath == null) {


                     if (this.settings.debug.log) console.log('*Deriving Quaternions from Path')


                     const midz = new Vector3((v1.x + v2.x) / 2, (v1.y + v2.y) / 2, (v1.z + v2.z) / 2)
                     const midx = new Vector3((v1.x + v3.x) / 2, (v1.y + v3.y) / 2, (v1.z + v3.z) / 2)


                     // Get Normal

                     let vectorX = new Vector3().subVectors(midx, vCenter)
                     let vectorZ = new Vector3().subVectors(midz, vCenter)

                     let normal = new Vector3().crossVectors(vectorX, vectorZ).normalize()

                     let normalTargetPosition = new Vector3().addVectors(vCenter, normal)


                     // Get Orientations

                     const dummy = new Group()


                     // Align Y-axis (up) with the plane's normal

                     let yDirection = new Vector3().subVectors(normalTargetPosition, vCenter).normalize() // Plane's normal
                     let initialUp = new Vector3(0, 1, 0)
                     let quaternionY = new Quaternion().setFromUnitVectors(initialUp, yDirection)


                     // Apply rotation

                     dummy.quaternion.copy(quaternionY)


                     // Align the dummy's X-axis

                     let dummyXDirection = new Vector3(1, 0, 0).applyQuaternion(quaternionY) // X direction after Y rotation
                     let xDirection = new Vector3().subVectors(midx, vCenter).normalize() // Desired X direction
                     let quaternionX = new Quaternion().setFromUnitVectors(dummyXDirection, xDirection)


                     // Combine rotations

                     dummy.quaternion.multiplyQuaternions(quaternionX, dummy.quaternion)


                     // Apply any rotationXOffset

                     if (this.settings.rotationOffset.x !== 0) {

                        let rotationXQuaternion = new Quaternion()
                        rotationXQuaternion.setFromAxisAngle(new Vector3(1, 0, 0), MathUtils.degToRad(this.settings.rotationOffset.x))
                        dummy.quaternion.multiply(rotationXQuaternion)

                     }


                     // Apply any rotationYOffset

                     if (this.settings.rotationOffset.y !== 0) {

                        let rotationYQuaternion = new Quaternion()
                        rotationYQuaternion.setFromAxisAngle(new Vector3(0, 1, 0), MathUtils.degToRad(this.settings.rotationOffset.y))
                        dummy.quaternion.multiply(rotationYQuaternion)

                     }


                     // Apply any rotationZOffset

                     if (this.settings.rotationOffset.z !== 0) {

                        let rotationZQuaternion = new Quaternion()
                        rotationZQuaternion.setFromAxisAngle(new Vector3(0, 0, 1), MathUtils.degToRad(this.settings.rotationOffset.z))
                        dummy.quaternion.multiply(rotationZQuaternion)

                     }


                     //


                     dummy.matrixAutoUpdate = true;


                     //


                     this.pathQuaternions.push(dummy.quaternion)


                  }


                  //


               } // for v.length


               //


               // Loading Complete & Paths Processed..

               if (!this.settings.useLookAtPath || !this.settings.lookAtPath || this.settings.lookAtPath == '' || this.settings.lookAtPath == null) {

                  if (this.settings.reversePath) {
                     pathPositions.reverse();
                     pathQuaternions.reverse();
                  }

                  setInitialized(logStart)

               }


            } // if child == Mesh   


         }) // traverse pathModel


         if (this.settings.useLookAtPath && this.settings.lookAtPath && this.settings.lookAtPath !== '' && this.settings.lookAtPath !== null) {


            this.lookAtPathModel.traverse((child) => {

               if (child instanceof Mesh) {

                  this.lookAtPathMesh = child;

                  child.material = new MeshBasicMaterial({ color: 0x00FF00 })

                  const j = child.geometry.attributes.position.array;


                  for (let i = 0; i < j.length; i += 12) {

                     const v1 = new Vector3(j[i], j[i + 1], j[i + 2]);
                     const v2 = new Vector3(j[i + 3], j[i + 4], j[i + 5]);
                     const v3 = new Vector3(j[i + 6], j[i + 7], j[i + 8]);
                     const v4 = new Vector3(j[i + 9], j[i + 10], j[i + 11]);

                     const vCenter = new Vector3((v1.x + v2.x + v3.x + v4.x) / 4, (v1.y + v2.y + v3.y + v4.y) / 4, (v1.z + v2.z + v3.z + v4.z) / 4)

                     //

                     this.lookAtPositions.push(vCenter);

                  }


                  if (this.settings.reverseLookAtPath) this.lookAtPositions.reverse();


               }

            })


            // Populate quaternions array from lookAtPositions

            const dummyCamera = this.camera.clone();

            for (let i = 0; i < this.lookAtPositions.length; i++) {

               dummyCamera.position.copy(this.pathPositions[i])
               dummyCamera.lookAt(this.lookAtPositions[i])

               this.pathQuaternions.push(new Quaternion().copy(dummyCamera.quaternion))

            }


            if (this.settings.debug.visualise.lookAtSteps) {

               const lookAtStepIndicator = new Mesh(new SphereGeometry(0.25, 8, 8), new MeshBasicMaterial({ color: 0xFFFF00 }))

               for (let i = 0; i < this.lookAtPositions.length; i++) {

                  const lookAtStepIndicatorClone = lookAtStepIndicator.clone()

                  lookAtStepIndicatorClone.position.copy(this.lookAtPositions[i])

                  this.scene.add(lookAtStepIndicatorClone)

               }

            } // debug visualise lookAtSteps


            if (this.settings.reversePath) this.pathPositions.reverse();


            //


            setInitialized(logStart)


         } // Deriving quaternions from lookAtPath      


         //                  


      } // processPaths


      const debug = (logStart) => {

         // Debug -- Log

         if (this.settings.debug.log) {

            console.log("Path(s) Processed - " + (performance.now() - logStart) + 'ms')
            console.log("Position & Quarternion Arrays Populated.")

         } // debug log


         // Debug -- Visualisation

         if (this.settings.debug.visualise.mesh) {

            // Add model 

            this.scene.add(this.pathModel)


            // Add debug material

            this.pathMesh.material = new MeshBasicMaterial({

               color: 0xFFFFFFF,
               wireframe: true,
               transparent: true,
               opacity: 0.5,

            })

         } // visualise mesh


         if (this.settings.debug.visualise.steps) {

            // Add steps indicators

            const stepIndicator = new Mesh(new BoxGeometry(0.25, 0.25, 0.25), new MeshBasicMaterial({

               color: 0xFF0000,
               wireframe: true,
               transparent: true,
               opacity: 0.5

            }))

            for (let i = 0; i < this.pathPositions.length; i++) {

               const stepIndicatorClone = stepIndicator.clone()

               stepIndicatorClone.position.copy(this.pathPositions[i])

               stepIndicatorClone.quaternion.copy(this.pathQuaternions[i])

               this.scene.add(stepIndicatorClone)

            }

         } // visualise steps


         if (this.settings.debug.visualise.axes) {

            // Add axes helpers

            for (let i = 0; i < this.pathPositions.length; i++) {

               const axesHelper = new AxesHelper(5);

               axesHelper.position.copy(this.pathPositions[i])

               axesHelper.quaternion.copy(this.pathQuaternions[i])

               this.scene.add(axesHelper);

            }

         } // visualise axes


      } // debug()


      const setInitialized = (logStart) => {

         debug(logStart)


         // Set Camera Initial State

         this.camera.position.copy(this.pathPositions[this.settings.startSegment || 0])
         this.camera.quaternion.copy(this.pathQuaternions[this.settings.startSegment || 0])


         // Set Initialized

         this.pathInitialized = true;


      } // initialized


      this.init = () => {

         // Expose Init State for running dependent functions

         return this.pathInitialized;

      }


      this.positions = () => {

         // Expose Path Positions

         return this.pathPositions;

      }


      this.quaternions = () => {

         // Expose Path Quaternions

         return this.pathQuaternions;

      }


      //


      this.mouse = { x: 0, y: 0 }

      document.addEventListener('mousemove', (event) => {
         this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
         this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      });

      this.getMouseRotationQuaternion = () => {

         let mouseQuaternion = new Quaternion();

         let horizontalRotation = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -this.mouse.x / 1000 * 0.5 * Math.PI / 2);
         let verticalRotation = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), this.mouse.y / 1000 * 0.5 * Math.PI / 2);

         mouseQuaternion.multiplyQuaternions(verticalRotation, horizontalRotation);
         return mouseQuaternion;

      }


      this.traversePath = (distance, asPercentage, snap) => {

         let index, lerpFactor;

         if (asPercentage) {

            index = Math.floor(distance * (this.pathPositions.length - 1));

            lerpFactor = distance * (this.pathPositions.length - 1) - index;

         } else {

            index = Math.floor(distance);

            lerpFactor = distance % 1;

         }

         //

         if (index < this.pathPositions.length - 1 && index < this.pathQuaternions.length - 1) {

            const targetPosition = this.pathPositions[index].clone().lerp(this.pathPositions[index == this.pathPositions.length - 1 ? 0 : index + 1], lerpFactor);
            this.camera.position.lerpVectors(this.camera.position, targetPosition, snap ? 1 : this.settings.positionSmoothing);

            const targetQuaternion = this.pathQuaternions[index].clone().slerp(this.pathQuaternions[index == this.pathQuaternions.length - 1 ? 0 : index + 1], lerpFactor);
            this.camera.quaternion.slerp(targetQuaternion, snap ? 1 : this.settings.rotationSmoothing);

         }

      } // traversePath(distance, asPercentage)


   } // initCameraPath


}

export default CameraPath;