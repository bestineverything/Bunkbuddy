const fs = require('fs');
let text = fs.readFileSync('js/app.js', 'utf8');

// The file was mangled. Let's find the fracture and restore it completely.
const mangledIndex = text.indexOf('vec2(12.9898,78.233)))*\r\n              43758.5453123);\r\n      }\r\n        gl_FragColor = vec4(color[2] + core*0.1, color[1] + core*0.2, color[0] + core*0.5, 1.0);');

const mangledIndexLF = text.indexOf('vec2(12.9898,78.233)))*\n              43758.5453123);\n      }\n        gl_FragColor = vec4(color[2] + core*0.1, color[1] + core*0.2, color[0] + core*0.5, 1.0);');

const rightStr = `vec2(12.9898,78.233)))*
              43758.5453123);
      }
      
      varying vec2 vUv;

      void main(void) {
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
        
        // Shift epicenter DOWNWARDS slightly to perfectly align behind the pricing card
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

        gl_FragColor = vec4(color[2] + core*0.1, color[1] + core*0.2, color[0] + core*0.5, 1.0);`;

if (mangledIndex !== -1) {
    const orig = 'vec2(12.9898,78.233)))*\r\n              43758.5453123);\r\n      }\r\n        gl_FragColor = vec4(color[2] + core*0.1, color[1] + core*0.2, color[0] + core*0.5, 1.0);';
    text = text.replace(orig, rightStr);
} else if (mangledIndexLF !== -1) {
    const orig = 'vec2(12.9898,78.233)))*\n              43758.5453123);\n      }\n        gl_FragColor = vec4(color[2] + core*0.1, color[1] + core*0.2, color[0] + core*0.5, 1.0);';
    text = text.replace(orig, rightStr);
} else {
    console.log("Could not find mangled string");
}

fs.writeFileSync('js/app.js', text);
