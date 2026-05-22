import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import './App.css';
import {
  generateColorArray,
  getContrastColor,
  generateGradientColors,
  simulateColorBlindness,
  exportToCSS,
  exportToPNG,
  buildGradientCSS,
  extractColorsFromImage
} from './utils/colors';

const TOTAL_COLORS = 10;

const GRADIENT_PRESETS = [
  { label: '0', value: '0' },
  { label: '45', value: '45' },
  { label: '90', value: '90' },
  { label: '135', value: '135' },
  { label: '180', value: '180' },
  { label: '225', value: '225' },
  { label: '270', value: '270' },
  { label: '315', value: '315' }
];

const GRADIENT_DIRECTIONS = [
  { label: 'Tepa', value: 'top' },
  { label: 'Ong', value: 'right' },
  { label: 'Past', value: 'bottom' },
  { label: 'Chap', value: 'left' },
  { label: 'Markaz', value: 'center' },
  { label: 'Tepa-Ong', value: 'top right' },
  { label: 'Tepa-Chap', value: 'top left' },
  { label: 'Past-Ong', value: 'bottom right' },
  { label: 'Past-Chap', value: 'bottom left' }
];

const GRADIENT_THEME_PRESETS = [
  { name: 'Sunset', colors: ['#FF6B35', '#F7C59F', '#EFEFD0', '#004E89', '#1A659E'] },
  { name: 'Ocean', colors: ['#0077B6', '#00B4D8', '#90E0EF', '#CAF0F8', '#023E8A'] },
  { name: 'Neon', colors: ['#FF006E', '#FB5607', '#FFBE0B', '#8338EC', '#3A86FF'] },
  { name: 'Forest', colors: ['#2D6A4F', '#40916C', '#52B788', '#95D5B2', '#D8F3DC'] },
  { name: 'Lavender', colors: ['#7B2CBF', '#9D4EDD', '#C77DFF', '#E0AAFF', '#FF99E8'] },
  { name: 'Fire', colors: ['#470024', '#8A0538', '#CD103F', '#F57336', '#FFC857'] },
  { name: 'Sahar', colors: ['#FF9A9E', '#FECFEF', '#FEE140', '#FA709A', '#FC8B9E'] },
  { name: 'Muz', colors: ['#00C9FF', '#92FE9D', '#0ABFBC', '#E0F7FA', '#80DEEA'] },
  { name: 'Yoz', colors: ['#FC5C7D', '#6A82FB', '#F2994A', '#F2C94C', '#EB5757'] },
  { name: 'Zumrad', colors: ['#11998E', '#38EF7D', '#0B8457', '#6EE2A2', '#1DB954'] }
];

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return { r: parseInt(h.substr(0, 2), 16), g: parseInt(h.substr(2, 2), 16), b: parseInt(h.substr(4, 2), 16) };
}

function generateCSSVars(colors) {
  let css = ':root {\n';
  colors.forEach((hex, i) => {
    css += `  --color-${i + 1}: ${hex};\n`;
  });
  css += '}';
  return css;
}

function generateRGBVars(colors) {
  let css = ':root {\n';
  colors.forEach((hex, i) => {
    const { r, g, b } = hexToRgb(hex);
    css += `  --color-${i + 1}: ${r}, ${g}, ${b};\n`;
  });
  css += '}';
  return css;
}

function generateTailwindConfig(colors) {
  let tw = '// tailwind.config.js / theme.extend.colors\ncolors: {\n  palette: {\n';
  colors.forEach((hex, i) => {
    tw += `    ${(i + 1) * 100}: '${hex}',\n`;
  });
  tw += '  }\n}';
  return tw;
}

function generateSCSSVars(colors) {
  let scss = '';
  colors.forEach((hex, i) => {
    scss += `$$color-${i + 1}: ${hex};\n`;
  });
  return scss.trim();
}

function generateLESSVars(colors) {
  let less = '';
  colors.forEach((hex, i) => {
    less += `@color-${i + 1}: ${hex};\n`;
  });
  return less.trim();
}

function CodePanelContent({ colors, gradientCode }) {
  const [tab, setTab] = useState('css');
  const [copied, setCopied] = useState(false);

  const codeMap = {
    css: generateCSSVars(colors),
    rgb: generateRGBVars(colors),
    tailwind: generateTailwindConfig(colors),
    scss: generateSCSSVars(colors),
    less: generateLESSVars(colors),
  };

  const code = codeMap[tab];

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-panel-inner">
      {gradientCode && (
        <div className="code-gradient-bar">
          <code>{gradientCode}</code>
          <button className="copy-mini-btn" onClick={() => { navigator.clipboard.writeText(gradientCode); }} title="Nusxalash">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>
        </div>
      )}
      <div className="code-tabs">
        <button className={'code-tab' + (tab === 'css' ? ' active' : '')} onClick={() => setTab('css')}>CSS</button>
        <button className={'code-tab' + (tab === 'rgb' ? ' active' : '')} onClick={() => setTab('rgb')}>RGB</button>
        <button className={'code-tab' + (tab === 'tailwind' ? ' active' : '')} onClick={() => setTab('tailwind')}>Tailwind</button>
        <button className={'code-tab' + (tab === 'scss' ? ' active' : '')} onClick={() => setTab('scss')}>SCSS</button>
        <button className={'code-tab' + (tab === 'less' ? ' active' : '')} onClick={() => setTab('less')}>LESS</button>
      </div>
      <div className="code-body">
        <pre>{code}</pre>
        <button className="code-copy-btn" onClick={copyCode}>
          {copied ? 'Nusxa olindi' : 'Nusxa Olish'}
        </button>
      </div>
    </div>
  );
}

function App() {
  const [colors, setColors] = useState(() => {
    try {
      const saved = localStorage.getItem('chromax_colors');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    const arr = generateColorArray(5, 'random');
    return arr.map(c => ({ hex: c, isLocked: false }));
  });

  const [mode, setMode] = useState('palette');
  const [category, setCategory] = useState(() => {
    try {
      const saved = localStorage.getItem('chromax_category');
      if (saved) return saved;
    } catch (e) {}
    return 'random';
  });
  const [colorCount, setColorCount] = useState(5);
  const [gradientColors, setGradientColors] = useState(() => generateGradientColors(3));
  const [gradientType, setGradientType] = useState('linear');
  const [gradientAngle, setGradientAngle] = useState(135);
  const [gradientPosition, setGradientPosition] = useState('center');
  const [gradientStops, setGradientStops] = useState([]);
  const [gradientPreset, setGradientPreset] = useState(null);
  const [colorBlindMode, setColorBlindMode] = useState('none');
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('chromax_favorites');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [showFavorites, setShowFavorites] = useState(false);
  const [showCodePanel, setShowCodePanel] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [colorInputFocused, setColorInputFocused] = useState(false);
  const [activePaletteId, setActivePaletteId] = useState(() => {
    try {
      return localStorage.getItem('chromax_active_palette') || null;
    } catch (e) { return null; }
  });
  const [isExtracting, setIsExtracting] = useState(false);

  const codePanelRef = useRef(null);
  const exportRef = useRef(null);
  const imageInputRef = useRef(null);

  useEffect(() => {
    if (colors.length > 0) {
      localStorage.setItem('chromax_colors', JSON.stringify(colors));
    }
  }, [colors]);

  useEffect(() => {
    if (category) {
      localStorage.setItem('chromax_category', category);
    }
  }, [category]);

  useEffect(() => {
    if (gradientStops.length !== gradientColors.length) {
      setGradientStops(gradientColors.map((_, i) =>
        Math.round(i * 100 / (gradientColors.length - 1 || 1))
      ));
    }
  }, [gradientColors.length]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (codePanelRef.current && !codePanelRef.current.contains(e.target)) {
        const btn = document.querySelector('.header-btn.code-toggle');
        if (btn && btn.contains(e.target)) return;
        setShowCodePanel(false);
      }
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (e.code === 'Space' || e.key === ' ' || e.keyCode === 32) {
        e.preventDefault();
        generateNewPalette();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const getDisplayColor = useCallback((hex) => {
    if (colorBlindMode === 'none') return hex;
    return simulateColorBlindness(hex, colorBlindMode);
  }, [colorBlindMode]);

  const visibleColors = useMemo(() => {
    return colors.map(c => ({
      ...c,
      displayHex: getDisplayColor(c.hex)
    }));
  }, [colors, getDisplayColor]);

  const gradientStopsStr = gradientColors.map((c, i) =>
    `${c} ${(gradientStops[i] !== undefined ? gradientStops[i] : Math.round(i * 100 / (gradientColors.length - 1 || 1)))}%`
  ).join(', ');

  const gradientCSSWithStops = gradientType === 'linear'
    ? `linear-gradient(${gradientAngle}deg, ${gradientStopsStr})`
    : `conic-gradient(from ${gradientAngle}deg at ${gradientPosition || 'center'}, ${gradientStopsStr})`;

  const gradientPreviewStyle = {
    background: gradientCSSWithStops
  };

  function addToast(text, type) {
    const id = Date.now();
    setToasts(prev => [...prev, { id, text, type: type || 'info' }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }

  function toggleLock(index) {
    setColors(prev => prev.map((c, i) =>
      i === index ? { ...c, isLocked: !c.isLocked } : c
    ));
  }

  function updateColor(index, newHex) {
    setColors(prev => prev.map((c, i) =>
      i === index ? { ...c, hex: newHex } : c
    ));
  }

  function generateNewPalette(newCount, newCategory) {
    const count = newCount !== undefined ? newCount : colorCount;
    const cat = newCategory || category;
    if (mode === 'palette') {
      let newHexes = generateColorArray(count, cat);
      if (!newHexes || newHexes.length === 0) {
        newHexes = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
      }
      const sliced = newHexes.slice(0, count);
      setColors(prev => {
        const updated = [];
        for (let i = 0; i < count; i++) {
          if (prev[i] && prev[i].isLocked) {
            updated.push(prev[i]);
          } else {
            updated.push({ hex: sliced[i] || '#888888', isLocked: false });
          }
        }
        return updated;
      });
      setGradientPreset(null);
    } else {
      const newColors = generateGradientColors(gradientColors.length);
      setGradientColors(newColors);
      setGradientPreset(null);
    }
  }

  function saveToFavorites() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('uz-UZ');
    const timeStr = now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
    const palette = {
      id: Date.now().toString(),
      name: `Palitra ${favorites.length + 1}`,
      type: mode,
      category: mode === 'palette' ? category : gradientType,
      count: mode === 'palette' ? colors.length : gradientColors.length,
      colors: mode === 'palette' ? colors.map(c => c.hex) : gradientColors,
      gradientType: mode === 'gradient' ? gradientType : undefined,
      gradientAngle: mode === 'gradient' ? gradientAngle : undefined,
      gradientStops: mode === 'gradient' ? gradientStops : undefined,
      date: dateStr,
      time: timeStr
    };
    const updated = [...favorites, palette];
    setFavorites(updated);
    localStorage.setItem('chromax_favorites', JSON.stringify(updated));
    addToast('Palitra sevimlilarga qoshildi', 'success');
  }

  function removeFavorite(id) {
    const updated = favorites.filter(p => p.id !== id);
    setFavorites(updated);
    localStorage.setItem('chromax_favorites', JSON.stringify(updated));
  }

  function loadFavorite(palette) {
    if (palette.type === 'gradient') {
      setMode('gradient');
      setGradientColors(palette.colors);
      if (palette.gradientType) setGradientType(palette.gradientType);
      if (palette.gradientAngle) setGradientAngle(palette.gradientAngle);
      if (palette.gradientStops) setGradientStops(palette.gradientStops);
    } else {
      setMode('palette');
      setColors(palette.colors.map(c => ({ hex: c, isLocked: false })));
      if (palette.category) setCategory(palette.category);
    }
    setShowFavorites(false);
  }

  function applyGradientPreset(name, colors) {
    setGradientColors(colors);
    setGradientPreset(name);
  }

  function addGradientStop() {
    if (gradientColors.length >= 10) return;
    const lastColor = gradientColors[gradientColors.length - 1] || '#888888';
    const lastStop = gradientStops[gradientStops.length - 1] || 100;
    const newPos = Math.min(100, lastStop - 10);
    setGradientColors(prev => [...prev, lastColor]);
    setGradientStops(prev => [...prev, Math.round(newPos)]);
  }

  function removeGradientStop(index) {
    if (gradientColors.length <= 2) return;
    setGradientColors(prev => prev.filter((_, i) => i !== index));
    setGradientStops(prev => prev.filter((_, i) => i !== index));
  }

  function updateGradientColor(index, newHex) {
    setGradientColors(prev => prev.map((c, i) => i === index ? newHex : c));
  }

  function updateGradientStop(index, value) {
    setGradientStops(prev => prev.map((s, i) => i === index ? value : s));
  }

  function handleGradientPreset(value) {
    setGradientAngle(Number(value));
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    addToast('Nusxa olindi!', 'success');
  }

  function handleExport(format) {
    if (mode === 'palette') {
      const hexes = colors.map(c => c.hex);
      if (format === 'json') {
        const json = JSON.stringify({ colors: hexes, category }, null, 2);
        downloadFile(json, 'palette.json', 'application/json');
      } else if (format === 'css') {
        const css = exportToCSS(hexes);
        downloadFile(css, 'palette.css', 'text/css');
      } else if (format === 'png') {
        exportToPNG(hexes);
      }
    } else {
      if (format === 'json') {
        const json = JSON.stringify({
          colors: gradientColors,
          type: gradientType,
          angle: gradientAngle,
          stops: gradientStops
        }, null, 2);
        downloadFile(json, 'gradient.json', 'application/json');
      } else if (format === 'css') {
        downloadFile(gradientCSSWithStops, 'gradient.css', 'text/css');
      } else if (format === 'png') {
        exportToPNG(gradientColors);
      }
    }
    setShowExportMenu(false);
  }

  function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importPalette(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.colors && Array.isArray(data.colors)) {
          setColors(data.colors.map(c => ({ hex: c, isLocked: false })));
          setMode('palette');
          if (data.category) setCategory(data.category);
          addToast('Palitra yuklandi', 'success');
        }
      } catch (err) {
        addToast('Xatolik: fayl formati notogri', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setIsExtracting(true);
    try {
      const hexes = await extractColorsFromImage(file, colorCount);
      setColors(hexes.map(c => ({ hex: c, isLocked: false })));
      setMode('palette');
      addToast('Ranglar rasmdan olindi', 'success');
    } catch (err) {
      addToast('Rang ajratib olishda xatolik', 'error');
    }
    setIsExtracting(false);
    e.target.value = '';
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <svg width="28" height="28" viewBox="0 0 28 28">
              <rect x="0" y="0" width="12" height="12" rx="2" fill="#FF6B35"/>
              <rect x="14" y="0" width="12" height="12" rx="2" fill="#00B4D8"/>
              <rect x="0" y="14" width="12" height="12" rx="2" fill="#8338EC"/>
              <rect x="14" y="14" width="12" height="12" rx="2" fill="#06D6A0"/>
            </svg>
            <span className="logo-text">ChromaX</span>
          </div>
        </div>
        <div className="header-actions">
          <button
            className={'header-btn' + (showCodePanel ? ' active' : '')}
            onClick={() => setShowCodePanel(!showCodePanel)}
            title="Kod paneli"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
            </svg>
          </button>
          <div className="code-wrapper" ref={codePanelRef}>
            {showCodePanel && (
              <div className="code-panel">
                <CodePanelContent
                key={mode + '-' + (mode === 'palette' ? colors.map(c => c.hex).join('') : gradientColors.join(''))}
                colors={mode === 'palette' ? colors.map(c => c.hex) : gradientColors}
                gradientCode={mode === 'gradient' ? gradientCSSWithStops : null}
                />
              </div>
            )}
          </div>
          <button
            className={'header-btn' + (colorBlindMode !== 'none' ? ' active' : '')}
            onClick={() => setColorBlindMode(prev => prev === 'none' ? 'deuteranopia' : 'none')}
            title="Daltonik rejimi"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="9"/>
            </svg>
          </button>
          {colorBlindMode !== 'none' && (
            <select
              className="cb-select"
              value={colorBlindMode}
              onChange={(e) => setColorBlindMode(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            >
              <option value="protanopia">Protanopia</option>
              <option value="deuteranopia">Deuteranopia</option>
              <option value="tritanopia">Tritanopia</option>
            </select>
          )}
        </div>
      </header>

      {colorBlindMode !== 'none' && (
        <div className="cb-active-bar">
          Daltonik rejimi: {colorBlindMode === 'protanopia' ? 'Protanopia' : colorBlindMode === 'deuteranopia' ? 'Deuteranopia' : 'Tritanopia'}
        </div>
      )}

      {mode === 'palette' ? (
        <main className="palette-wrapper">
          <div
            className="palette"
            style={{
              gridTemplateColumns: 'repeat(' + Math.min(visibleColors.length, 5) + ', 1fr)',
              gridTemplateRows: 'repeat(' + Math.ceil(visibleColors.length / Math.min(visibleColors.length, 5)) + ', 1fr)'
            }}
          >
            {visibleColors.map((colorObj, index) => {
              const contrastColor = getContrastColor(colorObj.displayHex);
              return (
                <div
                  key={index}
                  className="color-column"
                  style={{ backgroundColor: colorObj.displayHex }}
                  onClick={(e) => {
                    if (e.target.closest('.controls') || e.target.closest('.color-picker-wrapper')) return;
                    copyToClipboard(colorObj.hex);
                  }}
                >
                  <div className="color-info" style={{ color: contrastColor }}>
                    <div className="hex-value" style={{ animationDelay: (index * 0.05) + 's' }}>
                      {colorObj.hex}
                    </div>
                    <div className="controls">
                      <button
                        className="btn-icon"
                        onClick={(e) => { e.stopPropagation(); toggleLock(index); }}
                        title={colorObj.isLocked ? 'Ochish' : 'Qulflash'}
                        style={{ color: contrastColor }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          {colorObj.isLocked ? (
                            <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>
                          ) : (
                            <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></>
                          )}
                        </svg>
                      </button>
                      <div className="color-picker-wrapper">
                        <input
                          type="color"
                          className="color-picker-input"
                          value={colorObj.hex}
                          onChange={(e) => updateColor(index, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          title="Rang tanlash"
                        />
                      </div>
                      </div>
                    </div>
                  </div>
              );
            })}
          </div>
        </main>
      ) : (
        <main className="gradient-view">
          <div className="gradient-controls-panel">
            <div className="gradient-controls-left">
              <div className="gradient-type-selector">
                {['linear', 'conic'].map(type => (
                  <button
                    key={type}
                    className={'type-btn' + (gradientType === type ? ' active' : '')}
                    onClick={() => setGradientType(type)}
                  >
                    {type === 'linear' ? 'Chiziqli' : 'Konus'}
                  </button>
                ))}
              </div>

              <div className="gradient-section-header">
                <span>Ranglar</span>
                <div className="gradient-preset-row">
                  {GRADIENT_THEME_PRESETS.map(p => (
                    <button
                      key={p.name}
                      className={'preset-swatch-btn' + (gradientPreset === p.name ? ' active' : '')}
                      onClick={() => applyGradientPreset(p.name, p.colors)}
                      title={p.name}
                    >
                      {p.colors.map((c, i) => (
                        <span key={i} className="preset-swatch" style={{ backgroundColor: c }} />
                      ))}
                    </button>
                  ))}
                </div>
              </div>

              <div className="gradient-color-inputs">
                {gradientColors.map((color, index) => (
                  <div key={index} className="gradient-color-item">
                    <div className="gradient-color-item-header">
                      <label>R{index + 1}</label>
                      {gradientColors.length > 2 && (
                        <button
                          className="remove-stop-btn"
                          onClick={() => removeGradientStop(index)}
                          title="Ochirish"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      )}
                    </div>
                    <div className="gradient-color-row">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => updateGradientColor(index, e.target.value)}
                      />
                      <div className="gradient-stop-control">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={gradientStops[index] || 0}
                          onChange={(e) => updateGradientStop(index, Number(e.target.value))}
                          className="stop-range"
                        />
                      </div>
                    </div>
                    <span className="gradient-hex-label">{color}</span>
                  </div>
                ))}
                <div className="add-stop-row">
                  {gradientColors.length < 10 && (
                    <button className="add-stop-btn" onClick={addGradientStop} title="Rang qoshish">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </button>
                  )}
                  <span className="stop-count">{gradientColors.length}/10</span>
                </div>
              </div>
            </div>

            <div className="gradient-controls-right">
              <div className="gradient-angle-control">
                <label>Burchak: {gradientAngle}°</label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={gradientAngle}
                  onChange={(e) => setGradientAngle(Number(e.target.value))}
                />
                <div className="angle-presets">
                  {GRADIENT_PRESETS.map(p => (
                    <button
                      key={p.value}
                      className={'preset-btn' + (gradientAngle === Number(p.value) ? ' active' : '')}
                      onClick={() => handleGradientPreset(p.value)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="gradient-direction-control">
                <label>Joylashuv</label>
                <div className="direction-presets">
                  {GRADIENT_DIRECTIONS.map(d => (
                    <button
                      key={d.value}
                      className={'preset-btn dir-btn' + (gradientPosition === d.value ? ' active' : '')}
                      onClick={() => setGradientPosition(d.value)}
                      title={d.label}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="gradient-preview" style={gradientPreviewStyle}>
            <div className="gradient-overlay">
              <div className="gradient-label-row">
                <span className="gradient-label">Gradiyent</span>
                <div className="gradient-type-badge">{gradientType === 'linear' ? 'Chiziqli' : 'Konus'}</div>
              </div>
              <div className="gradient-colors-mini">
                {gradientColors.map((c, i) => (
                  <div key={i} className="gradient-mini-dot" style={{ backgroundColor: c }} title={`${c} ${gradientStops[i]}%`} />
                ))}
              </div>
            </div>
          </div>

          {colorBlindMode !== 'none' && (
              <div
                className="gradient-cb-preview"
                style={{
                  background: gradientType === 'linear'
                    ? `linear-gradient(${gradientAngle}deg, ${gradientColors.map((c, i) => `${getDisplayColor(c)} ${(gradientStops[i] !== undefined ? gradientStops[i] : Math.round(i * 100 / (gradientColors.length - 1 || 1)))}%`).join(', ')})`
                    : `conic-gradient(from ${gradientAngle}deg at ${gradientPosition || 'center'}, ${gradientColors.map((c, i) => `${getDisplayColor(c)} ${(gradientStops[i] !== undefined ? gradientStops[i] : Math.round(i * 100 / (gradientColors.length - 1 || 1)))}%`).join(', ')})`
                }}
              >
                <span>Daltonik korinishi</span>
              </div>
            )}
        </main>
      )}

      <div className="toolbar">
        <div className="mode-toggle">
          <button
            className={'mode-btn' + (mode === 'palette' ? ' active' : '')}
            onClick={() => setMode('palette')}
          >
            Palitra
          </button>
          <button
            className={'mode-btn' + (mode === 'gradient' ? ' active' : '')}
            onClick={() => setMode('gradient')}
          >
            Gradiyent
          </button>
        </div>

        <label className="btn-secondary" title="JSON import">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <input type="file" accept=".json" style={{ display: 'none' }} onChange={importPalette} />
        </label>

        <label className={'btn-secondary' + (isExtracting ? ' loading' : '')} title="Rasmdan rang olish">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
          </svg>
          <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
        </label>

        {mode === 'palette' && (
          <div className="counter-group">
            {[{n:3, l:'3 ta'}, {n:5, l:'5 ta'}, {n:8, l:'8 ta'}, {n:10, l:'10 ta'}].map(item => (
              <button
                key={item.n}
                className={'counter-pill' + (colorCount === item.n ? ' active' : '')}
                onClick={() => { setColorCount(item.n); generateNewPalette(item.n); }}
              >
                {item.l}
              </button>
            ))}
          </div>
        )}

        {mode === 'palette' && (
          <select
            className="category-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            title="Rang uslubi"
          >
            <option value="random">Tasodifiy</option>
            <option value="harmonious">Uygun</option>
            <option value="pastel">Pastel</option>
            <option value="neon">Neon</option>
            <option value="dark">Tog ranglar</option>
          </select>
        )}

        <button className="btn-primary" onClick={(e) => { e.preventDefault(); generateNewPalette(); }}>
          <span>Yangi ranglar</span>
          <small className="key-hint">(Space)</small>
        </button>

        <div className="toolbar-right">
          <button className="btn-secondary" onClick={saveToFavorites} title="Sevimlilarga qoshish">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>

          <button
            className="btn-secondary"
            onClick={() => setShowFavorites(true)}
            title="Sevimlilar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            {favorites.length > 0 && <span className="badge">{favorites.length}</span>}
          </button>

          <div className="export-wrapper" ref={exportRef}>
            <button className="btn-secondary" onClick={() => setShowExportMenu(!showExportMenu)} title="Yuklab olish">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </button>
            {showExportMenu && (
              <div className="export-menu">
                <button onClick={() => handleExport('json')}>JSON</button>
                <button onClick={() => handleExport('css')}>CSS</button>
                <button onClick={() => handleExport('png')}>PNG</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showFavorites && (
        <div className="favorites-overlay" onClick={() => setShowFavorites(false)}>
          <div className="favorites-panel" onClick={(e) => e.stopPropagation()}>
            <div className="favorites-header">
              <h2>Sevimli Palitralar</h2>
              <button className="btn-close" onClick={() => setShowFavorites(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="favorites-list">
              {favorites.length === 0 ? (
                <p className="favorites-empty">Hali palitra saqlanmadi</p>
              ) : (
                favorites.map((palette) => (
                  <div key={palette.id} className="favorite-item">
                    <div className="favorite-colors">
                      {palette.colors.slice(0, 10).map((hex, i) => (
                        <div
                          key={i}
                          className="favorite-color-swatch"
                          style={{ backgroundColor: hex }}
                          title={hex}
                        />
                      ))}
                    </div>
                    <div className="favorite-info">
                      <span className="favorite-name">{palette.name}</span>
                      <span className="favorite-meta">
                        {palette.type === 'gradient' ? 'Gradient' : palette.category} &middot; {palette.count}ta rang
                      </span>
                      <span className="favorite-date">{palette.date} {palette.time || ''}</span>
                    </div>
                    <div className="favorite-actions">
                      <button
                        className={'eye-btn' + (activePaletteId === palette.id ? ' active' : '')}
                        onClick={() => { setActivePaletteId(palette.id); localStorage.setItem('chromax_active_palette', String(palette.id)); loadFavorite(palette); }}
                        title="Asosiy ekranda korsatish"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                      <button onClick={() => { setActivePaletteId(palette.id); localStorage.setItem('chromax_active_palette', String(palette.id)); loadFavorite(palette); }} title="Yuklash">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                      </button>
                      <button onClick={() => removeFavorite(palette.id)} title="Ochirish">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className="toast">
            <span>{toast.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
