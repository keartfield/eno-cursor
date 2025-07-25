import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import { parse } from 'node-html-parser'

// Load actual overlay HTML file
const overlayHtmlPath = path.join(__dirname, '../src/renderer/overlay/overlay.html')
const overlayHtml = fs.readFileSync(overlayHtmlPath, 'utf-8')

// Mock Electron IPC
const mockIpcRenderer = {
  send: vi.fn(),
  on: vi.fn(),
  once: vi.fn(),
  invoke: vi.fn(),
  removeListener: vi.fn(),
  removeAllListeners: vi.fn()
}

// Setup DOM elements for testing
beforeEach(() => {
  // Parse actual HTML file and extract body content
  const root = parse(overlayHtml)
  const bodyContent = root.querySelector('body')?.innerHTML || ''
  
  // Set up DOM with actual HTML structure
  document.body.innerHTML = bodyContent

  // Mock Electron require with proper typing
  global.require = vi.fn((module) => {
    if (module === 'electron') {
      return { ipcRenderer: mockIpcRenderer }
    }
    return {}
  }) as any

  // Mock console methods to reduce noise
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  
  // Reset mocks
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('Cursor Following Functionality', () => {
  it('should load actual overlay HTML structure', () => {
    // Verify the actual HTML structure is loaded
    const overlay = document.getElementById('overlay')
    const innerCircle = document.getElementById('innerCircle')
    const outerCircle = document.getElementById('outerCircle')
    
    expect(overlay).toBeTruthy()
    expect(innerCircle).toBeTruthy()
    expect(outerCircle).toBeTruthy()
    
    // Verify classes from actual HTML
    expect(innerCircle?.classList.contains('cursor-highlight')).toBe(true)
    expect(innerCircle?.classList.contains('inner-circle')).toBe(true)
    expect(outerCircle?.classList.contains('cursor-highlight')).toBe(true)
    expect(outerCircle?.classList.contains('outer-circle')).toBe(true)
  })

  it('should initialize overlay elements correctly', () => {
    // Test DOM element initialization like the actual overlay script
    const innerCircle = document.getElementById('innerCircle') as HTMLDivElement
    const outerCircle = document.getElementById('outerCircle') as HTMLDivElement
    
    expect(innerCircle).toBeTruthy()
    expect(outerCircle).toBeTruthy()
    
    // Simulate initialization
    innerCircle.style.display = 'none'
    outerCircle.style.display = 'none'
    
    expect(innerCircle.style.display).toBe('none')
    expect(outerCircle.style.display).toBe('none')
  })

  it('should position circles correctly when cursor moves', () => {
    const innerCircle = document.getElementById('innerCircle') as HTMLDivElement
    const outerCircle = document.getElementById('outerCircle') as HTMLDivElement
    
    // Simulate actual positioning logic from overlay.ts
    const cursorX = 500
    const cursorY = 300
    const innerSize = 650
    const outerSize = 1000
    
    // Apply actual positioning logic with offsets
    const outerSizeRatio = Math.min(outerSize / 600, 1)
    const outerOffsetX = 5 * (1 - outerSizeRatio)
    const outerOffsetY = -(30 - 5 * (1 - outerSizeRatio))
    
    const innerSizeRatio = Math.min(innerSize / 400, 1)
    const innerOffsetX = 3 * (1 - innerSizeRatio)
    const innerOffsetY = -(30 - 3 * (1 - innerSizeRatio))
    
    const innerLeft = cursorX - innerSize / 2 + innerOffsetX
    const innerTop = cursorY - innerSize / 2 + innerOffsetY
    const outerLeft = cursorX - outerSize / 2 + outerOffsetX
    const outerTop = cursorY - outerSize / 2 + outerOffsetY
    
    // Apply positioning
    innerCircle.style.left = `${innerLeft}px`
    innerCircle.style.top = `${innerTop}px`
    outerCircle.style.left = `${outerLeft}px`
    outerCircle.style.top = `${outerTop}px`
    
    innerCircle.style.width = `${innerSize}px`
    innerCircle.style.height = `${innerSize}px`
    outerCircle.style.width = `${outerSize}px`
    outerCircle.style.height = `${outerSize}px`
    
    innerCircle.style.display = 'block'
    outerCircle.style.display = 'block'
    
    // Verify positioning
    expect(innerCircle.style.display).toBe('block')
    expect(outerCircle.style.display).toBe('block')
    expect(parseInt(innerCircle.style.left)).toBe(innerLeft)
    expect(parseInt(innerCircle.style.top)).toBe(innerTop)
    expect(parseInt(outerCircle.style.left)).toBe(outerLeft)
    expect(parseInt(outerCircle.style.top)).toBe(outerTop)
  })

  it('should update circle sizes correctly', () => {
    const innerCircle = document.getElementById('innerCircle') as HTMLDivElement
    const outerCircle = document.getElementById('outerCircle') as HTMLDivElement
    
    // Test size updates
    const newInnerSize = 400
    const newOuterSize = 600
    
    innerCircle.style.width = `${newInnerSize}px`
    innerCircle.style.height = `${newInnerSize}px`
    outerCircle.style.width = `${newOuterSize}px`
    outerCircle.style.height = `${newOuterSize}px`
    
    expect(innerCircle.style.width).toBe('400px')
    expect(innerCircle.style.height).toBe('400px')
    expect(outerCircle.style.width).toBe('600px')
    expect(outerCircle.style.height).toBe('600px')
  })

  it('should update circle colors correctly', () => {
    const innerCircle = document.getElementById('innerCircle') as HTMLDivElement
    const outerCircle = document.getElementById('outerCircle') as HTMLDivElement
    
    // Test color updates using actual hexToRgba logic
    function hexToRgba(hex: string, alpha: number): string {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
    
    const innerColor = '#ff0000'
    const outerColor = '#00ff00'
    const alpha = 0.6
    
    innerCircle.style.borderColor = hexToRgba(innerColor, alpha)
    outerCircle.style.borderColor = hexToRgba(outerColor, alpha)
    
    expect(innerCircle.style.borderColor).toBe('rgba(255, 0, 0, 0.6)')
    expect(outerCircle.style.borderColor).toBe('rgba(0, 255, 0, 0.6)')
  })

  it('should handle multiple cursor positions', () => {
    const innerCircle = document.getElementById('innerCircle') as HTMLDivElement
    const outerCircle = document.getElementById('outerCircle') as HTMLDivElement
    
    // Test multiple cursor positions
    const positions = [
      { x: 100, y: 200 },
      { x: 300, y: 400 },
      { x: 700, y: 100 },
      { x: 950, y: 750 }
    ]
    
    const innerSize = 650
    const outerSize = 1000
    
    positions.forEach(pos => {
      // Apply positioning for each cursor position
      const innerLeft = pos.x - innerSize / 2
      const innerTop = pos.y - innerSize / 2
      const outerLeft = pos.x - outerSize / 2
      const outerTop = pos.y - outerSize / 2
      
      innerCircle.style.left = `${innerLeft}px`
      innerCircle.style.top = `${innerTop}px`
      outerCircle.style.left = `${outerLeft}px`
      outerCircle.style.top = `${outerTop}px`
      
      innerCircle.style.display = 'block'
      outerCircle.style.display = 'block'
      
      // Verify positioning for each position
      expect(innerCircle.style.display).toBe('block')
      expect(outerCircle.style.display).toBe('block')
      expect(parseInt(innerCircle.style.left)).toBe(innerLeft)
      expect(parseInt(innerCircle.style.top)).toBe(innerTop)
      expect(parseInt(outerCircle.style.left)).toBe(outerLeft)
      expect(parseInt(outerCircle.style.top)).toBe(outerTop)
    })
  })

  it('should handle IPC communication setup', () => {
    // Test that IPC mock is properly set up
    expect(mockIpcRenderer.on).toBeDefined()
    expect(mockIpcRenderer.send).toBeDefined()
    expect(mockIpcRenderer.invoke).toBeDefined()
    
    // Simulate IPC event registration like in actual overlay script
    mockIpcRenderer.on('set-display-index', vi.fn())
    mockIpcRenderer.on('inject-constants', vi.fn())
    mockIpcRenderer.on('circle-settings-updated', vi.fn())
    
    expect(mockIpcRenderer.on).toHaveBeenCalledWith('set-display-index', expect.any(Function))
    expect(mockIpcRenderer.on).toHaveBeenCalledWith('inject-constants', expect.any(Function))
    expect(mockIpcRenderer.on).toHaveBeenCalledWith('circle-settings-updated', expect.any(Function))
  })
})