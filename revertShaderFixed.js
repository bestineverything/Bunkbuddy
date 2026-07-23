const fs = require('fs');
let text = fs.readFileSync('js/app.js', 'utf8');

const regex = /const fragmentShader = `[\s\S]*?gl_FragColor = vec4[\s\S]*?}\n\s*`;/;

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
        
        // Dynamically shift to exactly center behind the target pricing card element
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

let matches = text.match(regex);
if (matches) {
    text = text.replace(regex, newShader.replace(/\\`/g, '`')); // no escaping needed except literal ticks
    fs.writeFileSync('js/app.js', text);
    console.log('Shader reverted!');
} else {
    // Try wider match
    const regex2 = /const fragmentShader = `[^`]*?`;/;
    let m = text.match(regex2);
    if (m) {
        text = text.replace(regex2, newShader);
        fs.writeFileSync('js/app.js', text);
        console.log('Fallback shader reverted!');
    } else {
        console.log('Failed to find regex match');
    }
}
