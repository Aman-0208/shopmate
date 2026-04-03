const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const Item = require('../models/Item');
const Bill = require('../models/Bill');

// ─── Helper: format INR ───────────────────────────────────────────────────────
const inr = (n) => `Rs. ${Number(n).toFixed(2)}`;

// ─── GET /api/bills — list all bills (newest first) ──────────────────────────
router.get('/', async (req, res) => {
  try {
    const bills = await Bill.find().sort({ createdAt: -1 });
    res.json(bills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/bills/download/monthly — PDF of the last 30 days ───────────────
router.get('/download/monthly', async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const bills = await Bill.find({
      createdAt: { $gte: thirtyDaysAgo, $lte: now },
    }).sort({ createdAt: 1 });

    // Set response headers for PDF download
    const filename = `billing-report-${now.toISOString().slice(0, 10)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Create PDF
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(res);

    // ── Header ──
    doc.font('Helvetica-Bold').fontSize(20).text('StockFlow', { align: 'center' });
    doc.font('Helvetica').fontSize(10).fillColor('#555')
      .text('Monthly Billing Report', { align: 'center' });
    doc.fontSize(9).text(
      `Period: ${thirtyDaysAgo.toDateString()}  →  ${now.toDateString()}`,
      { align: 'center' }
    );
    doc.moveDown(0.5);

    // ── Summary bar ──
    const totalSales = bills.reduce((s, b) => s + b.grandTotal, 0);
    doc.rect(40, doc.y, 515, 38).fill('#1e293b');
    const summaryY = doc.y - 38 + 10;
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11);
    doc.text(`Total Bills: ${bills.length}`, 55, summaryY, { continued: true });
    doc.text(`   |   Total Revenue: ${inr(totalSales)}`, { continued: false });
    doc.moveDown(1.5);
    doc.fillColor('#000000');

    if (bills.length === 0) {
      doc.font('Helvetica').fontSize(12).text('No bills found for this period.', { align: 'center' });
      doc.end();
      return;
    }

    // ── Bills Section ──
    bills.forEach((bill, idx) => {
      const billDate = new Date(bill.createdAt).toLocaleString('en-IN');
      const billId = bill._id.toString().slice(-8).toUpperCase();

      // Bill header
      if (doc.y > 700) doc.addPage();
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#1d4ed8')
        .text(`Bill #${billId}  —  ${billDate}`, { underline: false });

      doc.font('Helvetica').fontSize(9).fillColor('#333');
      if (bill.customerName) doc.text(`Customer: ${bill.customerName}${bill.customerGstin ? '  |  GSTIN: ' + bill.customerGstin : ''}`);

      // Items table header
      const tableTop = doc.y + 4;
      const col = { sno: 40, name: 70, hsn: 240, qty: 310, rate: 370, amount: 460 };

      doc.rect(40, tableTop, 515, 16).fill('#f1f5f9');
      doc.fillColor('#000').font('Helvetica-Bold').fontSize(8);
      doc.text('S#', col.sno, tableTop + 4);
      doc.text('Particulars', col.name, tableTop + 4);
      doc.text('HSN', col.hsn, tableTop + 4);
      doc.text('Qty', col.qty, tableTop + 4);
      doc.text('Rate', col.rate, tableTop + 4);
      doc.text('Amount', col.amount, tableTop + 4);

      let rowY = tableTop + 18;
      doc.font('Helvetica').fontSize(8).fillColor('#000');

      bill.items.forEach((item, i) => {
        if (doc.y > 700 || rowY > 700) {
          doc.addPage();
          rowY = 50;
        }
        if (i % 2 === 1) doc.rect(40, rowY - 2, 515, 14).fill('#f8fafc');
        doc.fillColor('#000');
        doc.text(String(i + 1), col.sno, rowY);
        doc.text(item.name || '', col.name, rowY, { width: 165, ellipsis: true });
        doc.text(item.hsn || '-', col.hsn, rowY);
        doc.text(`${item.quantity} ${item.unit || 'pcs'}`, col.qty, rowY);
        doc.text(inr(item.price), col.rate, rowY);
        doc.text(inr(item.price * item.quantity), col.amount, rowY);
        rowY += 14;
      });

      // Totals
      doc.moveTo(40, rowY).lineTo(555, rowY).stroke('#cbd5e1');
      rowY += 4;
      doc.font('Helvetica').fontSize(8);
      doc.text(`Subtotal:`, 380, rowY); doc.text(inr(bill.total), col.amount, rowY); rowY += 12;
      doc.text(`CGST @ 9%:`, 380, rowY); doc.text(inr(bill.cgst), col.amount, rowY); rowY += 12;
      doc.text(`SGST @ 9%:`, 380, rowY); doc.text(inr(bill.sgst), col.amount, rowY); rowY += 12;
      doc.font('Helvetica-Bold').fontSize(9);
      doc.text(`Grand Total:`, 370, rowY); doc.text(inr(bill.grandTotal), col.amount, rowY);

      doc.y = rowY + 20;
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#e2e8f0');
      doc.moveDown(1);
    });

    // ── Footer ──
    doc.moveDown(1);
    doc.font('Helvetica').fontSize(8).fillColor('#888')
      .text(`Generated on ${now.toLocaleString('en-IN')} • StockFlow`, { align: 'center' });

    doc.end();
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/bills — complete a sale (atomically deducts stock) ─────────────
router.post('/', async (req, res) => {
  const { cart, customerName, customerGstin, customerBank, customerAccountNo, customerIfsc } = req.body;

  if (!cart || cart.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  try {
    // Validate stock availability
    for (const { itemId, quantity } of cart) {
      const item = await Item.findById(itemId);
      if (!item) return res.status(404).json({ error: `Item ${itemId} not found` });
      if (item.quantity < quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${item.name}. Available: ${item.quantity} ${item.unit}` });
      }
    }

    // Deduct stock
    for (const { itemId, quantity } of cart) {
      await Item.findByIdAndUpdate(itemId, { $inc: { quantity: -quantity } });
    }

    // Compute totals
    const total = cart.reduce((s, c) => s + c.price * c.quantity, 0);
    const cgst = total * 0.09;
    const sgst = total * 0.09;
    const grandTotal = total + cgst + sgst;

    // Save bill with item snapshot
    const bill = new Bill({
      items: cart.map((c) => ({
        itemId: c.itemId,
        name: c.name,
        sku: c.sku,
        hsn: c.hsn,
        price: c.price,
        quantity: c.quantity,
        unit: c.unit || 'pcs',
      })),
      total,
      cgst,
      sgst,
      grandTotal,
      customerName: customerName || '',
      customerGstin: customerGstin || '',
      customerBank: customerBank || '',
      customerAccountNo: customerAccountNo || '',
      customerIfsc: customerIfsc || '',
    });

    const saved = await bill.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/bills/:id ────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Bill.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Bill not found' });
    res.json({ message: 'Bill deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
