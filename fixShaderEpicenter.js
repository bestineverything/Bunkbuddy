const fs = require('fs');
let text = fs.readFileSync('js/app.js', 'utf8');

// 1. Update uniforms 
text = text.replace(
    '        resolution: { type: "v2", value: new THREE.Vector2() },\r\n    };',
    '        resolution: { type: "v2", value: new THREE.Vector2() },\r\n        epicenter: { type: "v2", value: new THREE.Vector2(0, 0) }\r\n    };'
).replace(
    '        resolution: { type: "v2", value: new THREE.Vector2() },\n    };',
    '        resolution: { type: "v2", value: new THREE.Vector2() },\n        epicenter: { type: "v2", value: new THREE.Vector2(0, 0) }\n    };'
);

// 2. Update shader
text = text.replace(
    '      uniform vec2 resolution;\r\n      uniform float time;',
    '      uniform vec2 resolution;\r\n      uniform float time;\r\n      uniform vec2 epicenter;'
).replace(
    '      uniform vec2 resolution;\n      uniform float time;',
    '      uniform vec2 resolution;\n      uniform float time;\n      uniform vec2 epicenter;'
);

text = text.replace(
    '        // Shift epicenter DOWN to perfectly align behind the pricing card\r\n        uv.y += 0.25;',
    '        // Shift dynamically to exactly center behind the target pricing card element!\r\n        uv -= epicenter;'
).replace(
    '        // Shift epicenter DOWN to perfectly align behind the pricing card\n        uv.y += 0.25;',
    '        // Shift dynamically to exactly center behind the target pricing card element!\n        uv -= epicenter;'
);

// 3. Update onWindowResize
const resizeReplacement = `    const animate = () => {
        if (!document.getElementById('proWebGL')) return; // clean up if element stripped

        // Dynamically calculate and track the pricing card position!
        const card = document.querySelector('.pricing-card');
        if (card && container && uniforms.epicenter) {
            const cardRect = card.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            if (containerRect.width > 0 && containerRect.height > 0) {
                const cardX = cardRect.left + cardRect.width / 2;
                const cardY = cardRect.top + cardRect.height / 2;
                const conX = containerRect.left + containerRect.width / 2;
                const conY = containerRect.top + containerRect.height / 2;
                
                const minRes = Math.min(containerRect.width, containerRect.height);
                const uvX = ((cardX - conX) * 2.0) / minRes;
                const uvY = -((cardY - conY) * 2.0) / minRes; 
                
                // Lerp towards the exact position for buttery smooth repositioning on resize/scroll
                uniforms.epicenter.value.x += (uvX - uniforms.epicenter.value.x) * 0.1;
                uniforms.epicenter.value.y += (uvY - uniforms.epicenter.value.y) * 0.1;
            }
        }
        
        requestAnimationFrame(animate);
        uniforms.time.value += 0.05;`;

text = text.replace(
    `    const animate = () => {
        if (!document.getElementById('proWebGL')) return; // clean up if element stripped
        requestAnimationFrame(animate);
        uniforms.time.value += 0.05;`,
    resizeReplacement
).replace(
    `    const animate = () => {\r\n        if (!document.getElementById('proWebGL')) return; // clean up if element stripped\r\n        requestAnimationFrame(animate);\r\n        uniforms.time.value += 0.05;`,
    resizeReplacement
); 

fs.writeFileSync('js/app.js', text);
console.log('Fixed app.js logic perfectly!');
