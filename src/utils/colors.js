const hslToHex = (h, s, l) => {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

export const generateColorArray = (count, category = 'random') => {
  const newColors = [];
  const harmoniousBaseHue = Math.floor(Math.random() * 360);

  for (let i = 0; i < count; i++) {
    if (category === 'harmonious') {
      const h = (harmoniousBaseHue + (i * (360 / count))) % 360;
      const s = 60 + Math.random() * 30;
      const l = 40 + Math.random() * 30;
      newColors.push(hslToHex(h, s, l));
    } else if (category === 'pastel') {
      const h = Math.floor(Math.random() * 360);
      const s = 60 + Math.floor(Math.random() * 40);
      const l = 75 + Math.floor(Math.random() * 15);
      newColors.push(hslToHex(h, s, l));
    } else if (category === 'dark') {
      const h = Math.floor(Math.random() * 360);
      const s = 40 + Math.floor(Math.random() * 40);
      const l = 10 + Math.floor(Math.random() * 20);
      newColors.push(hslToHex(h, s, l));
    } else if (category === 'neon') {
      const h = Math.floor(Math.random() * 360);
      const s = 80 + Math.floor(Math.random() * 20);
      const l = 45 + Math.floor(Math.random() * 15);
      newColors.push(hslToHex(h, s, l));
    } else {
      const h = Math.floor(Math.random() * 360);
      const s = Math.floor(Math.random() * 100);
      const l = 20 + Math.floor(Math.random() * 70);
      newColors.push(hslToHex(h, s, l));
    }
  }
  return newColors;
};

export const getContrastColor = (hexColor) => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1a1a2e' : '#ffffff';
};

export const generateGradientColors = (count = 2) => {
  const baseHue = Math.floor(Math.random() * 360);
  const colors = [];
  for (let i = 0; i < count; i++) {
    const hue = (baseHue + i * (30 + Math.floor(Math.random() * 40))) % 360;
    colors.push(hslToHex(hue, 70 + Math.floor(Math.random() * 30), 40 + Math.floor(Math.random() * 30)));
  }
  return colors;
};

const rgbToHex = (r, g, b) => {
  return '#' + [r, g, b].map(x => Math.round(x).toString(16).padStart(2, '0')).join('');
};

const hexToRgb = (hex) => {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substr(0, 2), 16),
    g: parseInt(h.substr(2, 2), 16),
    b: parseInt(h.substr(4, 2), 16)
  };
};

const cbMatrices = {
  protanopia: [
    [0.567, 0.433, 0],
    [0.558, 0.442, 0],
    [0, 0.242, 0.758]
  ],
  deuteranopia: [
    [0.625, 0.375, 0],
    [0.7, 0.3, 0],
    [0, 0.3, 0.7]
  ],
  tritanopia: [
    [0.95, 0.05, 0],
    [0, 0.433, 0.567],
    [0, 0.475, 0.525]
  ]
};

export const simulateColorBlindness = (hex, type) => {
  if (type === 'none') return hex;
  const matrix = cbMatrices[type];
  if (!matrix) return hex;

  const { r, g, b } = hexToRgb(hex);
  const nr = matrix[0][0] * r + matrix[0][1] * g + matrix[0][2] * b;
  const ng = matrix[1][0] * r + matrix[1][1] * g + matrix[1][2] * b;
  const nb = matrix[2][0] * r + matrix[2][1] * g + matrix[2][2] * b;

  return rgbToHex(
    Math.min(255, Math.max(0, nr)),
    Math.min(255, Math.max(0, ng)),
    Math.min(255, Math.max(0, nb))
  );
};

export const exportToCSS = (colors, paletteName = 'chromax') => {
  let css = ':root {\n';
  colors.forEach((hex, i) => {
    css += `  --${paletteName}-color-${i + 1}: ${hex};\n`;
  });
  css += '}\n';
  return css;
};

export const exportToPNG = (colors, cellSize = 100) => {
  const canvas = document.createElement('canvas');
  const cols = Math.min(colors.length, 5);
  const rows = Math.ceil(colors.length / cols);
  canvas.width = cols * cellSize;
  canvas.height = rows * cellSize;
  const ctx = canvas.getContext('2d');

  colors.forEach((hex, i) => {
    const x = (i % cols) * cellSize;
    const y = Math.floor(i / cols) * cellSize;
    ctx.fillStyle = hex;
    ctx.fillRect(x, y, cellSize, cellSize);
    const contrast = getContrastColor(hex);
    ctx.fillStyle = contrast;
    ctx.font = '14px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(hex.toUpperCase(), x + cellSize / 2, y + cellSize / 2);
  });

  return canvas.toDataURL('image/png');
};

export const extractColorsFromImage = (imageFile, count = 10) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(200 / img.width, 200 / img.height);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const colorBuckets = {};

      for (let i = 0; i < imageData.length; i += 16) {
        const r = Math.round(imageData[i] / 32) * 32;
        const g = Math.round(imageData[i + 1] / 32) * 32;
        const b = Math.round(imageData[i + 2] / 32) * 32;
        const key = r + ',' + g + ',' + b;
        colorBuckets[key] = (colorBuckets[key] || 0) + 1;
      }

      const sorted = Object.entries(colorBuckets)
        .sort((a, b) => b[1] - a[1])
        .slice(0, count * 3);

      const unique = [];
      for (const [key] of sorted) {
        const [r, g, b] = key.split(',').map(Number);
        const hex = rgbToHex(r, g, b);
        const isDuplicate = unique.some(u => {
          const ur = parseInt(u.hex.slice(1, 3), 16);
          const ug = parseInt(u.hex.slice(3, 5), 16);
          const ub = parseInt(u.hex.slice(5, 7), 16);
          const dr = r - ur;
          const dg = g - ug;
          const db = b - ub;
          return Math.sqrt(dr*dr + dg*dg + db*db) < 80;
        });
        if (!isDuplicate) {
          unique.push({ hex, count: colorBuckets[key] });
        }
        if (unique.length >= count) break;
      }

      resolve(unique.map(c => c.hex));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(imageFile);
  });
};

export const buildGradientCSS = (type, colors, angle, radialPosition) => {
  const stops = colors.join(', ');
  if (type === 'linear') {
    return `linear-gradient(${angle}deg, ${stops})`;
  } else if (type === 'radial') {
    return `radial-gradient(${radialPosition || 'center'}, ${stops})`;
  } else if (type === 'conic') {
    return `conic-gradient(from ${angle}deg at ${radialPosition || 'center'}, ${stops})`;
  }
  return `linear-gradient(${angle}deg, ${stops})`;
};
