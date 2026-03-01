require('dotenv').config();

module.exports = {
  expo: {
    name: "KTUfy",
    slug: "KTUfy",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true
    },
    android: {
      package: "com.ktufy.app",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      SUPABASE_URL: process.env.SUPABASE_URL || 'https://bojrxrzwcuzduilfwyqp.supabase.co',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJ4cnp3Y3V6ZHVpbGZ3eXFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MDY5NTcsImV4cCI6MjA3NjQ4Mjk1N30.005yfg5xqJ6JrmAKcqBnlE92e6BRuxWSnXB-vWHrBR4',
    }
  }
};
