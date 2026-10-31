# Smart Study Lamp Dashboard 💡

A modern, full-stack MERN (MongoDB, Express, React, Node.js) IoT web dashboard that tracks how long a student's study lamp (controlled by an ESP32) remains ON. The dashboard measures productive study time, visualizes daily and 7-day study habits, compares performance against yesterday's benchmarks, and tracks progress towards daily study goals.

---

## 🌟 Key Features

1. **Live ESP32 Session Tracking**:
   - Lamp state (ON/OFF) automatically creates or concludes study sessions.
   - **All durations are computed server-side** in the `Asia/Kolkata` timezone (UTC+05:30) to prevent clock drift from microcontroller clocks.
   - Live running session timer (`HH:MM:SS`) with pulsing indicator and real-time seconds ticking.

2. **Section 1: Stat Cards**:
   - **Current Status**: Real-time status (ON/OFF), start timestamp (e.g. `Started at 6:15 PM`), and running duration.
   - **Today's Study Time**: Formatted in `2h 30m` format, automatically including the running session's elapsed time.
   - **Yesterday's Study Time**: Daily baseline comparison benchmark.
   - **Comparative Performance**: Visual indicator (▲/▼) with minute delta, percentage change, and contextual motivational coaching messages.

3. **Section 2: Interactive Analytics & Charts**:
   - **7-Day Study Trend**: Recharts bar chart showing daily study volume with today's bar highlighted in vibrant emerald.
   - **Today vs Yesterday Comparison**: Side-by-side comparative breakdown.
   - **Daily Goal Progress Ring**: Animated circular progress ring (default target 3 hours, interactive in-UI adjuster).

4. **Section 3: Session History Table**:
   - Complete history table with columns: `Date`, `Start Time`, `End Time`, `Duration`.
   - The currently running session is pinned to the top with a pulsing **Active** badge.

5. **Design & UX Polish**:
   - Glassmorphic card styling, clean typography, indigo/purple aesthetic accents.
   - Dark mode & Light mode toggle with automatic persistence.
   - Auto-refresh polling every 5 seconds.
   - Integrated **ESP32 Simulator & Hardware Guide** directly in the UI.

---

## 🛠 Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Recharts, Axios, Lucide React icons
- **Backend**: Node.js, Express, Mongoose, CORS, Dotenv
- **Database**: MongoDB (MongoDB Atlas or local fallback)
- **Timezone**: `Asia/Kolkata` (UTC+05:30)

---

## 📁 Project Structure

```text
├── server/
│   ├── src/
│   │   ├── config/          # MongoDB connection (Atlas & in-memory dev fallback)
│   │   ├── controllers/     # Lamp state & stats aggregation controllers
│   │   ├── models/          # Session Mongoose schema
│   │   ├── routes/          # Express routes (/api/lamp, /api/stats, /api/sessions)
│   │   ├── utils/           # Asia/Kolkata timezone math & seed data generator
│   │   └── server.js        # Express application entry point (Port 5001)
│   ├── seed.js              # 10-day realistic session seed script
│   ├── package.json
│   ├── .env.example
│   └── .env
│
├── client/
│   ├── src/
│   │   ├── api/             # Axios API client (lampApi)
│   │   ├── components/      # Navbar, StatCards, ChartsSection, SessionHistoryTable, etc.
│   │   ├── hooks/           # useLampData custom hook with 5s polling & timer tick
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css        # Tailwind styles & glassmorphic utilities
│   ├── vite.config.js       # Vite config with /api dev proxy
│   ├── package.json
│   ├── .env.example
│   └── .env
└── README.md
```

---

## 🚀 Quickstart Guide

### 1. Setup Backend Server

```bash
cd server
npm install

# (Optional) Edit server/.env to point to your MongoDB Atlas cluster:
# MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/smart-study-lamp?retryWrites=true&w=majority

# Run database seed (generates 10 days of realistic study sessions)
npm run seed

# Start backend server (runs on http://localhost:5001)
npm start
```

### 2. Setup Frontend Client

```bash
cd client
npm install

# Start Vite development server (runs on http://localhost:3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📡 Backend API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/lamp/on` | Starts a session. If an open session exists, returns it instead of creating duplicates. |
| `POST` | `/api/lamp/off` | Concludes active session and calculates `durationMinutes`. |
| `GET` | `/api/lamp/status/:deviceId` | Returns `{ isOn, since }` and metadata. |
| `GET` | `/api/stats/today?deviceId=` | Total study minutes today (includes active session elapsed time). |
| `GET` | `/api/stats/compare?deviceId=` | Returns `{ todayMinutes, yesterdayMinutes, differenceMinutes, percentChange }`. |
| `GET` | `/api/stats/last7days?deviceId=` | Array of 7 days `{ date, label, totalMinutes, isToday }` (missing days filled with 0). |
| `GET` | `/api/sessions?deviceId=&limit=10`| Recent sessions list (latest first, running session flagged with `isActive: true`). |
| `GET` | `/api/health` | Health check endpoint. |

---

## 🔌 ESP32 Microcontroller Integration

Your ESP32 can connect over Wi-Fi and trigger sessions whenever the lamp switch is flipped:

```cpp
#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://YOUR_SERVER_IP:5001/api/lamp";
const char* deviceId = "esp32-lamp-01";

void sendLampState(bool isOn) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String endpoint = String(serverUrl) + (isOn ? "/on" : "/off");
    http.begin(endpoint);
    http.addHeader("Content-Type", "application/json");

    String payload = "{\"deviceId\":\"" + String(deviceId) + "\"}";
    int httpResponseCode = http.POST(payload);

    Serial.print("HTTP Response: ");
    Serial.println(httpResponseCode);
    http.end();
  }
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");
}

void loop() {
  // Call sendLampState(true) when lamp turns ON
  // Call sendLampState(false) when lamp turns OFF
}
```
