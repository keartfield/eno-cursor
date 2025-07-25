let innerCircle: HTMLDivElement;
let outerCircle: HTMLDivElement;

let mouseX = 0;
let mouseY = 0;
let innerSize: number; // Will be updated from main process constants injection
let outerSize: number; // Will be updated from main process constants injection
let innerColor: string; // Will be updated from main process
let outerColor: string; // Will be updated from main process
let myDisplayIndex = -1;
let currentDisplayIndex = -1;
let isInitialized = false;

// Queue to store settings updates before DOM is ready
let pendingSettingsUpdate: any = null;

// Initialize DOM elements when document is ready
function initializeOverlay() {
    innerCircle = document.getElementById('innerCircle') as HTMLDivElement;
    outerCircle = document.getElementById('outerCircle') as HTMLDivElement;
    
    if (!innerCircle || !outerCircle) {
        console.error('Could not find circle elements');
        return;
    }
    
    // Initialize circles as hidden
    innerCircle.style.display = 'none';
    outerCircle.style.display = 'none';
    
    isInitialized = true;
    console.log('Overlay DOM elements initialized');
    
    // Apply any pending settings updates
    if (pendingSettingsUpdate) {
        console.log('Applying pending settings update:', pendingSettingsUpdate);
        applySettingsUpdate(pendingSettingsUpdate);
        pendingSettingsUpdate = null;
    }
}

// Listen for display index from main process
const { ipcRenderer: overlayIpcRenderer } = require('electron');

overlayIpcRenderer.on('set-display-index', (event: any, index: number) => {
  myDisplayIndex = index;
  console.log(`Overlay initialized for display ${myDisplayIndex}`);
});

// Listen for constants injection from main process
overlayIpcRenderer.on('inject-constants', (event: any, constants: { INNER_SIZE: number; OUTER_SIZE: number }) => {
  console.log('Constants injected:', constants);
  innerSize = constants.INNER_SIZE;
  outerSize = constants.OUTER_SIZE;
  console.log(`Updated overlay constants: innerSize=${innerSize}, outerSize=${outerSize}`);
});

function updateCursorPosition(x: number, y: number, displayIndex: number = -1) {
    mouseX = x;
    mouseY = y;
    currentDisplayIndex = displayIndex;
    
    // Show circles only if cursor is on this display
    // If myDisplayIndex is not set yet (-1), show circles (fallback)
    const shouldShow = (myDisplayIndex === -1) || (displayIndex === -1) || (displayIndex === myDisplayIndex);
    
    console.log(`Display ${myDisplayIndex}: cursor at display ${displayIndex}, shouldShow: ${shouldShow}`);
    
    if (shouldShow) {
        // If myDisplayIndex is not set yet, use fallback positioning
        if (myDisplayIndex === -1) {
            // Direct positioning for initial display
            positionCircles(x, y);
        } else {
            // Get display bounds from main process via IPC
            overlayIpcRenderer.invoke('get-display-bounds', myDisplayIndex).then((bounds: any) => {
                if (bounds) {
                    // Convert global coordinates to local coordinates for this display
                    const localX = x - bounds.x;
                    const localY = y - bounds.y;
                    
                    positionCircles(localX, localY);
                }
            }).catch(() => {
                // Fallback to direct positioning if IPC fails
                positionCircles(x, y);
            });
        }
    } else {
        // Hide circles
        innerCircle.style.display = 'none';
        outerCircle.style.display = 'none';
    }
}

function positionCircles(x: number, y: number) {
    // Check if DOM elements are initialized
    if (!innerCircle || !outerCircle) {
        console.warn('Circle elements not initialized yet');
        return;
    }
    
    // Check if sizes are initialized
    if (!innerSize || !outerSize) {
        console.warn('Circle sizes not initialized yet');
        return;
    }
    
    // Size-dependent compensation calculation (from refactored position service)
    const outerSizeRatio = Math.min(outerSize / 600, 1);
    const outerOffsetX = 5 * (1 - outerSizeRatio);
    const outerOffsetY = -(30 - 5 * (1 - outerSizeRatio));
    
    const innerSizeRatio = Math.min(innerSize / 400, 1);
    const innerOffsetX = 3 * (1 - innerSizeRatio);
    const innerOffsetY = -(30 - 3 * (1 - innerSizeRatio));
    
    // Calculate positions with compensation
    const innerLeft = x - innerSize / 2 + innerOffsetX;
    const innerTop = y - innerSize / 2 + innerOffsetY;
    const outerLeft = x - outerSize / 2 + outerOffsetX;
    const outerTop = y - outerSize / 2 + outerOffsetY;
    
    // Apply positioning
    innerCircle.style.left = `${innerLeft}px`;
    innerCircle.style.top = `${innerTop}px`;
    outerCircle.style.left = `${outerLeft}px`;
    outerCircle.style.top = `${outerTop}px`;
    
    // Set sizes
    innerCircle.style.width = `${innerSize}px`;
    innerCircle.style.height = `${innerSize}px`;
    outerCircle.style.width = `${outerSize}px`;
    outerCircle.style.height = `${outerSize}px`;
    
    // Debug logging
    const calculatedInnerCenterX = innerLeft + innerSize / 2;
    const calculatedInnerCenterY = innerTop + innerSize / 2;
    const calculatedOuterCenterX = outerLeft + outerSize / 2;
    const calculatedOuterCenterY = outerTop + outerSize / 2;
    
    const innerCenterOffsetX = calculatedInnerCenterX - x;
    const innerCenterOffsetY = calculatedInnerCenterY - y;
    const outerCenterOffsetX = calculatedOuterCenterX - x;
    const outerCenterOffsetY = calculatedOuterCenterY - y;
    
    console.log(`🎯 CURSOR: (${x}, ${y}) | SIZES: inner=${innerSize}, outer=${outerSize}`);
    console.log(`🔴 INNER OFFSET: x=${innerCenterOffsetX.toFixed(1)}, y=${innerCenterOffsetY.toFixed(1)} (should be 0,0)`);
    console.log(`🔵 OUTER OFFSET: x=${outerCenterOffsetX.toFixed(1)}, y=${outerCenterOffsetY.toFixed(1)} (should be 0,0)`);
    console.log(`---`);
    
    // Show circles
    innerCircle.style.display = 'block';
    outerCircle.style.display = 'block';
}

function updateCircleSizes() {
    console.log('=== updateCircleSizes called ===');
    console.log('Setting inner circle size to:', innerSize);
    console.log('Setting outer circle size to:', outerSize);
    
    // Update position with new sizes to keep centered on cursor
    // Use the current mouse position from global tracking
    if (myDisplayIndex === -1) {
        // Direct positioning for initial display
        positionCircles(mouseX, mouseY);
    } else {
        // Get display bounds and position for multi-display setup
        overlayIpcRenderer.invoke('get-display-bounds', myDisplayIndex).then((bounds: any) => {
            if (bounds) {
                const localX = mouseX - bounds.x;
                const localY = mouseY - bounds.y;
                positionCircles(localX, localY);
            }
        }).catch(() => {
            positionCircles(mouseX, mouseY);
        });
    }
    
    console.log('=== updateCircleSizes completed ===');
}

document.addEventListener('mousemove', (event) => {
    updateCursorPosition(event.clientX, event.clientY);
});

function trackGlobalCursor() {
    function updatePosition() {
        overlayIpcRenderer.invoke('get-cursor-position').then((point: { x: number; y: number; displayIndex: number }) => {
            updateCursorPosition(point.x, point.y, point.displayIndex);
        });
        requestAnimationFrame(updatePosition);
    }
    updatePosition();
}

// Listen for size updates from main process
overlayIpcRenderer.on('circle-sizes-updated', (event: any, sizes: { inner: number; outer: number }) => {
    innerSize = sizes.inner;
    outerSize = sizes.outer;
    console.log('Circle sizes updated:', sizes);
    updateCircleSizes();
});

// Common function to apply settings updates
function applySettingsUpdate(settings: { inner: number; outer: number; innerColor: string; outerColor: string }) {
    console.log('=== OVERLAY: Applying settings update ===');
    console.log('Settings received:', settings);
    console.log('Previous innerSize:', innerSize);
    console.log('Previous outerSize:', outerSize);
    
    innerSize = settings.inner;
    outerSize = settings.outer;
    innerColor = settings.innerColor;
    outerColor = settings.outerColor;
    
    console.log('New innerSize:', innerSize);
    console.log('New outerSize:', outerSize);
    
    if (settings.innerColor) {
        updateCircleColor('inner', settings.innerColor);
        console.log('Updated inner color to:', settings.innerColor);
    }
    
    if (settings.outerColor) {
        updateCircleColor('outer', settings.outerColor);
        console.log('Updated outer color to:', settings.outerColor);
    }
    
    console.log('Calling updateCircleSizes()');
    updateCircleSizes();
    console.log('=== END OVERLAY UPDATE ===');
}

// Listen for settings updates (including colors) from main process
overlayIpcRenderer.on('circle-settings-updated', (event: any, settings: { inner: number; outer: number; innerColor: string; outerColor: string }) => {
    console.log('=== OVERLAY: Received circle-settings-updated ===');
    console.log('isInitialized:', isInitialized);
    
    if (!isInitialized) {
        console.log('DOM not ready, storing settings update for later');
        pendingSettingsUpdate = settings;
        return;
    }
    
    applySettingsUpdate(settings);
});

function updateCircleColor(type: 'inner' | 'outer', color: string) {
    // Check if DOM elements are initialized
    if (!innerCircle || !outerCircle) {
        console.warn('Circle elements not initialized yet for color update');
        return;
    }
    
    const rgba = hexToRgba(color, 0.6);
    
    if (type === 'inner') {
        innerCircle.style.borderColor = rgba;
    } else if (type === 'outer') {
        outerCircle.style.borderColor = rgba;
    }
}

function hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}


// Initialize overlay when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeOverlay();
    trackGlobalCursor();
});

// Fallback initialization for when DOMContentLoaded has already fired
if (document.readyState === 'loading') {
    // Document still loading, wait for DOMContentLoaded
} else {
    // Document already loaded
    initializeOverlay();
    trackGlobalCursor();
}
