const crypto = require('crypto');
const SignatureRequest = require('../models/SignatureRequest');
const Document = require('../models/Document');

// Signwell webhook handler (basic)
exports.signwellWebhook = async (req, res) => {
  try {
    const secret = process.env.SIGNWELL_WEBHOOK_SECRET;
    const sigHeader = req.headers['x-signature'] || req.headers['x-signature-256'] || req.headers['signwell-signature'] || req.headers['signature'];

    // Best-effort verification: compute HMAC of JSON.stringify(req.body)
    if (secret && sigHeader) {
      const computed = crypto.createHmac('sha256', secret).update(JSON.stringify(req.body)).digest('hex');
      if (computed !== sigHeader) {
        console.warn('Webhook signature mismatch');
        return res.status(400).json({ success: false, message: 'Invalid signature' });
      }
    }

    const event = req.body || {};
    console.log('Webhook received:', event.type || 'unknown', event);

    // If webhook indicates a signature completed, try to mark request/document
    const requestId = event.request_id || (event.data && event.data.request_id) || null;
    const status = event.status || (event.data && event.data.status) || null;

    if (requestId && status && String(status).toLowerCase() === 'signed') {
      const reqRecord = await SignatureRequest.findOne({ where: { request_id: requestId } });
      if (reqRecord) {
        reqRecord.status = 'completed';
        await reqRecord.save().catch(err => console.error('Failed update request status', err));

        // mark document as signed if exists
        if (reqRecord.document_id) {
          const doc = await Document.findByPk(reqRecord.document_id);
          if (doc) {
            doc.status = 'signed';
            await doc.save().catch(err => console.error('Failed update document status', err));
          }
        }
      }
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
