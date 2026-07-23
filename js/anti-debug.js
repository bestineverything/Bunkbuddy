// Extremely aggressive anti-debugging script
document.addEventListener('contextmenu', e => e.preventDefault());

document.addEventListener('keydown', e => {
    if (
        e.keyCode === 123 || 
        (e.ctrlKey && e.shiftKey && e.keyCode === 73) || 
        (e.ctrlKey && e.shiftKey && e.keyCode === 74) || 
        (e.ctrlKey && e.keyCode === 85) || 
        (e.ctrlKey && e.shiftKey && e.keyCode === 67) 
    ) {
        e.preventDefault();
        return false;
    }
});

setInterval(() => {
    const t0 = performance.now();
    debugger; 
    const t1 = performance.now();
    
    if (t1 - t0 > 100) {
        document.body.innerHTML = "<h1 style='color:red; text-align:center; padding: 50px; font-family: monospace;'>Access Denied. DevTools probing is strictly prohibited.</h1>";
        window.location.reload();
    }
}, 750);
