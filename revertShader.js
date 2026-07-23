const fs = require('fs');
let text = fs.readFileSync('js/app.js', 'utf8');

const newShader = `    const fragmentShader = \`
      #define TWO_PI 6.2831853072
      #define PI 3.14159265359

      precision highp float;
      uniform vec2 resolution;
      uniform float time;
      uniform vec2 epicenter;
        
      varying vec2 vUv;

      void main(void) {
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
        
        // Shift dynamically to exactly center behind the target pricing card element
        uv -= epicenter;
        
        float t = time*0.06;
        float lineWidth = 0.002;

        vec3 color = vec3(0.0);
        
        for(int j = 0; j < 3; j++){
          for(int i=0; i < 4; i++){
            color[j] += lineWidth * float(i*i + 1) / abs(fract(t - 0.015*float(j) + float(i)*0.01)*1.0 - length(uv));        
          }
        }
        
        gl_FragColor = vec4(color[2], color[1], color[0], 1.0);
      }
    \`;`;

// Regex replacement
text = text.replace(/const fragmentShader = `[\s\S]*?gl_FragColor = vec4[\s\S]*?}`;/m, newShader);

fs.writeFileSync('js/app.js', text);
console.log('Shader reverted to classic rings with dynamic centering!');
