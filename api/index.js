const { testConnection, initializeDatabase } = require('./src/database/connection');

// Initialize database on startup
const initializeApp = async () => {
  await testConnection();
  await initializeDatabase();
};

// Start the app
initializeApp().then(() => {
  require('./src/server');
}).catch((error) => {
  console.error('Failed to initialize app:', error);
  process.exit(1);
});

