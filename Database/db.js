// File: Database/db.js
const mongoose = require("mongoose");
const dns = require('dns');
const { promisify } = require('util');

const lookup = promisify(dns.lookup);

// Test DNS resolution before connecting
const testDNS = async (hostname) => {
  try {
    console.log(`🔍 Testing DNS resolution for ${hostname}...`);
    const result = await lookup(hostname);
    console.log(`✅ DNS resolved: ${hostname} -> ${result.address}`);
    return true;
  } catch (error) {
    console.error(`❌ DNS resolution failed for ${hostname}:`, error.message);
    return false;
  }
};

const connectDB = async () => {
  try {
    console.log("🚀 Starting MongoDB connection process...");
    
    // Extract hostname from MongoDB URI for DNS testing
    const uriMatch = process.env.MONGODB_URI.match(/mongodb\+srv:\/\/[^@]+@([^\/]+)/);
    if (uriMatch) {
      const hostname = uriMatch[1];
      const dnsWorking = await testDNS(hostname);
      
      if (!dnsWorking) {
        console.log("🔧 Trying alternative DNS servers...");
        // Try different DNS servers
        dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
        await testDNS(hostname);
      }
    }
    
    console.log("📡 Attempting MongoDB connection...");
    
    // Try multiple connection strategies
    const connectionOptions = [
      // Strategy 1: Standard connection
      {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        family: 4
      },
      // Strategy 2: With different DNS resolution
      {
        serverSelectionTimeoutMS: 45000,
        socketTimeoutMS: 60000,
        family: 4,
        directConnection: false
      },
      // Strategy 3: Minimal options
      {
        serverSelectionTimeoutMS: 60000
      }
    ];
    
    let lastError;
    
    for (let i = 0; i < connectionOptions.length; i++) {
      try {
        console.log(`📋 Trying connection strategy ${i + 1}/${connectionOptions.length}...`);
        
        const conn = await mongoose.connect(process.env.MONGODB_URI, connectionOptions[i]);
        
        console.log(`✅ MongoDB Connected Successfully!`);
        console.log(`🌐 Host: ${conn.connection.host}`);
        console.log(`🗄️ Database: ${conn.connection.name}`);
        
        return conn;
        
      } catch (error) {
        console.error(`❌ Strategy ${i + 1} failed:`, error.message);
        lastError = error;
        
        // Wait before trying next strategy
        if (i < connectionOptions.length - 1) {
          console.log("⏳ Waiting 3 seconds before next attempt...");
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    }
    
    throw lastError;
    
  } catch (error) {
    console.error('💥 All MongoDB connection strategies failed');
    console.error('📊 Error details:', error.message);
    
    // Provide specific troubleshooting advice
    if (error.message.includes('ETIMEOUT') || error.message.includes('queryTxt')) {
      console.log('\n🔧 TROUBLESHOOTING STEPS:');
      console.log('1. Check your internet connection');
      console.log('2. Try using mobile hotspot or different network');
      console.log('3. Check if your firewall blocks MongoDB (port 27017)');
      console.log('4. Verify MongoDB Atlas IP whitelist (try 0.0.0.0/0 temporarily)');
      console.log('5. Check if you\'re behind corporate firewall/proxy');
      console.log('6. Try using VPN or different DNS servers');
    }
    
    throw error;
  }
};

module.exports = {
  connectDB
};