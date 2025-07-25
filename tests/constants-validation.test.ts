import { describe, it, expect } from 'vitest'
import { DEFAULT_VALUES, CIRCLE_SETTINGS, UI_COLORS, WINDOW_SETTINGS } from '../src/renderer/shared/constants/constants'

describe('Constants Validation', () => {
  it('should have correct DEFAULT_VALUES', () => {
    // Verify all required default values exist
    expect(DEFAULT_VALUES.INNER_SIZE).toBeDefined()
    expect(DEFAULT_VALUES.OUTER_SIZE).toBeDefined()
    expect(DEFAULT_VALUES.INNER_COLOR).toBeDefined()
    expect(DEFAULT_VALUES.OUTER_COLOR).toBeDefined()
    
    // Verify specific values from production code
    expect(DEFAULT_VALUES.INNER_SIZE).toBe(650)
    expect(DEFAULT_VALUES.OUTER_SIZE).toBe(1000)
    expect(DEFAULT_VALUES.INNER_COLOR).toBe('#d0723b')
    expect(DEFAULT_VALUES.OUTER_COLOR).toBe('#e74b4b')
    
    // Verify types
    expect(typeof DEFAULT_VALUES.INNER_SIZE).toBe('number')
    expect(typeof DEFAULT_VALUES.OUTER_SIZE).toBe('number')
    expect(typeof DEFAULT_VALUES.INNER_COLOR).toBe('string')
    expect(typeof DEFAULT_VALUES.OUTER_COLOR).toBe('string')
    
    // Verify color format (hex colors)
    expect(DEFAULT_VALUES.INNER_COLOR).toMatch(/^#[0-9a-f]{6}$/i)
    expect(DEFAULT_VALUES.OUTER_COLOR).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('should have correct CIRCLE_SETTINGS', () => {
    // Verify all required circle settings exist
    expect(CIRCLE_SETTINGS.MIN_SIZE).toBeDefined()
    expect(CIRCLE_SETTINGS.MAX_INNER_SIZE).toBeDefined()
    expect(CIRCLE_SETTINGS.MAX_OUTER_SIZE).toBeDefined()
    expect(CIRCLE_SETTINGS.SIZE_DIFFERENCE).toBeDefined()
    expect(CIRCLE_SETTINGS.BORDER_WIDTH_INNER).toBeDefined()
    expect(CIRCLE_SETTINGS.BORDER_WIDTH_OUTER).toBeDefined()
    expect(CIRCLE_SETTINGS.OPACITY).toBeDefined()
    
    // Verify specific values from production code
    expect(CIRCLE_SETTINGS.MIN_SIZE).toBe(1)
    expect(CIRCLE_SETTINGS.MAX_INNER_SIZE).toBe(1000)
    expect(CIRCLE_SETTINGS.MAX_OUTER_SIZE).toBe(1200)
    expect(CIRCLE_SETTINGS.SIZE_DIFFERENCE).toBe(200)
    expect(CIRCLE_SETTINGS.BORDER_WIDTH_INNER).toBe(16)
    expect(CIRCLE_SETTINGS.BORDER_WIDTH_OUTER).toBe(60)
    expect(CIRCLE_SETTINGS.OPACITY).toBe(0.6)
    
    // Verify types
    expect(typeof CIRCLE_SETTINGS.MIN_SIZE).toBe('number')
    expect(typeof CIRCLE_SETTINGS.MAX_INNER_SIZE).toBe('number')
    expect(typeof CIRCLE_SETTINGS.MAX_OUTER_SIZE).toBe('number')
    expect(typeof CIRCLE_SETTINGS.SIZE_DIFFERENCE).toBe('number')
    expect(typeof CIRCLE_SETTINGS.BORDER_WIDTH_INNER).toBe('number')
    expect(typeof CIRCLE_SETTINGS.BORDER_WIDTH_OUTER).toBe('number')
    expect(typeof CIRCLE_SETTINGS.OPACITY).toBe('number')
    
    // Verify logical relationships
    expect(CIRCLE_SETTINGS.MAX_OUTER_SIZE).toBeGreaterThan(CIRCLE_SETTINGS.MAX_INNER_SIZE)
    expect(CIRCLE_SETTINGS.MAX_INNER_SIZE).toBeGreaterThan(CIRCLE_SETTINGS.MIN_SIZE)
    expect(CIRCLE_SETTINGS.OPACITY).toBeGreaterThan(0)
    expect(CIRCLE_SETTINGS.OPACITY).toBeLessThanOrEqual(1)
  })

  it('should have correct UI_COLORS', () => {
    // Verify all required UI colors exist
    expect(UI_COLORS.BACKGROUND).toBeDefined()
    expect(UI_COLORS.SURFACE).toBeDefined()
    expect(UI_COLORS.PRIMARY).toBeDefined()
    expect(UI_COLORS.TEXT_PRIMARY).toBeDefined()
    expect(UI_COLORS.TEXT_SECONDARY).toBeDefined()
    expect(UI_COLORS.BORDER).toBeDefined()
    
    // Verify specific values from production code
    expect(UI_COLORS.BACKGROUND).toBe('#232233')
    expect(UI_COLORS.SURFACE).toBe('#333343')
    expect(UI_COLORS.PRIMARY).toBe('#8f89fa')
    expect(UI_COLORS.TEXT_PRIMARY).toBe('#fff')
    expect(UI_COLORS.TEXT_SECONDARY).toBe('#8b8aa0')
    expect(UI_COLORS.BORDER).toBe('rgba(139, 138, 160, 0.1)')
    
    // Verify types
    expect(typeof UI_COLORS.BACKGROUND).toBe('string')
    expect(typeof UI_COLORS.SURFACE).toBe('string')
    expect(typeof UI_COLORS.PRIMARY).toBe('string')
    expect(typeof UI_COLORS.TEXT_PRIMARY).toBe('string')
    expect(typeof UI_COLORS.TEXT_SECONDARY).toBe('string')
    expect(typeof UI_COLORS.BORDER).toBe('string')
    
    // Verify color formats
    expect(UI_COLORS.BACKGROUND).toMatch(/^#[0-9a-f]{6}$/i)
    expect(UI_COLORS.SURFACE).toMatch(/^#[0-9a-f]{6}$/i)
    expect(UI_COLORS.PRIMARY).toMatch(/^#[0-9a-f]{6}$/i)
    expect(UI_COLORS.TEXT_PRIMARY).toMatch(/^#[0-9a-f]{3,6}$/i)
    expect(UI_COLORS.TEXT_SECONDARY).toMatch(/^#[0-9a-f]{6}$/i)
    expect(UI_COLORS.BORDER).toMatch(/^rgba\(\d+,\s*\d+,\s*\d+,\s*[\d.]+\)$/)
  })

  it('should have correct WINDOW_SETTINGS', () => {
    // Verify all required window settings exist
    expect(WINDOW_SETTINGS.SETTINGS_WIDTH).toBeDefined()
    expect(WINDOW_SETTINGS.SETTINGS_HEIGHT).toBeDefined()
    
    // Verify specific values from production code
    expect(WINDOW_SETTINGS.SETTINGS_WIDTH).toBe(480)
    expect(WINDOW_SETTINGS.SETTINGS_HEIGHT).toBe(640)
    
    // Verify types
    expect(typeof WINDOW_SETTINGS.SETTINGS_WIDTH).toBe('number')
    expect(typeof WINDOW_SETTINGS.SETTINGS_HEIGHT).toBe('number')
    
    // Verify reasonable window dimensions
    expect(WINDOW_SETTINGS.SETTINGS_WIDTH).toBeGreaterThan(200)
    expect(WINDOW_SETTINGS.SETTINGS_HEIGHT).toBeGreaterThan(200)
    expect(WINDOW_SETTINGS.SETTINGS_WIDTH).toBeLessThan(2000)
    expect(WINDOW_SETTINGS.SETTINGS_HEIGHT).toBeLessThan(2000)
  })

  it('should have consistent relationships between constants', () => {
    // Default sizes should be within valid ranges
    expect(DEFAULT_VALUES.INNER_SIZE).toBeGreaterThanOrEqual(CIRCLE_SETTINGS.MIN_SIZE)
    expect(DEFAULT_VALUES.INNER_SIZE).toBeLessThanOrEqual(CIRCLE_SETTINGS.MAX_INNER_SIZE)
    expect(DEFAULT_VALUES.OUTER_SIZE).toBeLessThanOrEqual(CIRCLE_SETTINGS.MAX_OUTER_SIZE)
    
    // Outer size should be larger than inner size
    expect(DEFAULT_VALUES.OUTER_SIZE).toBeGreaterThan(DEFAULT_VALUES.INNER_SIZE)
    
    // Size difference should be reasonable
    const actualDifference = DEFAULT_VALUES.OUTER_SIZE - DEFAULT_VALUES.INNER_SIZE
    // Note: The actual difference (350) may differ from SIZE_DIFFERENCE constant (200)
    // SIZE_DIFFERENCE is used for auto-adjustment logic, not necessarily the default difference
    expect(actualDifference).toBe(350) // 1000 - 650 = 350
  })

  it('should export all constants correctly', () => {
    // Verify all exports are available
    expect(DEFAULT_VALUES).toBeDefined()
    expect(CIRCLE_SETTINGS).toBeDefined()
    expect(UI_COLORS).toBeDefined()
    expect(WINDOW_SETTINGS).toBeDefined()
    
    // Verify they are objects
    expect(typeof DEFAULT_VALUES).toBe('object')
    expect(typeof CIRCLE_SETTINGS).toBe('object')
    expect(typeof UI_COLORS).toBe('object')
    expect(typeof WINDOW_SETTINGS).toBe('object')
    
    // Verify they are not empty
    expect(Object.keys(DEFAULT_VALUES).length).toBeGreaterThan(0)
    expect(Object.keys(CIRCLE_SETTINGS).length).toBeGreaterThan(0)
    expect(Object.keys(UI_COLORS).length).toBeGreaterThan(0)
    expect(Object.keys(WINDOW_SETTINGS).length).toBeGreaterThan(0)
  })
})