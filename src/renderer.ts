const { ipcRenderer } = require('electron');

let isRunning = false;

document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
    const stopBtn = document.getElementById('stopBtn') as HTMLButtonElement;
    const quitBtn = document.getElementById('quitBtn') as HTMLButtonElement;
    const status = document.getElementById('status') as HTMLDivElement;
    
    const innerSizeSlider = document.getElementById('innerSize') as HTMLInputElement;
    const outerSizeSlider = document.getElementById('outerSize') as HTMLInputElement;
    const innerSizeValue = document.getElementById('innerSizeValue') as HTMLSpanElement;
    const outerSizeValue = document.getElementById('outerSizeValue') as HTMLSpanElement;

    console.log('DOM loaded, setting up event listeners');

    // Size control handlers
    innerSizeSlider.addEventListener('input', () => {
        const value = innerSizeSlider.value;
        innerSizeValue.textContent = `${value}px`;
        
        // Ensure inner circle is smaller than outer circle
        if (parseInt(value) >= parseInt(outerSizeSlider.value)) {
            outerSizeSlider.value = (parseInt(value) + 20).toString();
            outerSizeValue.textContent = `${outerSizeSlider.value}px`;
        }
        
        if (isRunning) {
            updateCircleSizes();
        }
    });

    outerSizeSlider.addEventListener('input', () => {
        const value = outerSizeSlider.value;
        outerSizeValue.textContent = `${value}px`;
        
        // Ensure outer circle is larger than inner circle
        if (parseInt(value) <= parseInt(innerSizeSlider.value)) {
            innerSizeSlider.value = (parseInt(value) - 20).toString();
            innerSizeValue.textContent = `${innerSizeSlider.value}px`;
        }
        
        if (isRunning) {
            updateCircleSizes();
        }
    });

    function updateCircleSizes() {
        const sizes = {
            inner: parseInt(innerSizeSlider.value),
            outer: parseInt(outerSizeSlider.value)
        };
        ipcRenderer.send('update-circle-sizes', sizes);
    }

    startBtn.addEventListener('click', () => {
        console.log('Start button clicked');
        isRunning = true;
        ipcRenderer.send('toggle-overlay', true);
        updateCircleSizes(); // Send initial sizes
        startBtn.disabled = true;
        stopBtn.disabled = false;
        status.textContent = '実行中';
    });

    stopBtn.addEventListener('click', () => {
        console.log('Stop button clicked');
        isRunning = false;
        ipcRenderer.send('toggle-overlay', false);
        startBtn.disabled = false;
        stopBtn.disabled = true;
        status.textContent = '停止中';
    });

    quitBtn.addEventListener('click', () => {
        console.log('Quit button clicked');
        ipcRenderer.send('quit-app');
    });
});