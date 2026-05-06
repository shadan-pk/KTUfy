require('dotenv').config();

module.exports = {
  expo: {
    name: "KTUfy",
    slug: "KTUfy_App",
    owner: "ktufy",
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
      eas: {
        projectId: "2c46e047-02f1-4bc1-85af-287ddf841d27"
      },
      SUPABASE_URL: process.env.SUPABASE_URL || '...',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '...'
    }
  }
};
