import * as THREE from 'three';

class ReflectiveMaterial extends THREE.MeshStandardMaterial {

   constructor(options = {}, mesh) {

      const {
         reflectionStrength,
         reflectionMap,
         reflectionResolution,
         reflectionSamples,
         distortionMap,
         distortionScale,
         ...standardMaterialOptions
      } = options;

      super(standardMaterialOptions);

      this.mesh = mesh;

      this.onBeforeCompile = this.customOnBeforeCompile;

      this.camera = new THREE.PerspectiveCamera();

      this.renderTarget = new THREE.WebGLRenderTarget(
         options.reflectionResolution || 512, options.reflectionResolution || 512,
         {
            samples: options.reflectionSamples || 4,
            type: THREE.HalfFloatType
         });

      this.textureMatrix = new THREE.Matrix4();

      this.customUniforms = {};

      this.reflectionStrength = (options.reflectionStrength || options.reflectionStrength == 0) ? options.reflectionStrength : 1;
      this.distortionScale = (options.distortionScale || options.distortionScale == 0) ? options.distortionScale : 20;

      this.distortionSampler = options.distortionMap !== undefined ? options.distortionMap : null;
      this.distortionRepeatX = this.distortionSampler.repeat.x || 1;
      this.distortionRepeatY = this.distortionSampler.repeat.y || 1;

   }

   customOnBeforeCompile(shader) {

      this.customUniforms.tReflection = shader.uniforms.tReflection = { value: this.renderTarget.texture };
      this.customUniforms.textureMatrix = shader.uniforms.textureMatrix = { value: this.textureMatrix };
      this.customUniforms.reflectionStrength = shader.uniforms.reflectionStrength = { value: this.reflectionStrength };
      this.customUniforms.distortionSampler = shader.uniforms.distortionSampler = { value: this.distortionSampler };
      this.customUniforms.distortionScale = shader.uniforms.distortionScale = { value: this.distortionScale };
      this.customUniforms.distortionRepeatX = shader.uniforms.distortionRepeatX = { value: this.distortionRepeatX };
      this.customUniforms.distortionRepeatY = shader.uniforms.distortionRepeatY = { value: this.distortionRepeatY };
      this.customUniforms.eye = shader.uniforms.eye = { value: new THREE.Vector3(0, 0, 0) };

      shader.vertexShader = shader.vertexShader.replace(
         `#include <common>`,
         `
         uniform mat4 textureMatrix;
         varying vec4 vUv;

         varying vec2 noisevUv;
         varying vec4 mirrorCoord;
         varying vec4 worldPosition;
     
         #include <common>
         `
      );

      shader.vertexShader = shader.vertexShader.replace(
         `#include <begin_vertex>`,
         `
         vUv = textureMatrix * vec4( position, 1.0 );

         noisevUv = uv;
         mirrorCoord = modelMatrix * vec4( position, 1.0 );
         mirrorCoord = textureMatrix * mirrorCoord;
     
         #include <begin_vertex>
         `
      );

      shader.fragmentShader = shader.fragmentShader.replace(
         `#include <common>`,
         `
         uniform sampler2D tReflection;
         uniform float reflectionStrength;
         varying vec4 vUv;
         
         uniform sampler2D distortionSampler;
         uniform float distortionScale;
         uniform float distortionRepeatX;
         uniform float distortionRepeatY;
         uniform vec3 eye;
         varying vec4 mirrorCoord;
         varying vec4 worldPosition;
         varying vec2 noisevUv;

         #include <common>
         `
      );

      shader.fragmentShader = shader.fragmentShader.replace(

         `vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;`,
         `

         vec4 distortionOutput = 2.0 * texture2D(distortionSampler, noisevUv * vec2(distortionRepeatX, distortionRepeatY) );
         vec3 surfaceNormal = normalize( distortionOutput.xzy );
        
         float distance = length(eye - worldPosition.xyz);
         vec2 distortion = surfaceNormal.xz * ( 0.001 + 1.0 / distance ) * distortionScale;
         vec3 reflectionOutput = vec3( texture2D( tReflection, mirrorCoord.xy / mirrorCoord.w + distortion ) );

         // vec4 distortionOutput = texture2D( distortionSampler, noisevUv );

         vec2 compensation = distortionScale * vec2(1.0, 1.0);
         vec2 distortedUV = vUv.xy + (distortionOutput.rg * distortionScale - compensation);         

         // vec4 base = texture2DProj( tReflection, vUv ); // Original Reflection
         vec4 base = texture2DProj(tReflection, vec4(distortedUV, vUv.zw)); // Distorted Reflection

         totalDiffuse = mix(totalDiffuse, base.rgb, reflectionStrength);
         
         vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;

         `
      );

   };


   onBeforeRender = function (renderer, scene, camera, geometry, object, group) {

      const reflectorPlane = new THREE.Plane();
      const normal = new THREE.Vector3();
      const reflectorWorldPosition = new THREE.Vector3();
      const cameraWorldPosition = new THREE.Vector3();
      const rotationMatrix = new THREE.Matrix4();
      const lookAtPosition = new THREE.Vector3(0, 0, - 1);
      const clipPlane = new THREE.Vector4();

      const view = new THREE.Vector3();
      const target = new THREE.Vector3();
      const q = new THREE.Vector4();

      const textureMatrix = new THREE.Matrix4();
      const virtualCamera = this.camera;

      const eye = new THREE.Vector3(0, 0, 0);

      reflectorWorldPosition.setFromMatrixPosition(this.mesh.matrixWorld);
      cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld);

      rotationMatrix.extractRotation(this.mesh.matrixWorld);

      normal.set(0, 0, 1);
      normal.applyMatrix4(rotationMatrix);

      view.subVectors(reflectorWorldPosition, cameraWorldPosition);

      // Avoid rendering when reflector is facing away

      if (view.dot(normal) > 0) return;

      view.reflect(normal).negate();
      view.add(reflectorWorldPosition);

      rotationMatrix.extractRotation(camera.matrixWorld);

      lookAtPosition.set(0, 0, - 1);
      lookAtPosition.applyMatrix4(rotationMatrix);
      lookAtPosition.add(cameraWorldPosition);

      target.subVectors(reflectorWorldPosition, lookAtPosition);
      target.reflect(normal).negate();
      target.add(reflectorWorldPosition);

      virtualCamera.position.copy(view);
      virtualCamera.up.set(0, 1, 0);
      virtualCamera.up.applyMatrix4(rotationMatrix);
      virtualCamera.up.reflect(normal);
      virtualCamera.lookAt(target);

      virtualCamera.far = camera.far; // Used in WebGLBackground

      virtualCamera.updateMatrixWorld();
      virtualCamera.projectionMatrix.copy(camera.projectionMatrix);

      // Update the texture matrix
      textureMatrix.set(
         0.5, 0.0, 0.0, 0.5,
         0.0, 0.5, 0.0, 0.5,
         0.0, 0.0, 0.5, 0.5,
         0.0, 0.0, 0.0, 1.0
      );
      textureMatrix.multiply(virtualCamera.projectionMatrix);
      textureMatrix.multiply(virtualCamera.matrixWorldInverse);
      textureMatrix.multiply(this.mesh.matrixWorld);

      // Now update projection matrix with new clip plane, implementing code from: http://www.terathon.com/code/oblique.html
      // Paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
      reflectorPlane.setFromNormalAndCoplanarPoint(normal, reflectorWorldPosition);
      reflectorPlane.applyMatrix4(virtualCamera.matrixWorldInverse);

      clipPlane.set(reflectorPlane.normal.x, reflectorPlane.normal.y, reflectorPlane.normal.z, reflectorPlane.constant);

      const projectionMatrix1 = virtualCamera.projectionMatrix;

      q.x = (Math.sign(clipPlane.x) + projectionMatrix1.elements[8]) / projectionMatrix1.elements[0];
      q.y = (Math.sign(clipPlane.y) + projectionMatrix1.elements[9]) / projectionMatrix1.elements[5];
      q.z = - 1.0;
      q.w = (1.0 + projectionMatrix1.elements[10]) / projectionMatrix1.elements[14];

      // Calculate the scaled plane vector
      clipPlane.multiplyScalar(2.0 / clipPlane.dot(q));

      // Replacing the third row of the projection matrix
      projectionMatrix1.elements[2] = clipPlane.x;
      projectionMatrix1.elements[6] = clipPlane.y;
      projectionMatrix1.elements[10] = clipPlane.z + 1.0 - 0.003; // Clip bias
      projectionMatrix1.elements[14] = clipPlane.w;

      eye.setFromMatrixPosition(camera.matrixWorld);

      if (this.customUniforms.tReflection && this.customUniforms.textureMatrix && this.customUniforms.eye) {
         this.customUniforms.tReflection.value = this.renderTarget.texture;
         this.customUniforms.textureMatrix.value = textureMatrix;
         this.customUniforms.eye.value = eye;
      }

      // Render
      this.mesh.visible = false;

      const currentRenderTarget = renderer.getRenderTarget();

      const currentXrEnabled = renderer.xr.enabled;
      const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;

      renderer.xr.enabled = false; // Avoid camera modification
      renderer.shadowMap.autoUpdate = false; // Avoid re-computing shadows

      renderer.setRenderTarget(this.renderTarget);

      renderer.state.buffers.depth.setMask(true); // make sure the depth buffer is writable so it can be properly cleared, see #18897

      if (renderer.autoClear === false) renderer.clear();
      renderer.render(scene, virtualCamera);

      renderer.xr.enabled = currentXrEnabled;
      renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;

      renderer.setRenderTarget(currentRenderTarget);

      // Restore viewport

      const viewport = camera.viewport;

      if (viewport !== undefined) {

         renderer.state.viewport(viewport);

      }

      this.mesh.visible = true;

   };

}

export { ReflectiveMaterial };
