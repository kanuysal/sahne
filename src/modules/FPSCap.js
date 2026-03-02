export function renderLoop(loop, fps = 60) {

   function createFpsCap(loop, fps = 60) {

      let targetFps = 0, fpsInterval = 0;
      let lastTime = 0, lastOverTime = 0, prevOverTime = 0, deltaTime = 0;

      function updateFps(value) {
         targetFps = value;
         fpsInterval = 1000 / targetFps;
      }

      updateFps(fps);

      return {
         get fps() {
            return targetFps;
         },
         set fps(value) {
            updateFps(value);
         },

         loop: function (time) {
            deltaTime = time - lastTime;

            if (deltaTime < fpsInterval) return;

            prevOverTime = lastOverTime;
            lastOverTime = deltaTime % fpsInterval;
            lastTime = time - lastOverTime;

            deltaTime -= prevOverTime;

            return loop(deltaTime);
         },
      };
   }

   const fpsCap = createFpsCap(loop, fps);
   let animationFrameId = null;

   function onAnimationFrame(time) {
      fpsCap.loop(time);
      animationFrameId = requestAnimationFrame(onAnimationFrame);
   }

   return {
      start() {
         if (!animationFrameId)
            animationFrameId = requestAnimationFrame(onAnimationFrame);
      },
      stop() {
         if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
         }
      },
   };

}
