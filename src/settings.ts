const { ipcRenderer: configIpcRenderer } = require('electron');

// Default values - will be injected from main process
let DEFAULT_INNER_SIZE = 200; // Fallback value
let DEFAULT_OUTER_SIZE = 1000; // Fallback value
let DEFAULT_INNER_COLOR = '#d0723b'; // Fallback value
let DEFAULT_OUTER_COLOR = '#e74b4b'; // Fallback value

// Minimum values (removed - no restrictions)
// const MIN_INNER_SIZE = 300;
// const MIN_OUTER_SIZE = 500;

let configInnerSize = DEFAULT_INNER_SIZE;
let configOuterSize = DEFAULT_OUTER_SIZE;
let configInnerColor = DEFAULT_INNER_COLOR;
let configOuterColor = DEFAULT_OUTER_COLOR;
let configIsRunning = false;
let configAutoStart = false;

// DOM elements might not exist in simplified UI
const innerSizeInput = document.getElementById('innerSizeInput') as HTMLInputElement;
const outerSizeInput = document.getElementById('outerSizeInput') as HTMLInputElement;
const innerColorPreview = document.getElementById('innerColorPreview') as HTMLDivElement;
const outerColorPreview = document.getElementById('outerColorPreview') as HTMLDivElement;
const innerColorInput = document.getElementById('innerColorInput') as HTMLInputElement;
const outerColorInput = document.getElementById('outerColorInput') as HTMLInputElement;
const resetButton = document.getElementById('resetButton') as HTMLButtonElement;
const autoStartToggle = document.getElementById('autoStartToggle') as HTMLInputElement;

function updateInnerSize(size: number) {
    configInnerSize = size;
    innerSizeInput.value = size.toString();
    
    if (configOuterSize <= configInnerSize) {
        const newOuterSize = configInnerSize + 200;
        updateOuterSize(newOuterSize);
    }
    
    updatePresetButtons('inner', size);
    sendSettingsUpdate();
}

function updateOuterSize(size: number) {
    configOuterSize = size;
    outerSizeInput.value = size.toString();
    
    if (configInnerSize >= configOuterSize) {
        const newInnerSize = configOuterSize - 200;
        updateInnerSize(Math.max(1, newInnerSize)); // Allow very small sizes
        return;
    }
    
    updatePresetButtons('outer', size);
    sendSettingsUpdate();
}

function updateInnerColor(color: string) {
    configInnerColor = color;
    innerColorInput.value = color;
    innerColorPreview.style.backgroundColor = color;
    sendSettingsUpdate();
}

function updateOuterColor(color: string) {
    configOuterColor = color;
    outerColorInput.value = color;
    outerColorPreview.style.backgroundColor = color;
    sendSettingsUpdate();
}

function updatePresetButtons(target: string, value: number) {
    const buttons = document.querySelectorAll(`[data-target="${target}"]`) as NodeListOf<HTMLButtonElement>;
    buttons.forEach(button => {
        if (parseInt(button.dataset.value || '0') === value) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

function sendSettingsUpdate() {
    const settings = {
        inner: { size: configInnerSize, color: configInnerColor },
        outer: { size: configOuterSize, color: configOuterColor }
    };
    console.log('=== CONFIG: Sending settings update ===');
    console.log('Settings object:', settings);
    console.log('Current innerSize:', configInnerSize);
    console.log('Current outerSize:', configOuterSize);
    console.log('Current innerColor:', configInnerColor);
    console.log('Current outerColor:', configOuterColor);
    console.log('=====================================');
    configIpcRenderer.send('update-circle-settings', settings);
}

function resetToDefaults() {
    console.log('Resetting to default settings');
    
    // Reset to default values
    updateInnerSize(DEFAULT_INNER_SIZE);
    updateOuterSize(DEFAULT_OUTER_SIZE);
    updateInnerColor(DEFAULT_INNER_COLOR);
    updateOuterColor(DEFAULT_OUTER_COLOR);
    
    // Send reset command to main process
    configIpcRenderer.send('reset-to-defaults');
}

innerSizeInput.addEventListener('input', (e) => {
    const size = parseInt((e.target as HTMLInputElement).value);
    if (size >= 1 && size <= 1000) { // Allow very small sizes, minimum 1px
        updateInnerSize(size);
    }
});

outerSizeInput.addEventListener('input', (e) => {
    const size = parseInt((e.target as HTMLInputElement).value);
    if (size >= 1 && size <= 1200) { // Allow very small sizes, minimum 1px
        updateOuterSize(size);
    }
});

innerColorPreview.addEventListener('click', () => {
    innerColorInput.click();
});

outerColorPreview.addEventListener('click', () => {
    outerColorInput.click();
});

innerColorInput.addEventListener('change', (e) => {
    updateInnerColor((e.target as HTMLInputElement).value);
});

outerColorInput.addEventListener('change', (e) => {
    updateOuterColor((e.target as HTMLInputElement).value);
});

resetButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
        resetToDefaults();
    }
});

autoStartToggle.addEventListener('change', (e) => {
    const enabled = (e.target as HTMLInputElement).checked;
    configAutoStart = enabled;
    configIpcRenderer.send('set-auto-start', enabled);
});

document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('preset-button')) {
        const targetType = target.dataset.target;
        const value = parseInt(target.dataset.value || '0');
        
        if (targetType === 'inner') {
            updateInnerSize(value);
        } else if (targetType === 'outer') {
            updateOuterSize(value);
        }
    }
});

// Listen for constants injection from main process
configIpcRenderer.on('inject-constants', (event: any, constants: { INNER_SIZE: number; OUTER_SIZE: number; INNER_COLOR: string; OUTER_COLOR: string }) => {
    console.log('Settings constants injected:', constants);
    DEFAULT_INNER_SIZE = constants.INNER_SIZE;
    DEFAULT_OUTER_SIZE = constants.OUTER_SIZE;
    DEFAULT_INNER_COLOR = constants.INNER_COLOR;
    DEFAULT_OUTER_COLOR = constants.OUTER_COLOR;
    console.log(`Updated settings constants: innerSize=${DEFAULT_INNER_SIZE}, outerSize=${DEFAULT_OUTER_SIZE}`);
});

// Initialize values from main process
configIpcRenderer.invoke('get-current-settings').then((settings: any) => {
    console.log('Received initial settings:', settings);
    if (settings.inner) {
        updateInnerSize(settings.inner.size || settings.inner);
        if (settings.inner.color) {
            updateInnerColor(settings.inner.color);
        }
    }
    if (settings.outer) {
        updateOuterSize(settings.outer.size || settings.outer);
        if (settings.outer.color) {
            updateOuterColor(settings.outer.color);
        }
    }
    
    // Set auto start toggle
    configAutoStart = settings.autoStart || false;
    autoStartToggle.checked = configAutoStart;
});

// Listen for reset events from main process
configIpcRenderer.on('settings-reset', (event: any, settings: any) => {
    console.log('Settings reset received:', settings);
    
    // Update UI with reset values without triggering updates
    configInnerSize = settings.inner.size;
    configOuterSize = settings.outer.size;
    configInnerColor = settings.inner.color;
    configOuterColor = settings.outer.color;
    configAutoStart = settings.autoStart || false;
    
    // Update inputs directly
    innerSizeInput.value = configInnerSize.toString();
    outerSizeInput.value = configOuterSize.toString();
    innerColorInput.value = configInnerColor;
    outerColorInput.value = configOuterColor;
    innerColorPreview.style.backgroundColor = configInnerColor;
    outerColorPreview.style.backgroundColor = configOuterColor;
    autoStartToggle.checked = configAutoStart;
    
    // Update preset buttons
    updatePresetButtons('inner', configInnerSize);
    updatePresetButtons('outer', configOuterSize);
});
