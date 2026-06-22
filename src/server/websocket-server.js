const WebSocket = require('ws');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

class WebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map(); // Map of userId -> WebSocket connection
    this.heartbeatInterval = 30000; // 30 seconds
    
    this.initialize();
  }
  
  initialize() {
    this.wss.on('connection', async (ws, request) => {
      console.log('🔌 New WebSocket connection attempt');
      
      // Extract token from URL query parameter
      const url = new URL(request.url, `http://${request.headers.host}`);
      const token = url.searchParams.get('token');
      
      if (!token) {
        ws.close(1008, 'Authentication token required');
        return;
      }
      
      try {
        // Verify Firebase ID token
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userId = decodedToken.uid;
        
        console.log(`✅ User authenticated via WebSocket: ${userId}`);
        
        // Store connection
        this.clients.set(userId, ws);
        
        // Send welcome message
        ws.send(JSON.stringify({
          type: 'connected',
          userId,
          timestamp: new Date().toISOString(),
          message: 'WebSocket connection established'
        }));
        
        // Set up heartbeat
        ws.isAlive = true;
        ws.on('pong', () => {
          ws.isAlive = true;
        });
        
        // Handle messages
        ws.on('message', (message) => {
          this.handleMessage(userId, message.toString());
        });
        
        // Handle disconnect
        ws.on('close', () => {
          console.log(`🔌 WebSocket disconnected: ${userId}`);
          this.clients.delete(userId);
        });
        
        ws.on('error', (error) => {
          console.error(`❌ WebSocket error for ${userId}:`, error);
          this.clients.delete(userId);
        });
        
      } catch (error) {
        console.error('❌ WebSocket authentication failed:', error);
        ws.close(1008, 'Authentication failed');
      }
    });
    
    // Heartbeat interval
    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          console.log('💔 Terminating stale WebSocket connection');
          return ws.terminate();
        }
        
        ws.isAlive = false;
        ws.ping();
      });
    }, this.heartbeatInterval);
    
    console.log('🚀 WebSocket server initialized');
  }
  
  handleMessage(userId, message) {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'ping':
          this.sendToUser(userId, {
            type: 'pong',
            timestamp: new Date().toISOString()
          });
          break;
          
        case 'subscribe':
          // User subscribes to specific events
          if (data.events && Array.isArray(data.events)) {
            console.log(`📡 User ${userId} subscribed to:`, data.events);
            // Store subscription preferences
          }
          break;
          
        case 'notification_read':
          // Mark notification as read
          if (data.notificationId) {
            console.log(`📨 User ${userId} marked notification as read:`, data.notificationId);
            // Update in database
          }
          break;
          
        default:
          console.log(`📨 Message from ${userId}:`, data);
      }
      
    } catch (error) {
      console.error('❌ Error handling WebSocket message:', error);
    }
  }
  
  // Send message to specific user
  sendToUser(userId, message) {
    const ws = this.clients.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }
  
  // Broadcast to multiple users
  broadcastToUsers(userIds, message) {
    let sentCount = 0;
    userIds.forEach(userId => {
      if (this.sendToUser(userId, message)) {
        sentCount++;
      }
    });
    return sentCount;
  }
  
  // Broadcast to all connected clients
  broadcastToAll(message) {
    let sentCount = 0;
    this.wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
        sentCount++;
      }
    });
    return sentCount;
  }
  
  // Get connected users count
  getConnectedCount() {
    return this.clients.size;
  }
}

module.exports = WebSocketServer;