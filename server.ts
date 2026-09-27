import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.ts';
import { IssueCategory, IssuePriority, IssueStatus } from './src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // REST API Routes

  // GET /api/issues - list issues with optional filters
  app.get('/api/issues', (req: Request, res: Response) => {
    try {
      const { category, status, priority, search, deviceId } = req.query;
      const issues = db.getAll({
        category: category as string,
        status: status as string,
        priority: priority as string,
        search: search as string,
        deviceId: deviceId as string
      });
      res.json({ success: true, count: issues.length, data: issues });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/issues/:trackingId - get single issue by tracking ID
  app.get('/api/issues/:trackingId', (req: Request, res: Response) => {
    try {
      const { trackingId } = req.params;
      const issue = db.getByTrackingId(trackingId);
      if (!issue) {
        return res.status(404).json({
          success: false,
          error: `No report found matching tracking ID "${trackingId}".`
        });
      }
      res.json({ success: true, data: issue });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/issues/check-duplicate - preview duplicate before or during submission
  app.post('/api/issues/check-duplicate', (req: Request, res: Response) => {
    try {
      const { category, lat, lng } = req.body;
      if (!category || lat === undefined || lng === undefined) {
        return res.status(400).json({ success: false, error: 'category, lat, and lng are required.' });
      }
      const result = db.checkDuplicateForNew(category as IssueCategory, Number(lat), Number(lng));
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/issues/evaluate-priority - test priority engine logic
  app.post('/api/issues/evaluate-priority', (req: Request, res: Response) => {
    try {
      const { category, description, title, lat, lng } = req.body;
      const evaluation = db.evaluatePriorityForNew(
        category as IssueCategory,
        description || '',
        title || '',
        Number(lat || 30.267),
        Number(lng || -97.743)
      );
      res.json({ success: true, data: evaluation });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/issues - create new report
  app.post('/api/issues', (req: Request, res: Response) => {
    try {
      const { title, description, category, location, photoUrl, deviceId, overridePriority } = req.body;

      if (!title || !description || !category || !location || location.lat === undefined || location.lng === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required report fields: title, description, category, and location (lat/lng/address).'
        });
      }

      const issue = db.createIssue({
        title,
        description,
        category,
        location,
        photoUrl,
        deviceId,
        overridePriority
      });

      res.status(201).json({
        success: true,
        message: 'Report submitted successfully.',
        data: issue
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // PATCH /api/issues/:trackingId/status - update status
  app.patch('/api/issues/:trackingId/status', (req: Request, res: Response) => {
    try {
      const { trackingId } = req.params;
      const { status, remark, actor } = req.body;

      if (!status) {
        return res.status(400).json({ success: false, error: 'Status is required.' });
      }

      const updated = db.updateStatus(trackingId, status as IssueStatus, remark, actor);
      if (!updated) {
        return res.status(404).json({ success: false, error: `Issue ${trackingId} not found.` });
      }

      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // PATCH /api/issues/:trackingId/priority - update priority
  app.patch('/api/issues/:trackingId/priority', (req: Request, res: Response) => {
    try {
      const { trackingId } = req.params;
      const { priority, reason } = req.body;

      if (!priority) {
        return res.status(400).json({ success: false, error: 'Priority is required.' });
      }

      const updated = db.updatePriority(trackingId, priority as IssuePriority, reason);
      if (!updated) {
        return res.status(404).json({ success: false, error: `Issue ${trackingId} not found.` });
      }

      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // PATCH /api/issues/:trackingId/assign - assign department and crew
  app.patch('/api/issues/:trackingId/assign', (req: Request, res: Response) => {
    try {
      const { trackingId } = req.params;
      const { department, crew, remark } = req.body;

      if (!department) {
        return res.status(400).json({ success: false, error: 'Department is required.' });
      }

      const updated = db.assignDepartment(trackingId, department, crew, remark);
      if (!updated) {
        return res.status(404).json({ success: false, error: `Issue ${trackingId} not found.` });
      }

      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/issues/:trackingId/upvote - citizen endorsement
  app.post('/api/issues/:trackingId/upvote', (req: Request, res: Response) => {
    try {
      const { trackingId } = req.params;
      const updated = db.upvote(trackingId);
      if (!updated) {
        return res.status(404).json({ success: false, error: `Issue ${trackingId} not found.` });
      }
      res.json({ success: true, upvotes: updated.upvotes, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/issues/:trackingId/remark - add official note
  app.post('/api/issues/:trackingId/remark', (req: Request, res: Response) => {
    try {
      const { trackingId } = req.params;
      const { remark, actor } = req.body;
      if (!remark) {
        return res.status(400).json({ success: false, error: 'Remark content is required.' });
      }
      const updated = db.addRemark(trackingId, remark, actor);
      if (!updated) {
        return res.status(404).json({ success: false, error: `Issue ${trackingId} not found.` });
      }
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/analytics - smart city performance statistics
  app.get('/api/analytics', (_req: Request, res: Response) => {
    try {
      const analytics = db.getAnalytics();
      res.json({ success: true, data: analytics });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/reset-seed - restore default sample dataset
  app.post('/api/reset-seed', (_req: Request, res: Response) => {
    try {
      db.resetSeed();
      res.json({ success: true, message: 'Seeded issues reinitialized.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Client App Integration (Vite Middleware or Production Static Serve)
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CivicPulse Server active on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start CivicPulse server:', err);
  process.exit(1);
});
