const { getLog, clearLog } = require('../../../lib/activity-log');
const { requireAuth } = require('../../../lib/auth');

export default function handler(req, res) {
  if (!requireAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  switch (req.method) {
    case 'GET': {
      const { limit, offset, action, search } = req.query;
      const result = getLog({
        limit: limit ? parseInt(limit) : 50,
        offset: offset ? parseInt(offset) : 0,
        action: action || undefined,
        search: search || undefined
      });
      return res.status(200).json(result);
    }
    case 'DELETE': {
      clearLog();
      return res.status(200).json({ success: true, message: 'Activity log cleared' });
    }
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}
