module.exports = {
  "DATABASE_URI": "postgres://localhost:5432/fsg",
  "SESSION_SECRET": "Optimus Prime is my real dad",
  "TWITTER": {
    "consumerKey": "INSERT_TWITTER_CONSUMER_KEY_HERE",
    "consumerSecret": "INSERT_TWITTER_CONSUMER_SECRET_HERE",
    "callbackUrl": "INSERT_TWITTER_CALLBACK_HERE"
  },
  "FACEBOOK": {
    "clientID": "1402573990050370",
    "clientSecret": "ba786d03656f6e3a6124e85936075fa5",
    "callbackURL": "http://localhost:1337/auth/facebook/callback"
  },
  "GOOGLE": {
    "clientID": "499205292678-dc3a1qfpv7tiseegt85cd2nmhhsqq0ld.apps.googleusercontent.com",
    "clientSecret": "EcbPF7KcT0FXVdwzgf2pAmnh",
    "callbackURL": "http://localhost:1337/auth/google/callback"
  }
};
