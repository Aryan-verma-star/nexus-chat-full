const ROUTE_MAP = {
  'auth/login': () => import('../api/auth/login.js'),
  'auth/logout': () => import('../api/auth/logout.js'),
  'auth/me': () => import('../api/auth/me.js'),
  'users': () => import('../api/users/index.js'),
  'users/[id]': () => import('../api/users/[id].js'),
  'conversations': () => import('../api/conversations/index.js'),
  'conversations/[id]': () => import('../api/conversations/[id].js'),
  'conversations/[id]/messages': () => import('../api/conversations/[id]/messages.js'),
  'conversations/[id]/members': () => import('../api/conversations/[id]/members.js'),
  'conversations/[id]/read': () => import('../api/conversations/[id]/read.js'),
  'conversations/[id]/typing': () => import('../api/conversations/[id]/typing.js'),
  'jobs': () => import('../api/jobs/index.js'),
  'jobs/[id]': () => import('../api/jobs/[id].js'),
  'jobs/[id]/claim': () => import('../api/jobs/[id]/claim.js'),
  'jobs/[id]/comments': () => import('../api/jobs/[id]/comments.js'),
  'jobs/[id]/complete': () => import('../api/jobs/[id]/complete.js'),
  'messages/search': () => import('../api/messages/search.js'),
  'messages/react': () => import('../api/messages/react.js'),
  'notifications': () => import('../api/notifications/index.js'),
  'notifications/read': () => import('../api/notifications/read.js'),
  'webhooks/fiverr': () => import('../api/webhooks/fiverr.js'),
  'webhooks/upwork': () => import('../api/webhooks/upwork.js'),
  'ai/agent': () => import('../api/ai/agent.js'),
  'ai/status': () => import('../api/ai/status.js'),
  'ai/summarize': () => import('../api/ai/summarize.js'),
  'hf/sync': () => import('../api/hf/sync.js'),
  'admin/logs': () => import('../api/admin/logs.js'),
  'admin/stats': () => import('../api/admin/stats.js'),
  'secret': () => import('../api/secret/index.js'),
  'files/upload': () => import('../api/files/upload.js'),
  'files/download': () => import('../api/files/download.js'),
};

function parseRoute(pathname) {
  const segments = pathname.replace(/^\/api\//, '').split('/').filter(Boolean);
  
  const tests = [
    { pattern: ['secret'], route: 'secret' },
    { pattern: ['auth', 'login'], route: 'auth/login' },
    { pattern: ['auth', 'logout'], route: 'auth/logout' },
    { pattern: ['auth', 'me'], route: 'auth/me' },
    { pattern: ['users'], route: 'users' },
    { pattern: ['users', '[id]'], route: 'users/[id]', paramIndex: 1 },
    { pattern: ['conversations'], route: 'conversations' },
    { pattern: ['conversations', '[id]'], route: 'conversations/[id]', paramIndex: 1 },
    { pattern: ['conversations', '[id]', 'messages'], route: 'conversations/[id]/messages', paramIndex: 1 },
    { pattern: ['conversations', '[id]', 'members'], route: 'conversations/[id]/members', paramIndex: 1 },
    { pattern: ['conversations', '[id]', 'read'], route: 'conversations/[id]/read', paramIndex: 1 },
    { pattern: ['conversations', '[id]', 'typing'], route: 'conversations/[id]/typing', paramIndex: 1 },
    { pattern: ['jobs'], route: 'jobs' },
    { pattern: ['jobs', '[id]'], route: 'jobs/[id]', paramIndex: 1 },
    { pattern: ['jobs', '[id]', 'claim'], route: 'jobs/[id]/claim', paramIndex: 1 },
    { pattern: ['jobs', '[id]', 'comments'], route: 'jobs/[id]/comments', paramIndex: 1 },
    { pattern: ['jobs', '[id]', 'complete'], route: 'jobs/[id]/complete', paramIndex: 1 },
    { pattern: ['messages', 'search'], route: 'messages/search' },
    { pattern: ['messages', 'react'], route: 'messages/react' },
    { pattern: ['notifications'], route: 'notifications' },
    { pattern: ['notifications', 'read'], route: 'notifications/read' },
    { pattern: ['webhooks', 'fiverr'], route: 'webhooks/fiverr' },
    { pattern: ['webhooks', 'upwork'], route: 'webhooks/upwork' },
    { pattern: ['ai', 'agent'], route: 'ai/agent' },
    { pattern: ['ai', 'status'], route: 'ai/status' },
    { pattern: ['ai', 'summarize'], route: 'ai/summarize' },
    { pattern: ['hf', 'sync'], route: 'hf/sync' },
    { pattern: ['admin', 'logs'], route: 'admin/logs' },
    { pattern: ['admin', 'stats'], route: 'admin/stats' },
    { pattern: ['files', 'upload'], route: 'files/upload' },
    { pattern: ['files', 'download'], route: 'files/download' },
  ];

  for (const test of tests) {
    if (segments.length === test.pattern.length) {
      let match = true;
      for (let i = 0; i < test.pattern.length; i++) {
        if (test.pattern[i] !== '[id]' && segments[i] !== test.pattern[i]) {
          match = false;
          break;
        }
      }
      if (match) {
        const params = {};
        if (test.paramIndex !== undefined) {
          params.id = segments[test.paramIndex];
        }
        return { route: test.route, params };
      }
    }
  }
  return { route: null, params: {} };
}

async function handler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;
  const { route, params } = parseRoute(pathname);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Secret-Key, X-Id');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (!route) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: 'Route not found', path: pathname }));
    return;
  }

  req.params = params;
  req.query = Object.fromEntries(url.searchParams);

  try {
    const routeModule = ROUTE_MAP[route]();
    const handlerModule = await routeModule;
    await handlerModule.default(req, res);
  } catch (error) {
    console.error(`Error handling route ${route}:`, error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: error.message || 'Internal server error', route }));
  }
}

export default handler;
