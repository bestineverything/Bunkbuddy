const renderedText = `ResultHub Delhi
...
Semester I
20 cr
8.40
...
Semester IV
20 cr
9.20
`;

const sgpaMatches = [...renderedText.matchAll(/Semester\s+(I|II|III|IV|V|VI|VII|VIII)[\s\n]+(\d+)\s*cr[\s\n]+(\d+\.\d+)/gi)];
console.log('SGPA matches:', sgpaMatches.length);
console.log('SGPA data:', sgpaMatches.map(m => m[3]));
