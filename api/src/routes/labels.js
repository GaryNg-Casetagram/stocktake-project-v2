const express = require('express');
const { generateLabel, generateBulkLabels, generateLabelBySku } = require('../services/labelService');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// Generate label for a single item by SKU
router.get('/item/:sku', requireRole(['tech_admin', 'retail_backend', 'retail_manager']), async (req, res, next) => {
  try {
    const { sku } = req.params;
    const { format = 'png' } = req.query;

    const result = await generateLabelBySku(sku);
    const { item, labelBuffer } = result;

    if (format === 'svg') {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Content-Disposition', `attachment; filename="${item.sku}-label.svg"`);
    } else {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="${item.sku}-label.png"`);
    }

    res.send(labelBuffer);
  } catch (error) {
    next(error);
  }
});

// Generate labels for multiple items
router.post('/bulk', requireRole(['tech_admin', 'retail_backend', 'retail_manager']), async (req, res, next) => {
  try {
    const { itemIds, format = 'zip' } = req.body;

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ error: 'itemIds must be a non-empty array' });
    }

    const labels = await generateBulkLabels(itemIds);

    if (format === 'zip') {
      // Generate ZIP file with all labels
      const JSZip = require('jszip');
      const zip = new JSZip();

      labels.forEach(({ sku, labelBuffer }) => {
        zip.file(`${sku}-label.png`, labelBuffer);
      });

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="bulk-labels.zip"');
      res.send(zipBuffer);
    } else {
      // Return JSON with base64 encoded labels
      const result = labels.map(({ itemId, sku, shortId, name, labelBuffer }) => ({
        itemId,
        sku,
        shortId,
        name,
        labelData: labelBuffer.toString('base64')
      }));

      res.json(result);
    }
  } catch (error) {
    next(error);
  }
});

// Preview label for an item (returns base64 data URL)
router.get('/preview/:sku', requireRole(['tech_admin', 'retail_backend', 'retail_manager']), async (req, res, next) => {
  try {
    const { sku } = req.params;

    const result = await generateLabelBySku(sku);
    const { item, labelBuffer } = result;

    const dataUrl = `data:image/png;base64,${labelBuffer.toString('base64')}`;

    res.json({
      dataUrl,
      item: {
        id: item.id,
        sku: item.sku,
        shortId: item.short_id,
        name: item.name,
        description: item.description,
        hasRfid: item.has_rfid
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;