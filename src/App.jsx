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

function App() {
  const [colors, setColors] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [category, setCategory] = useState('random');
  const [mode, setMode] = useState('palette');
  const [gradientColors, setGradientColors] = useState(['#3b82f6', '#8b5cf6']);
  const [gradientType, setGradientType] = useState('linear');
  const [gradientAngle, setGradientAngle] = useState(45);
  const [gradientPosition, setGradientPosition] = useState('center');
  const [favorites, setFavorites] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showLockedOnly, setShowLockedOnly] = useState(false);
  const [activePaletteId, setActivePaletteId] = useState(null);
  const [colorBlindMode, setColorBlindMode] = useState('none');
  const [colorCount, setColorCount_] = useState(10);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showGradientCSS, setShowGradientCSS] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const exportRef = useRef(null);
  const imageInputRef = useRef(null);
  const colorCountRef = useRef(10);
  const modeRef = useRef('palette');
  const categoryRef = useRef('random');
  const gradientLengthRef = useRef(2);

  const setColorCount = (n) => {
    colorCountRef.current = n;
    setColorCount_(n);
    setColors(prev => {
      const newArr = generateColorArray(n, categoryRef.current);
      return newArr.map((hex, i) => ({
        hex: prev[i] && prev[i].isLocked ? prev[i].hex : hex,
        isLocked: prev[i] ? prev[i].isLocked : false
      }));
    });
  };

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    categoryRef.current = category;
  }, [category]);

  useEffect(() => {
    gradientLengthRef.current = gradientColors.length;
  }, [gradientColors.length]);

  useEffect(() => {
    const saved = localStorage.getItem('chromax_favorites');
    let favs = [];
    if (saved) {
      try { favs = JSON.parse(saved); setFavorites(favs); } catch { }
    }
    localStorage.setItem('chromax_favorites', JSON.stringify(favs));
    const activeId = localStorage.getItem('chromax_active_palette');
    if (activeId) {
      try {
        const id = Number(activeId);
        setActivePaletteId(id);
        localStorage.setItem('chromax_active_palette', String(id));
        const savedColors = localStorage.getItem('chromax_colors');
        if (savedColors) {
          try {
            const parsed = JSON.parse(savedColors);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setColors(parsed);
              const palette = favs.find(f => f.id === id);
              if (palette && palette.category) setCategory(palette.category);
              setMode('palette');
              return;
            }
          } catch { }
        }
        const palette = favs.find(f => f.id === id);
        if (palette) {
          if (palette.type === 'gradient') {
            setGradientColors(palette.colors);
            setGradientType(palette.category || 'linear');
            if (palette.extra) {
              setGradientAngle(palette.extra.angle || 45);
              setGradientPosition(palette.extra.position || 'center');
            }
            setMode('gradient');
          } else {
            const sliced = palette.colors.slice(0, colorCount).map(hex => ({ hex, isLocked: false }));
            const padded = [...sliced];
            while (padded.length < colorCount) {
              padded.push({ hex: generateColorArray(1, 'random')[0], isLocked: false });
            }
            setColors(padded);
            if (palette.category) setCategory(palette.category);
            setMode('palette');
          }
        }
      } catch { }
    }
  }, []);

  useEffect(() => {
    if (colors.length > 0) {
      localStorage.setItem('chromax_colors', JSON.stringify(colors));
    }
  }, [colors]);

  useEffect(() => {
    if (colors.length !== colorCountRef.current) {
      setColors(generateColorArray(colorCountRef.current, categoryRef.current).map(hex => ({ hex, isLocked: false })));
    }
  }, []);

  const generateNewPalette = () => {
    if (modeRef.current === 'gradient') {
      const newColors = generateGradientColors(gradientLengthRef.current);
      setGradientColors(newColors);
      return;
    }
    const count = colorCountRef.current;
    const cat = categoryRef.current;
    setColors(prev => {
      const pool = generateColorArray(count, cat);
      const res = [];
      for (let i = 0; i < count; i++) {
        const p = prev[i];
        res.push({
          hex: p && p.isLocked ? p.hex : pool[i],
          isLocked: p ? p.isLocked : false
        });
      }
      return res;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && document.activeElement.tagName !== 'SELECT' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        generateNewPalette();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleLock = (index) => {
    setColors(prev => {
      const newColors = [...prev];
      if (newColors[index]) newColors[index].isLocked = !newColors[index].isLocked;
      return newColors;
    });
  };

  const updateColor = (index, newHex) => {
    setColors(prev => {
      const newColors = [...prev];
      if (newColors[index]) newColors[index].hex = newHex;
      return newColors;
    });
  };

  const updateGradientColor = (index, newHex) => {
    setGradientColors(prev => {
      const newColors = [...prev];
      newColors[index] = newHex;
      return newColors;
    });
  };

  const addGradientStop = () => {
    setGradientColors(prev => [...prev, '#ffffff']);
  };

  const removeGradientStop = (index) => {
    if (gradientColors.length <= 2) return;
    setGradientColors(prev => prev.filter((_, i) => i !== index));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    const id = Date.now();
    setToasts(prev => [...prev, { id, text: 'Nusxa olindi: ' + text }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const saveToFavorites = () => {
    const palette = {
      id: Date.now(),
      name: 'Palitra ' + (favorites.filter(f => f.type !== 'gradient').length + 1),
      colors: mode === 'palette' ? colors.map(c => c.hex) : gradientColors,
      type: mode,
      category: mode === 'palette' ? category : gradientType,
      count: mode === 'palette' ? colors.length : gradientColors.length,
      extra: mode === 'gradient' ? { angle: gradientAngle, position: gradientPosition } : null,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString()
    };
    setFavorites(prev => {
      const updated = [palette, ...prev];
      localStorage.setItem('chromax_favorites', JSON.stringify(updated));
      return updated;
    });
    const id = Date.now() + 1;
    setToasts(prev => [...prev, { id, text: 'Sevimlilarga qoshildi' }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const removeFavorite = (id) => {
    setFavorites(prev => {
      const updated = prev.filter(f => f.id !== id);
      localStorage.setItem('chromax_favorites', JSON.stringify(updated));
      return updated;
    });
  };

  const loadFavorite = (palette) => {
    if (palette.type === 'gradient') {
      setGradientColors(palette.colors);
      setGradientType(palette.category || 'linear');
      if (palette.extra) {
        setGradientAngle(palette.extra.angle || 45);
        setGradientPosition(palette.extra.position || 'center');
      }
      setMode('gradient');
    } else {
      const sliced = palette.colors.slice(0, colorCount).map(hex => ({ hex, isLocked: false }));
      while (sliced.length < colorCount) {
        sliced.push({ hex: generateColorArray(1, 'random')[0], isLocked: false });
      }
      setColors(sliced);
      if (palette.category) setCategory(palette.category);
      setMode('palette');
    }
    setShowFavorites(false);
  };

  const handleExport = (type) => {
    const currentColors = colors.map(c => c.hex);
    setShowExportMenu(false);
    if (type === 'json') {
      const data = { name: 'ChromaX', category, colors: currentColors };
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
      downloadFile(dataStr, 'chromax_palette.json');
    } else if (type === 'css') {
      const css = exportToCSS(currentColors);
      const dataStr = 'data:text/css;charset=utf-8,' + encodeURIComponent(css);
      downloadFile(dataStr, 'chromax_palette.css');
    } else if (type === 'png') {
      const dataUrl = exportToPNG(currentColors);
      downloadFile(dataUrl, 'chromax_palette.png');
    }
  };

  const downloadFile = (dataStr, filename) => {
    const anchor = document.createElement('a');
    anchor.setAttribute('href', dataStr);
    anchor.setAttribute('download', filename);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const importPalette = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data && data.colors && Array.isArray(data.colors)) {
          const sliced = data.colors.slice(0, colorCount);
          const padded = sliced.map(hex => ({ hex, isLocked: false }));
          while (padded.length < colorCount) {
            padded.push({ hex: generateColorArray(1, 'random')[0], isLocked: false });
          }
          setColors(padded);
          if (data.category) setCategory(data.category);
        }
      } catch {
        alert('Notogri fayl formati!');
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const getDisplayColor = useCallback((hex) => {
    return colorBlindMode !== 'none' ? simulateColorBlindness(hex, colorBlindMode) : hex;
  }, [colorBlindMode]);

  const displayColors = useMemo(() => colors.map(c => ({
    ...c,
    displayHex: getDisplayColor(c.hex)
  })), [colors, getDisplayColor]);

  const visibleColors = useMemo(() => {
    let items = displayColors.slice(0, colorCount);
    if (showLockedOnly) {
      const locked = items.filter(c => c.isLocked);
      if (locked.length > 0) items = locked;
    }
    return items;
  }, [displayColors, colorCount, showLockedOnly]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsExtracting(true);
    try {
      const extracted = await extractColorsFromImage(file, 20);
      const sliced = extracted.slice(0, colorCount).map(hex => ({ hex, isLocked: false }));
      while (sliced.length < colorCount) {
        sliced.push({ hex: generateColorArray(1, 'random')[0], isLocked: false });
      }
      setColors(sliced);
      setMode('palette');
      const id = Date.now();
      setToasts(prev => [...prev, { id, text: extracted.length + ' ta rang ajratib olindi' }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    } catch {
      alert('Rang ajratib olishda xatolik!');
    }
    setIsExtracting(false);
    e.target.value = null;
  };

  const gradientCSS = buildGradientCSS(gradientType, gradientColors, gradientAngle, gradientPosition);

  const gradientPreviewStyle = {
    background: gradientCSS
  };

  const handleGradientPreset = (angle) => {
    setGradientAngle(Number(angle));
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect x="2" y="2" width="12" height="12" rx="3" fill="#6366f1"/>
              <rect x="18" y="2" width="12" height="12" rx="3" fill="#06b6d4"/>
              <rect x="2" y="18" width="12" height="12" rx="3" fill="#f59e0b"/>
              <rect x="18" y="18" width="12" height="12" rx="3" fill="#ef4444"/>
            </svg>
            <span className="logo-text">ChromaX</span>
          </div>
          <p className="subtitle">Ranglar Studiyasi</p>
        </div>
        <div className="header-actions">
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
          <div className="gradient-preview" style={gradientPreviewStyle}>
            <div className="gradient-overlay">
              <span className="gradient-label">Gradiyent</span>
              <div className="gradient-type-badge">{gradientType}</div>
            </div>
          </div>

          <div className="gradient-controls-panel">
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
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => updateGradientColor(index, e.target.value)}
                  />
                  <span className="gradient-hex-label">{color}</span>
                </div>
              ))}
              <button className="add-stop-btn" onClick={addGradientStop} title="Rang qoshish">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
            </div>

            {gradientType !== 'radial' && (
              <div className="gradient-angle-control">
                <label>Burchak: {gradientAngle} gradus</label>
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
            )}

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

            <div className="gradient-css-section">
              <button
                className="gradient-css-toggle"
                onClick={() => setShowGradientCSS(!showGradientCSS)}
              >
                {showGradientCSS ? 'CSS ni yopish' : 'CSS kodi'}
              </button>
              {showGradientCSS && (
                <div className="gradient-css-output">
                  <code>{gradientCSS}</code>
                  <button
                    className="copy-css-btn"
                    onClick={() => copyToClipboard(gradientCSS)}
                    title="CSS nusxalash"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {colorBlindMode !== 'none' && (
              <div
                className="gradient-cb-preview"
                style={{ background: buildGradientCSS(gradientType, gradientColors.map(c => getDisplayColor(c)), gradientAngle, gradientPosition) }}
              >
                <span>Daltonik korinishi</span>
              </div>
            )}
          </div>
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

        <div className="counter-group">
          {[{n:3, l:'3 ta'}, {n:5, l:'5 ta'}, {n:8, l:'8 ta'}, {n:10, l:'10 ta'}].map(item => (
            <button
              key={item.n}
              className={'counter-pill' + (colorCount === item.n ? ' active' : '')}
              onClick={() => setColorCount(item.n)}
            >
              {item.l}
            </button>
          ))}
        </div>

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

        <button className="btn-primary" onClick={generateNewPalette}>
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
