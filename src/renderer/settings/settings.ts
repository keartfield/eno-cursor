const { ipcRenderer: configIpcRenderer } = require('electron');

// Access globally loaded constants
const constants = (globalThis as any).exports || {};

// Default values - will be injected from main process (with fallback from constants)
let DEFAULT_INNER_SIZE = constants.DEFAULT_VALUES?.INNER_SIZE;
let DEFAULT_OUTER_SIZE = constants.DEFAULT_VALUES?.OUTER_SIZE;
let DEFAULT_INNER_COLOR = constants.DEFAULT_VALUES?.INNER_COLOR;
let DEFAULT_OUTER_COLOR = constants.DEFAULT_VALUES?.OUTER_COLOR;

// Configuration values - will be set from IPC
let configInnerSize: number;
let configOuterSize: number;
let configInnerColor: string;
let configOuterColor: string;
let configIsRunning = false;
let configAutoStart = false;

// DOM elements - will be initialized after document loads
let innerSizeInput: HTMLInputElement;
let outerSizeInput: HTMLInputElement;
let innerColorPreview: HTMLDivElement;
let outerColorPreview: HTMLDivElement;
let innerColorInput: HTMLInputElement;
let outerColorInput: HTMLInputElement;
let resetButton: HTMLButtonElement;
let autoStartToggle: HTMLInputElement;

function initializeDOMElements() {
    innerSizeInput = document.getElementById('innerSizeInput') as HTMLInputElement;
    outerSizeInput = document.getElementById('outerSizeInput') as HTMLInputElement;
    innerColorPreview = document.getElementById('innerColorPreview') as HTMLDivElement;
    outerColorPreview = document.getElementById('outerColorPreview') as HTMLDivElement;
    innerColorInput = document.getElementById('innerColorInput') as HTMLInputElement;
    outerColorInput = document.getElementById('outerColorInput') as HTMLInputElement;
    resetButton = document.getElementById('resetButton') as HTMLButtonElement;
    autoStartToggle = document.getElementById('autoStartToggle') as HTMLInputElement;
    
    // Set up event listeners
    innerSizeInput.addEventListener('input', (e) => {
        const size = parseInt((e.target as HTMLInputElement).value);
        if (size >= (constants.CIRCLE_SETTINGS?.MIN_SIZE || 1) && size <= (constants.CIRCLE_SETTINGS?.MAX_INNER_SIZE || 1000)) {
            updateInnerSize(size);
        }
    });

    outerSizeInput.addEventListener('input', (e) => {
        const size = parseInt((e.target as HTMLInputElement).value);
        if (size >= (constants.CIRCLE_SETTINGS?.MIN_SIZE || 1) && size <= (constants.CIRCLE_SETTINGS?.MAX_OUTER_SIZE || 1200)) {
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
}

function updateInnerSize(size: number) {
    console.log('updateInnerSize called with:', size);
    configInnerSize = size;
    if (innerSizeInput) {
        innerSizeInput.value = size.toString();
    }
    
    if (configOuterSize <= configInnerSize) {
        const newOuterSize = configInnerSize + (constants.CIRCLE_SETTINGS?.SIZE_DIFFERENCE || 200);
        updateOuterSize(newOuterSize);
    }
    
    updatePresetButtons('inner', size);
    sendSettingsUpdate();
}

function updateOuterSize(size: number) {
    configOuterSize = size;
    outerSizeInput.value = size.toString();
    
    if (configInnerSize >= configOuterSize) {
        const newInnerSize = configOuterSize - (constants.CIRCLE_SETTINGS?.SIZE_DIFFERENCE || 200);
        updateInnerSize(Math.max(constants.CIRCLE_SETTINGS?.MIN_SIZE || 1, newInnerSize));
        return;
    }
    
    updatePresetButtons('outer', size);
    sendSettingsUpdate();
}

function updateInnerColor(color: string) {
    console.log('updateInnerColor called with:', color);
    configInnerColor = color;
    if (innerColorInput) {
        innerColorInput.value = color;
    }
    if (innerColorPreview) {
        innerColorPreview.style.backgroundColor = color;
    }
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

// Initialize DOM elements and settings when document is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeDOMElements();
    
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
