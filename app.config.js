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
    scheme: "ktufy",
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      [
        "expo-media-library",
        {
          photosPermission: "Allow $(PRODUCT_NAME) to access your photos to save processed files.",
          savePhotosPermission: "Allow $(PRODUCT_NAME) to save processed files to your gallery.",
          isAccessMediaLocationEnabled: true
        }
      ]
    ],
    extra: {
      SUPABASE_URL: process.env.SUPABASE_URL || 'https://bojrxrzwcuzduilfwyqp.supabase.co',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJ4cnp3Y3V6ZHVpbGZ3eXFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MDY5NTcsImV4cCI6MjA3NjQ4Mjk1N30.005yfg5xqJ6JrmAKcqBnlE92e6BRuxWSnXB-vWHrBR4',
      API_BASE_URL: process.env.API_BASE_URL || 'https://api.ktufy.app',
      USER_SERVICE_URL: process.env.USER_SERVICE_URL || 'https://api.ktufy.app',
      TICKLIST_SERVICE_URL: process.env.TICKLIST_SERVICE_URL || 'https://api.ktufy.app',
      CHATBOT_SERVICE_URL: process.env.CHATBOT_SERVICE_URL || 'https://api.ktufy.app',
      LIBRARY_SERVICE_URL: process.env.LIBRARY_SERVICE_URL || 'https://api.ktufy.app',
      eas: {
        projectId: "17e9a857-40a0-4f23-bdf9-a1b26590102a"
      }
    }
  }
};
