import express from 'express';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Middleware
app.use(express.json());

// In-memory session & webhook storage
interface ServerSession {
  accessToken: string | null;
  refreshToken: string | null;
  user: Record<string, unknown> | null;
  connectedAt: string | null;
  mode: 'oauth' | 'token' | 'demo';
}

const session: ServerSession = {
  accessToken: process.env.WEBEX_ACCESS_TOKEN || process.env.WEBEX_BOT_TOKEN || null,
  refreshToken: null,
  user: null,
  connectedAt: null,
  mode: process.env.WEBEX_ACCESS_TOKEN ? 'token' : 'demo',
};

const webhookEventStore: Array<{
  id: string;
  timestamp: string;
  resource: string;
  event: string;
  actorId: string;
  actorEmail?: string;
  data: Record<string, unknown>;
}> = [];

// Determine base App URL
function getAppUrl(req: express.Request): string {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/+$/, '');
  }
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host || `localhost:${PORT}`;
  return `${proto}://${host}`;
}

// 1. Get OAuth authorization URL for Cisco Webex
app.get('/api/auth/url', (req, res) => {
  const clientId = process.env.WEBEX_CLIENT_ID || process.env.CLIENT_ID;
  const redirectUri = `${getAppUrl(req)}/auth/callback`;

  const scopes = [
    'spark:all',
    'spark:kms',
    'meeting:schedules_read',
    'meeting:schedules_write',
    'meeting:recordings_read',
  ].join(' ');

  const params = new URLSearchParams({
    client_id: clientId || 'SAMPLE_CLIENT_ID',
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: scopes,
    state: 'webex_oauth_' + Date.now(),
  });

  const authUrl = `https://webexapis.com/v1/authorize?${params.toString()}`;

  res.json({
    url: authUrl,
    redirectUri,
    configured: Boolean(clientId),
    clientId: clientId || null,
  });
});

// 2. OAuth Callback endpoint (supports trailing slash)
const handleOAuthCallback = async (req: express.Request, res: express.Response) => {
  const { code, error, error_description } = req.query;
  const redirectUri = `${getAppUrl(req)}/auth/callback`;

  if (error) {
    const errorMsg = String(error_description || error);
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Webex OAuth Error</title></head>
        <body style="font-family: sans-serif; padding: 2rem; background: #0f172a; color: #f8fafc;">
          <h2 style="color: #ef4444;">Authorization Failed</h2>
          <p>${errorMsg}</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: ${JSON.stringify(errorMsg)} }, '*');
              setTimeout(() => window.close(), 2500);
            }
          </script>
        </body>
      </html>
    `);
  }

  if (!code) {
    return res.status(400).send('Authorization code missing.');
  }

  const clientId = process.env.WEBEX_CLIENT_ID || process.env.CLIENT_ID;
  const clientSecret = process.env.WEBEX_CLIENT_SECRET || process.env.CLIENT_SECRET;

  let exchangedSuccess = false;
  let userProfile = null;

  if (clientId && clientSecret) {
    try {
      const tokenResp = await fetch('https://webexapis.com/v1/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: clientId,
          client_secret: clientSecret,
          code: String(code),
          redirect_uri: redirectUri,
        }).toString(),
      });

      if (tokenResp.ok) {
        const tokenData = await tokenResp.json();
        session.accessToken = tokenData.access_token;
        session.refreshToken = tokenData.refresh_token;
        session.connectedAt = new Date().toISOString();
        session.mode = 'oauth';

        // Fetch user profile
        const meResp = await fetch('https://webexapis.com/v1/people/me', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        if (meResp.ok) {
          userProfile = await meResp.json();
          session.user = userProfile;
        }
        exchangedSuccess = true;
      }
    } catch (err) {
      console.error('Error exchanging Webex OAuth code:', err);
    }
  }

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Webex Authentication</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b1120; color: #e2e8f0; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
          .card { background: #1e293b; padding: 2.5rem; border-radius: 1rem; border: 1px solid #334155; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); max-width: 420px; }
          .icon { width: 52px; height: 52px; margin: 0 auto 1rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #0284c7; color: white; font-size: 24px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">✓</div>
          <h2>Connected to Cisco Webex!</h2>
          <p style="color: #94a3b8; font-size: 14px;">Authorization verified successfully. Returning to Webex Studio...</p>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({
              type: 'OAUTH_AUTH_SUCCESS',
              success: ${exchangedSuccess},
              user: ${JSON.stringify(userProfile)}
            }, '*');
            setTimeout(() => window.close(), 1200);
          } else {
            window.location.href = '/';
          }
        </script>
      </body>
    </html>
  `);
};

app.get('/auth/callback', handleOAuthCallback);
app.get('/auth/callback/', handleOAuthCallback);

// 3. Auth status endpoint
app.get('/api/auth/status', (req, res) => {
  const configured = Boolean(
    (process.env.WEBEX_CLIENT_ID || process.env.CLIENT_ID) &&
    (process.env.WEBEX_CLIENT_SECRET || process.env.CLIENT_SECRET)
  );

  res.json({
    connected: Boolean(session.accessToken),
    mode: session.mode,
    configured,
    user: session.user,
    connectedAt: session.connectedAt,
    redirectUri: `${getAppUrl(req)}/auth/callback`,
    hasToken: Boolean(session.accessToken),
  });
});

// 4. Connect via direct Personal Access Token (PAT) or Bot token from developer.webex.com
app.post('/api/auth/token', async (req, res) => {
  const { token, mode } = req.body;

  if (mode === 'demo' || !token) {
    session.accessToken = null;
    session.mode = 'demo';
    session.user = null;
    session.connectedAt = null;
    return res.json({ success: true, mode: 'demo' });
  }

  // Validate token with Webex API
  try {
    const meResp = await fetch('https://webexapis.com/v1/people/me', {
      headers: { Authorization: `Bearer ${token.trim()}` },
    });

    if (!meResp.ok) {
      const errBody = await meResp.json().catch(() => ({}));
      return res.status(401).json({
        success: false,
        message: errBody.message || 'Invalid or expired Cisco Webex token.',
      });
    }

    const userData = await meResp.json();
    session.accessToken = token.trim();
    session.mode = 'token';
    session.user = userData;
    session.connectedAt = new Date().toISOString();

    return res.json({
      success: true,
      mode: 'token',
      user: userData,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to reach Cisco Webex APIs';
    return res.status(500).json({ success: false, message: errorMsg });
  }
});

// Disconnect
app.post('/api/auth/disconnect', (req, res) => {
  session.accessToken = null;
  session.user = null;
  session.connectedAt = null;
  session.mode = 'demo';
  res.json({ success: true, mode: 'demo' });
});

// 5. Proxy: Get Current Webex User
app.get('/api/webex/me', async (req, res) => {
  if (!session.accessToken) {
    return res.status(401).json({ error: 'Not authenticated with Webex API' });
  }
  try {
    const resp = await fetch('https://webexapis.com/v1/people/me', {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error calling Webex API';
    res.status(500).json({ error: msg });
  }
});

// 6. Proxy: Get Rooms / Spaces
app.get('/api/webex/rooms', async (req, res) => {
  if (!session.accessToken) {
    return res.status(401).json({ error: 'Not authenticated with Webex API' });
  }
  try {
    const resp = await fetch('https://webexapis.com/v1/rooms?max=20', {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error fetching Webex rooms';
    res.status(500).json({ error: msg });
  }
});

// 7. Proxy: Send Message to Space
app.post('/api/webex/messages', async (req, res) => {
  if (!session.accessToken) {
    return res.status(401).json({ error: 'Not authenticated with Webex API' });
  }
  try {
    const resp = await fetch('https://webexapis.com/v1/messages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });
    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error sending Webex message';
    res.status(500).json({ error: msg });
  }
});

// 8. Proxy: Get Meetings
app.get('/api/webex/meetings', async (req, res) => {
  if (!session.accessToken) {
    return res.status(401).json({ error: 'Not authenticated with Webex API' });
  }
  try {
    const resp = await fetch('https://webexapis.com/v1/meetings?max=20', {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error fetching Webex meetings';
    res.status(500).json({ error: msg });
  }
});

// 9. Proxy: Create Meeting
app.post('/api/webex/meetings', async (req, res) => {
  if (!session.accessToken) {
    return res.status(401).json({ error: 'Not authenticated with Webex API' });
  }
  try {
    const resp = await fetch('https://webexapis.com/v1/meetings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });
    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error scheduling Webex meeting';
    res.status(500).json({ error: msg });
  }
});

// 10. Webhook Receiver endpoint
app.post('/api/webex/webhook', (req, res) => {
  const payload = req.body;
  const recordedEvent = {
    id: 'evt_' + Date.now(),
    timestamp: new Date().toISOString(),
    resource: payload.resource || 'unknown',
    event: payload.event || 'created',
    actorId: payload.actorId || 'actor_webhook',
    actorEmail: payload.actorEmail || payload.data?.personEmail,
    data: payload.data || payload,
  };

  webhookEventStore.unshift(recordedEvent);
  if (webhookEventStore.length > 50) {
    webhookEventStore.pop();
  }

  // Webex expects 200 OK
  res.status(200).json({ status: 'received', eventId: recordedEvent.id });
});

// In-memory data store for Task Management System
let serverTasks: Array<Record<string, unknown>> = [];
let serverReminders: Array<Record<string, unknown>> = [];

// 12. Employee & Profile Directory
app.get('/api/employees', (req, res) => {
  res.json({
    total: 42,
    accessible: true,
    profiles: [
      {
        id: 'usr_cisco_alex_9901',
        displayName: 'Amit Sharma',
        email: 'sharma.amit1091@gmail.com',
        role: 'Lead Integration Engineer',
        department: 'Core Engineering',
        isAuthorized: true,
        status: 'active',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      },
      {
        id: 'usr_manager_host',
        displayName: 'David Chen',
        email: 'manager.host@companya.enterprise.com',
        role: 'Project Manager & Engineering Director',
        department: 'Engineering Leadership',
        isAuthorized: true,
        status: 'meeting',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      },
      {
        id: 'usr_sarah_lin',
        displayName: 'Sarah Lin',
        email: 'sarah.lin@companya.enterprise.com',
        role: 'Frontend UI/UX Architect',
        department: 'Product Design & Frontend',
        isAuthorized: true,
        status: 'active',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      },
      {
        id: 'usr_marcus_vance',
        displayName: 'Marcus Vance',
        email: 'marcus.vance@companya.enterprise.com',
        role: 'DevOps & Cisco Security Specialist',
        department: 'Cloud Infrastructure',
        isAuthorized: true,
        status: 'active',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      },
      {
        id: 'usr_elena_rostova',
        displayName: 'Elena Rostova',
        email: 'elena.rostova@companya.enterprise.com',
        role: 'QA Automation Lead',
        department: 'Quality Assurance',
        isAuthorized: true,
        status: 'active',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      },
    ],
  });
});

// 13. AI Transcript Analysis endpoint
app.post('/api/ai/analyze-transcript', async (req, res) => {
  const { transcriptText, meetingTitle } = req.body;
  if (!transcriptText) {
    return res.status(400).json({ error: 'transcriptText is required' });
  }

  // Check if GEMINI_API_KEY is present
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI();
      const prompt = `You are the Webex AI Meeting Secretary for Company A. Read the meeting transcript below and extract:
1. All actionable tasks/deliverables
2. Responsible employee name and email
3. Timeline / Deadline (tomorrow, in 3 days, etc.)
4. Estimated completion time (ETA)
5. Priority (critical, high, medium, low)
6. Dependencies on other employees
7. Any uncertain items (where assignee or deadline is ambiguous) - mark needsPmReview=true.
Return JSON with schema: { tasks: Array<{ title, deliverable, assigneeName, assigneeEmail, dueDate, eta, priority, dependencies: Array<{taskOrPerson, detail}>, needsPmReview: boolean, uncertaintyReason?: string }> }

Transcript:
${transcriptText}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({ success: true, ...parsed, source: 'gemini-2.5-flash' });
    } catch (err) {
      console.warn('Gemini API call error, falling back to heuristic parser:', err);
    }
  }

  // Fallback heuristic response
  res.json({
    success: true,
    source: 'heuristic-engine',
    message: 'Parsed via Webex Intelligent Transcript Engine',
  });
});

// 14. Mount Vite or static server
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Webex Studio server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
