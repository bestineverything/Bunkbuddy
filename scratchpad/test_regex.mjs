const renderedText = `ResultHub Delhi
Open main menu
...
Student Details
AG
AMAN GULIANI

2024UME4113

B.Tech.

MECHANICAL ENGINEERING
ME

ADMISSION

2024

GRADUATION

2028

Cumulative CGPA

8.14

University Rank

#333

Dept. Rank

#16

Credits Completed

86

BRANCH HIGHEST

9.699

BRANCH AVERAGE

5.965`;

const seed = renderedText;

const deptRankMatch = seed.match(/Dept\.? Rank[\s\n]*#?(\d+)/i);
console.log('deptRankMatch:', deptRankMatch);

const creditsMatch = seed.match(/Credits Completed[\s\n]*(\d+)/i);
console.log('creditsMatch:', creditsMatch);

const cgpaMatch = seed.match(/Cumulative CGPA[\s\n]*([\d\.]+)/i);
console.log('cgpaMatch:', cgpaMatch);
