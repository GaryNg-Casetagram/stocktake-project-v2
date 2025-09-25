const QRCode = require('qrcode');
const bwipjs = require('bwip-js');
const sharp = require('sharp');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Generate QR code for long SKUs
const generateQRCode = async (sku, options = {}) => {
  try {
    const {
      width = 200,
      height = 200,
      margin = 2,
      color = { dark: '#000000', light: '#FFFFFF' }
    } = options;

    const qrCodeBuffer = await QRCode.toBuffer(sku, {
      width,
      height,
      margin,
      color,
      errorCorrectionLevel: 'M'
    });

    return qrCodeBuffer;
  } catch (error) {
    throw new Error(`QR Code generation failed: ${error.message}`);
  }
};

// Generate Code128 barcode for short IDs
const generateBarcode = async (shortId, options = {}) => {
  try {
    const {
      width = 200,
      height = 100,
      scale = 2
    } = options;

    const barcodeBuffer = await bwipjs.toBuffer({
      bcid: 'code128',
      text: shortId,
      scale: scale,
      height: height,
      width: width,
      includetext: true,
      textxalign: 'center'
    });

    return barcodeBuffer;
  } catch (error) {
    throw new Error(`Barcode generation failed: ${error.message}`);
  }
};

// Generate complete label (4"x6" = 400x600px at 100 DPI)
const generateLabel = async (item, options = {}) => {
  try {
    const {
      width = 400,
      height = 600,
      fontSize = 16,
      titleFontSize = 20,
      qrSize = 120,
      barcodeSize = { width: 200, height: 60 }
    } = options;

    // Generate QR code and barcode
    const qrCodeBuffer = await generateQRCode(item.sku, { width: qrSize, height: qrSize });
    const barcodeBuffer = await generateBarcode(item.short_id, barcodeSize);

    // Create label SVG
    const labelSvg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            .title { font-family: Arial, sans-serif; font-size: ${titleFontSize}px; font-weight: bold; }
            .text { font-family: Arial, sans-serif; font-size: ${fontSize}px; }
            .small { font-family: Arial, sans-serif; font-size: ${fontSize - 2}px; }
            .rfid-yes { fill: #28a745; }
            .rfid-no { fill: #dc3545; }
          </style>
        </defs>
        
        <!-- Background -->
        <rect width="${width}" height="${height}" fill="white" stroke="black" stroke-width="2"/>
        
        <!-- Title -->
        <text x="20" y="40" class="title">${item.name}</text>
        
        <!-- Description -->
        <text x="20" y="70" class="text">${item.description || ''}</text>
        
        <!-- SKU -->
        <text x="20" y="100" class="text">SKU: ${item.sku}</text>
        
        <!-- Short ID -->
        <text x="20" y="130" class="text">ID: ${item.short_id}</text>
        
        <!-- RFID Status -->
        <text x="20" y="160" class="text">RFID: 
          <tspan class="${item.has_rfid ? 'rfid-yes' : 'rfid-no'}">${item.has_rfid ? 'YES' : 'NO'}</tspan>
        </text>
        
        <!-- QR Code -->
        <image x="${width - qrSize - 20}" y="20" width="${qrSize}" height="${qrSize}" 
               href="data:image/png;base64,${qrCodeBuffer.toString('base64')}"/>
        
        <!-- Barcode -->
        <image x="${width - barcodeSize.width - 20}" y="${height - barcodeSize.height - 20}" 
               width="${barcodeSize.width}" height="${barcodeSize.height}"
               href="data:image/png;base64,${barcodeBuffer.toString('base64')}"/>
        
        <!-- Footer -->
        <text x="20" y="${height - 20}" class="small">Generated: ${new Date().toLocaleDateString()}</text>
      </svg>
    `;

    // Convert SVG to PNG
    const labelBuffer = await sharp(Buffer.from(labelSvg))
      .png()
      .toBuffer();

    return labelBuffer;
  } catch (error) {
    throw new Error(`Label generation failed: ${error.message}`);
  }
};

// Generate labels for multiple items
const generateBulkLabels = async (itemIds, options = {}) => {
  try {
    const items = await pool.query(
      'SELECT id, sku, short_id, name, description, has_rfid FROM items WHERE id = ANY($1)',
      [itemIds]
    );

    if (items.rows.length === 0) {
      throw new Error('No items found');
    }

    const labels = [];
    for (const item of items.rows) {
      const labelBuffer = await generateLabel(item, options);
      labels.push({
        itemId: item.id,
        sku: item.sku,
        shortId: item.short_id,
        name: item.name,
        labelBuffer
      });
    }

    return labels;
  } catch (error) {
    throw new Error(`Bulk label generation failed: ${error.message}`);
  }
};

// Generate label for a single item by SKU
const generateLabelBySku = async (sku, options = {}) => {
  try {
    const itemResult = await pool.query(
      'SELECT id, sku, short_id, name, description, has_rfid FROM items WHERE sku = $1',
      [sku]
    );

    if (itemResult.rows.length === 0) {
      throw new Error('Item not found');
    }

    const item = itemResult.rows[0];
    const labelBuffer = await generateLabel(item, options);

    return {
      item,
      labelBuffer
    };
  } catch (error) {
    throw new Error(`Label generation by SKU failed: ${error.message}`);
  }
};

module.exports = {
  generateQRCode,
  generateBarcode,
  generateLabel,
  generateBulkLabels,
  generateLabelBySku
};
