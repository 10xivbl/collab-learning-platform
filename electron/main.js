const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;
const SERVER_PORT = 3000;
const SERVER_URL = `http://localhost:${SERVER_PORT}`;

// Check if MongoDB is accessible
async function checkMongoDB() {
  try {
    const net = require('net');
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(3000);
      
      socket.on('connect', () => {
        console.log('✓ MongoDB connection check passed');
        socket.destroy();
        resolve(true);
      });
      
      socket.on('timeout', () => {
        console.log('⚠ MongoDB connection check timeout');
        socket.destroy();
        resolve(false);
      });
      
      socket.on('error', () => {
        console.log('⚠ MongoDB connection check failed');
        resolve(false);
      });
      
      // Try to connect to default MongoDB port
      socket.connect(27017, 'localhost');
    });
  } catch (error) {
    return false;
  }
}

// Server management functions
function startServer() {
  return new Promise((resolve, reject) => {
    console.log('Starting server...');
    
    const serverPath = path.join(__dirname, '../server');
    
    let serverStarted = false;
    let errorOutput = '';
    
    serverProcess = spawn('node', ['server.js'], {
      cwd: serverPath,
      stdio: 'pipe',
      env: { ...process.env, PORT: SERVER_PORT, NODE_ENV: process.env.NODE_ENV || 'production' }
    });

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[Server]: ${output.trim()}`);
      
      if (output.includes(`server is running on port ${SERVER_PORT}`) || 
          output.includes('server is running')) {
        console.log('✓ Server started successfully');
        serverStarted = true;
        setTimeout(() => resolve(), 2000); // Give it more time to be ready
      }
    });

    serverProcess.stderr.on('data', (data) => {
      const error = data.toString();
      errorOutput += error;
      console.error(`Server Error: ${error}`);
      
      if (error.includes('EADDRINUSE')) {
        console.error(`\n Port ${SERVER_PORT} is already in use!`);
        console.error('Please close any other instances of the server or change the port.\n');
      } else if (error.includes('ECONNREFUSED') || error.includes('MongoNetworkError')) {
        console.error('\n Cannot connect to MongoDB!');
        console.error('Please make sure MongoDB is running.\n');
      } else if (error.includes('JWT_SECRET')) {
        console.error('\n JWT_SECRET is missing!');
        console.error('Please check your .env file in the server directory.\n');
      }
    });

    serverProcess.on('error', (error) => {
      console.error('Failed to start server process:', error);
      reject(error);
    });

    serverProcess.on('close', (code) => {
      console.log(`Server process exited with code ${code}`);
      if (code !== 0 && code !== null && !serverStarted) {
        const errorMessage = errorOutput || `Server exited with code ${code}`;
        reject(new Error(errorMessage));
      }
    });

    setTimeout(() => {
      if (!serverStarted && serverProcess && !serverProcess.killed) {
        reject(new Error('Server startup timeout - check if MongoDB is running and .env is configured'));
      }
    }, 15000); 
  });
}

function stopServer() {
  return new Promise((resolve) => {
    if (serverProcess && !serverProcess.killed) {
      console.log('Stopping server...');
      
      serverProcess.on('close', () => {
        console.log('Server stopped');
        serverProcess = null;
        resolve();
      });

      serverProcess.kill('SIGTERM');
      
      setTimeout(() => {
        if (serverProcess && !serverProcess.killed) {
          console.log('Force killing server...');
          serverProcess.kill('SIGKILL');
          serverProcess = null;
          resolve();
        }
      }, 3000);
    } else {
      resolve();
    }
  });
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            if (mainWindow) mainWindow.reload();
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle DevTools',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => {
            if (mainWindow) mainWindow.webContents.toggleDevTools();
          }
        },
        { type: 'separator' },
        {
          label: 'Actual Size',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            if (mainWindow) mainWindow.webContents.setZoomLevel(0);
          }
        },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            if (mainWindow) {
              const currentZoom = mainWindow.webContents.getZoomLevel();
              mainWindow.webContents.setZoomLevel(currentZoom + 1);
            }
          }
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            if (mainWindow) {
              const currentZoom = mainWindow.webContents.getZoomLevel();
              mainWindow.webContents.setZoomLevel(currentZoom - 1);
            }
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Collaborative Learning Platform',
              message: 'Collaborative Learning Platform',
              detail: 'Version 1.0.0\n\nA desktop application for collaborative learning and classroom management.',
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });

    // Add Edit menu
    template.splice(1, 0, {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#ffffff',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    },
    show: false 
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (process.env.NODE_ENV === 'development') {
      mainWindow.webContents.openDevTools();
    }
  });

  // Load the server URL
  mainWindow.loadURL(SERVER_URL).catch((err) => {
    console.error('Failed to load URL:', err);
    // Show error page if server is not available
    mainWindow.loadFile(path.join(__dirname, 'error.html')).catch((e) => {
      console.error('Failed to load error page:', e);
    });
  });

  // Handle navigation
  mainWindow.webContents.on('did-fail-load', () => {
    console.error('Failed to load page');
  });

  mainWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    require('electron').shell.openExternal(url);
  });

  // Cleanup on close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Initialize app
app.whenReady().then(async () => {
  try {
    createMenu();

    // Check MongoDB connection first
    console.log('Checking MongoDB connection...');
    const mongoIsRunning = await checkMongoDB();
    
    if (!mongoIsRunning) {
      console.log('⚠ Warning: MongoDB may not be running on localhost:27017');
      console.log('The server will attempt to start anyway...');
    }

    createWindow();
  } catch (error) {
    console.error('Failed to start application:', error);
    const { dialog } = require('electron');
    
    let errorTitle = 'Startup Error';
    let errorMessage = `Failed to start the application:\n\n${error.message}\n\n`;
    
    if (error.message.includes('EADDRINUSE')) {
      errorTitle = 'Port Already in Use';
      errorMessage += 'Port 3000 is already being used by another application.\n\n' +
                     'Solutions:\n' +
                     '• Close any other instances of this app or the server\n' +
                     '• Stop any processes using port 3000\n' +
                     '• Restart your computer if the issue persists';
    } else if (error.message.includes('MongoNetworkError') || error.message.includes('ECONNREFUSED')) {
      errorTitle = 'MongoDB Connection Error';
      errorMessage += 'Cannot connect to MongoDB database.\n\n' +
                     'Solutions:\n' +
                     '• Make sure MongoDB is installed and running\n' +
                     '• macOS: brew services start mongodb-community\n' +
                     '• Linux: sudo systemctl start mongod\n' +
                     '• Windows: net start MongoDB\n' +
                     '• Check your MONGODB_URI in .env file';
    } else if (error.message.includes('timeout')) {
      errorTitle = 'Server Startup Timeout';
      errorMessage += 'The server took too long to start.\n\n' +
                     'Possible issues:\n' +
                     '• MongoDB is not running\n' +
                     '• Missing .env configuration\n' +
                     '• Server dependencies not installed\n\n' +
                     'Try:\n' +
                     '• Run: cd server && npm install\n' +
                     '• Check MongoDB status\n' +
                     '• Verify .env file exists';
    } else {
      errorMessage += 'Common solutions:\n' +
                     '1. Make sure MongoDB is running\n' +
                     '2. Install dependencies: cd server && npm install\n' +
                     '3. Configure .env file in server directory\n' +
                     '4. Check the console logs for more details';
    }
    
    dialog.showErrorBox(errorTitle, errorMessage);
    app.quit();
  }
});

app.on('window-all-closed', async () => {
  await stopServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Activate (macOS)
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', async (event) => {
  if (serverProcess && !serverProcess.killed) {
    event.preventDefault();
    await stopServer();
    app.quit();
  }
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});