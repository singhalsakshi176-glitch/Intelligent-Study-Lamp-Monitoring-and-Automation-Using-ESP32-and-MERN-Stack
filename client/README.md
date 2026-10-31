# Intelligent Study Lamp Monitoring and Automation Using ESP32 and MERN Stack

## Project Overview

The Intelligent Study Lamp Monitoring and Automation System is an IoT-based project designed to make studying smarter and more efficient.

The system uses ESP32 and sensors to monitor student presence and surrounding light conditions. Based on the collected data, the lamp can automatically adjust its operation.

The MERN Stack is used to develop a web dashboard for monitoring lamp status and viewing study session information.

## Technologies Used

- **Frontend:** React.js, HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Hardware:** ESP32
- **Sensors:** PIR Sensor, LDR Sensor

## Project Structure

```text
project/
├── client/       # React frontend
├── server/       # Node.js backend
├── README.md
└── .gitignore
```

## Features

- Smart study lamp monitoring
- Student presence detection
- Ambient light monitoring
- Automatic lamp control
- Web-based dashboard
- Study session history and statistics

## Installation and Setup

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

### 2. Setup Frontend

```bash
cd client
npm install
npm run dev
```

### 3. Setup Backend

Open another terminal:

```bash
cd server
npm install
```

Configure your environment variables using the provided `.env.example` file, then start the backend using the start script defined in `server/package.json`.

## Project Status

Currently under development. Hardware integration and system testing are in progress.

## Team Members

- Sakshi Singhal
- Milan Singhal