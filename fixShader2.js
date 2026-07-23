const fs = require('fs');
let text = fs.readFileSync('js/app.js', 'utf8');

// I will find the exact string that is left in the file right now to inject both shaders correctly.

const badBlock = `    const vertexShader = \`
        fragmentShader: fragmentShader,
    });`;

const goodBlock = `    const vertexShader = \`
      void main() {
        gl_Position = vec4( position, 1.0 );
      }
    \`;

    const fragmentShader = \`
      #define TWO_PI 6.2831853072
      #define PI 3.14159265359

      precision highp float;
      uniform vec2 resolution;
      uniform float time;
        
      float random (in float x) {
          return fract(sin(x)*1e4);
      }
      float random (vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
      }
      
      varying vec2 vUv;

      void main(void) {
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
        
        // Shift epicenter DOWN to perfectly align behind the pricing card
        uv.y += 0.25;
        
        // Create 240 distinct vertical bands (removes horizontal chunky feel, keeps sleek streaks)
        float band = floor(uv.x * 240.0) / 240.0;
          
        // Use a high offset so it doesn't "expand" abruptly on load from 0
        float t = (time + 100.0)*0.06 + random(band)*0.4;
        float lineWidth = 0.0015;

        vec3 color = vec3(0.0);
        // Banded X for streaks, smooth Y for perfectly anti-aliased curves
        vec2 streakUv = vec2(band, uv.y);
        
        for(int j = 0; j < 3; j++){
          for(int i=0; i < 4; i++){
            // Use sin instead of fract for smooth pulsing glow, completely eliminates pop-in chunkiness 
            color[j] += lineWidth * float(i*i + 1) / abs(sin(t - 0.015*float(j) + float(i)*0.01)*1.0 - length(streakUv));        
          }
        }
        
        // Soft ambient core glow centered behind the card
        float core = 0.1 / (length(uv) + 0.1);

        gl_FragColor = vec4(color[2] + core*0.1, color[1] + core*0.2, color[0] + core*0.5, 1.0);
      }
    \`;

    const material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
    });`;

let fixed = false;
if (text.includes(badBlock)) {
    text = text.replace(badBlock, goodBlock);
    fixed = true;
} else if (text.includes(badBlock.replace(/\r\n/g, '\n'))) {
    text = text.replace(badBlock.replace(/\r\n/g, '\n'), goodBlock);
    fixed = true;
} else {
    // regex fallback
    text = text.replace(/const vertexShader = `\s*fragmentShader: fragmentShader,\s*\}\);/s, goodBlock);
    fixed = true;
}

if (fixed) {
    fs.writeFileSync('js/app.js', text);
    console.log("Fixed!");
}
