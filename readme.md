💬 Chat Lite

Chat Lite is a real-time chat application built with Node.js, Express, MongoDB, and Socket.IO.
It allows users to register, log in, and chat instantly in private or group conversations.

🚀 Features

User Authentication – Secure sign-up, login, and cookie-based sessions

Real-Time Messaging – Powered by Socket.IO

Profile Management – Update profile info and avatar

Inbox System – One-to-one and group chat support

Responsive UI – Works on desktop and mobile

Error Handling – Custom 404 & error pages

🛠️ Tech Stack

Backend: Node.js, Express, Socket.IO

Database: MongoDB + Mongoose

View Engine: EJS

Other: dotenv, cookie-parser, express middleware

📂 Project Structure
chat-lite/
├─ src/
│  ├─ routes/           # Express route files
│  ├─ views/            # EJS templates
│  ├─ controllers/      # Controllers
│  ├─ middlewares/      # Custom middleware (error handling, etc.)
│  ├─ models/           # Conversation, Message & User Model
│  ├─ utilites/         # All utilites
│  ├─ public/           # Static assets (CSS, JS, images)
│  └─ app.js            # Main server file
├─ .env                 # Environment variables
├─ render.yaml          # Render deployment configuration
├─ package.json
└─ README.md

⚡ Getting Started
1️⃣ Prerequisites

Node.js 18+

MongoDB (local or cloud, e.g. MongoDB Atlas)

2️⃣ Installation
git clone https://github.com/<your-username>/chat-lite.git
cd chat-lite
npm install

3️⃣ Environment Setup

Create a .env file in the project root:

APP_NAME=Chat App
MONGO_CONNECTION_STRING=mongodb://localhost:27017/chatapp
PORT=3000
COOKIE_SECRET=48bf0c49d1282fsds651bef4bdea6d769386d26cf0a
JWT_SECRET=ererebf0c49d1282f651bef4sdsbdea6d769386d26cf0a
JWT_EXPIRY=86400000
COOKIE_NAME=rbl-chat-app

APP_NAME: Name of the application.

MONGO_CONNECTION_STRING: MongoDB connection URI.

PORT: Server port.

COOKIE_SECRET: Secret for signing cookies.

JWT_SECRET: Secret key for JWT authentication.

JWT_EXPIRY: JWT token expiry in milliseconds.

COOKIE_NAME: Name of the authentication cookie.

4️⃣ Run the App
npm start


or for development with auto-reload:

npm run dev

The app will run at:
👉 http://localhost:3000


🌐 Deploying to Render

This project includes a render.yaml file for automatic deployment on Render.
Simply connect your GitHub repo to Render, and it will detect the render.yaml file.


📜 License

This project is released under the MIT License

🤝 Contributing

Pull requests are welcome!
For major changes, please open an issue first to discuss what you would like to change.