import * as THREE from 'three';

const Lensflare = (scene, camera) => {


   let lensflare, lensflareSettings, updateLensflare;


   lensflareSettings = {

      position: new THREE.Vector3(-40, 41, 100),

      targetOffset: 50,

      autoGenerate: false,


      // if autoGenerate: true

      numElements: 8,

      starburst: true,
      starburstSize: 0.4,
      starburstColor: 0xFFFFFF,
      starburstOpacity: 1,

      halo: true,
      haloSize: 10.0,
      haloColor: 0xFFFFFF,
      haloOpacity: 0.05,


      minSpacing: 10,
      maxSpacing: 15,

      minSize: 0.1,
      maxSize: 8.0,

      minOpacity: 0.01,
      maxOpacity: 0.04,

      palette: [
         0xffffff,
         0xeeeeee,
         0xe8e9fc,
         0xfceded,
         0xf7fced,
      ],


      //


      // if custom ( autoGenerate: false )

      customElements: [

         // [zPosition, size, texture(0-5), opacity, color]

         [0, 3, 5, 0.01, 0xffffff],
         [8, 3, 2, 0.05, 0xffffff],
         [10, 0.2, 1, 0.06, 0xeeeeee],
         [14, 1, 0, 0.1, 0xe3e2ce],
         [25, 3, 0, 0.04, 0xe3e2ce],
         [30, 6, 2, 0.05, 0xeeeeee],
         [40, 0.5, 1, 0.1, 0xeeeeee],
         [50, 0.25, 0, 0.2, 0xe1cee2],
         [55, 20, 4, 0.1, 0xFFFFFF],

      ]

   }


   //


   function createLensflare() {

      lensflare = new THREE.Object3D();
      scene.add(lensflare)

      lensflare.scale.set(1, 1, 1)

      lensflare.position.set(lensflareSettings.position.x, lensflareSettings.position.y, lensflareSettings.position.z)

      //

      const lensflareGeometry = new THREE.BufferGeometry();

      const positions = [];
      const sizes = [];
      const uvOffsets = [];
      const opacities = [];
      const colors = [];

      //

      if (lensflareSettings.autoGenerate) {

         for (let i = 0; i < lensflareSettings.numElements; i++) {


            // Set positions/spacing
            if (i === 0) {
               positions.push(0, 0, 0);
            } else {
               const zPos = positions[(i - 1) * 3 + 2] + Math.random() * (lensflareSettings.maxSpacing - lensflareSettings.minSpacing) + lensflareSettings.minSpacing;
               positions.push(0, 0, zPos);
            }


            // Set sizes
            sizes[i] = Math.random() * (lensflareSettings.maxSize - lensflareSettings.minSize) + lensflareSettings.minSize;

            if (lensflareSettings.starburst && i == 0) sizes[i] = lensflareSettings.starburstSize;
            if (lensflareSettings.halo && i == lensflareSettings.numElements - 1) sizes[i] = lensflareSettings.haloSize;


            // Set sprites
            const randomOffset = Math.floor(Math.random() * 3);
            uvOffsets[i] = randomOffset;

            if (lensflareSettings.starburst && i == 0) uvOffsets[i] = 5.0; // lensflareSettings.starburst sprite
            if (lensflareSettings.halo && i == lensflareSettings.numElements - 1) uvOffsets[i] = 4.0; // lensflareSettings.halo sprite      


            // Set opacities
            opacities[i] = Math.random() * (lensflareSettings.maxOpacity - lensflareSettings.minOpacity) + lensflareSettings.minOpacity;

            if (lensflareSettings.starburst && i == 0) opacities[i] = lensflareSettings.starburstOpacity || 1.0;
            if (lensflareSettings.halo && i == lensflareSettings.numElements - 1) opacities[i] = lensflareSettings.haloOpacity || 1.0;


            // Get/Set colors
            let color = new THREE.Color(lensflareSettings.palette[Math.floor(Math.random() * lensflareSettings.palette.length)]);

            if (lensflareSettings.starburst && i == 0) color = new THREE.Color(lensflareSettings.starburstColor || 0xFF0000); // lensflareSettings.starburst            
            if (lensflareSettings.halo && i == lensflareSettings.numElements - 1) color = new THREE.Color(lensflareSettings.haloColor || 0xFFFFFF); // lensflareSettings.halo            

            colors.push(color.r, color.g, color.b)

         }

      } else {

         if (lensflareSettings.customElements.length > 0) {

            for (let i = 0; i < lensflareSettings.customElements.length; i++) {

               positions.push(0, 0, lensflareSettings.customElements[i][0])

               sizes[i] = lensflareSettings.customElements[i][1];

               uvOffsets[i] = lensflareSettings.customElements[i][2];

               opacities[i] = lensflareSettings.customElements[i][3];

               const color = new THREE.Color(lensflareSettings.customElements[i][4]);
               colors.push(color.r, color.g, color.b)

            }

         }

      }

      lensflareGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));   // Assign positions
      lensflareGeometry.setAttribute('size', new THREE.BufferAttribute(new Float32Array(sizes), 1));           // Assign sizes
      lensflareGeometry.setAttribute('uvOffset', new THREE.BufferAttribute(new Float32Array(uvOffsets), 1));   // Assign texture offsets
      lensflareGeometry.setAttribute('opacity', new THREE.BufferAttribute(new Float32Array(opacities), 1))     // Assign opacities
      lensflareGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));         // Assign colors


      //


      // Vertex shader
      const vertexShader = `
   
            attribute float size;
            attribute float uvOffset;
   
            varying float vUvOffset;
   
            attribute vec3 color;
            varying vec3 vColor;      
   
            attribute float opacity;
            varying float vOpacity;      
            
            void main() {
            
               vUvOffset = uvOffset;
         
               vColor = color;
               vOpacity = opacity;
   
               gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            
               gl_PointSize = size * 100.0;
            
            }
   
         `;

      // Fragment shader
      const fragmentShader = `
   
            uniform sampler2D pointTexture;
   
            varying float vUvOffset;
   
            varying vec3 vColor;
   
            varying float vOpacity;
   
            void main() {
   
               // Define the size of each quad
               float quadWidth = 0.5; // Since the texture is 2 quads wide
               float quadHeight = 1.0 / 3.0; // Since the texture is 3 quads high
         
               // Calculate the base UV coordinates for the selected quad
               float column = mod(vUvOffset, 2.0);
               float row = floor(vUvOffset / 2.0);
         
               // Adjust the UV coordinates
               vec2 baseUV = vec2(column * quadWidth, row * quadHeight);
               vec2 adjustedUV = baseUV + gl_PointCoord * vec2(quadWidth, quadHeight);
         
               // Sample the texture and apply the color and opacity
               vec4 texColor = texture2D(pointTexture, adjustedUV);
               gl_FragColor = vec4(texColor.rgb * vColor, texColor.a * vOpacity);
   
            }
         
         `;

      const lensflareMaterial = new THREE.ShaderMaterial({
         uniforms: {
            pointTexture: { value: new THREE.TextureLoader().load('./textures/lensflare/lensflare-sprites.png') }
         },
         vertexShader,
         fragmentShader,
         transparent: true,
         depthTest: false,
      });

      const lensflarePoints = new THREE.Points(lensflareGeometry, lensflareMaterial);
      lensflare.add(lensflarePoints);


   } // createLensflare()


   updateLensflare = () => {


      // Look at target
      const direction = new THREE.Vector3(0, 0, -1); // Camera's forward direction

      // Apply the camera's rotation to the direction vector
      direction.applyQuaternion(camera.quaternion);


      // Calculate the center of the viewport
      const lensflareTarget = new THREE.Vector3();
      lensflareTarget.copy(camera.position).add(direction.multiplyScalar(lensflareSettings.targetOffset));

      lensflare.lookAt(lensflareTarget);


      //            

      // Hide if offscreen

      const position = new THREE.Vector3();
      position.setFromMatrixPosition(lensflare.matrixWorld);

      // Project the position from world space to screen space
      const projection = position.project(camera);

      if (
         projection.x >= -1 &&
         projection.x <= 1 &&
         projection.y >= -1 &&
         projection.y <= 1 &&
         projection.z >= -1 &&
         projection.z <= 1
      ) {

         // console.log('Lensflare parent is in the viewport');
         lensflare.visible = true;

      } else {

         // console.log('Lensflare parent is not in the viewport');

         lensflare.visible = false;

      }


   } // updateLensflare()   


   //


   createLensflare()


   //


   const hide = () => lensflare.visible = false;
   const show = () => lensflare.visible = true;


   //


   return {
      updateLensflare,
      hide,
      show,
   }


}

export default Lensflare;