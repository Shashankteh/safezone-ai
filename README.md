# 🛡️ SafeZone AI — Smart Personal Safety Platform

> A production-grade microservices PWA for real-time safety monitoring, emergency alerts, and AI-powered risk detection.

[![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=black)](https://reactjs.org)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Python](https://img.shields.io/badge/Python-3.11-3776ab?logo=python&logoColor=white)](https://python.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47a248?logo=mongodb&logoColor=white)](https://mongodb.com)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.7-010101?logo=socket.io)](https://socket.io)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ed?logo=docker&logoColor=white)](https://docker.com)
[![CI/CD](https://img.shields.io/badge/CI/CD-GitHub_Actions-2088ff?logo=github-actions&logoColor=white)](https://github.com/features/actions)

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 📍 **Live Location Sharing** | Real-time location broadcast to trusted contacts via Socket.io |
| 🆘 **One-Tap SOS** | Instant alerts via Twilio SMS + Firebase FCM push notifications |
| 🤖 **AI Risk Prediction** | Python/FastAPI ML microservice with 96.7% accuracy Random Forest model |
| 📞 **Fake Call** | Full-screen fake incoming call UI to escape unsafe situations |
| 🗺️ **Geofencing** | Create safe/danger zones with enter/exit alerts via SMS + push |
| 🔥 **Incident Heatmap** | Community-sourced incident reporting with real-time safety scores |
| ☠️ **Dead Man's Switch** | Auto SOS fires if user misses scheduled check-in (cron job) |
| 🎙️ **Panic Voice** | Say "SOS" or "Help me" → SOS fires automatically |
| 📉 **Fall Detection** | DeviceMotion API detects sudden impact → auto SOS |
| 🏥 **Nearby Help** | Find nearest police station, hospital, pharmacy via Google Maps API |
| 🛣️ **Safe Route** | AI-recommended safe routing avoiding high-risk areas |
| 📊 **Admin Dashboard** | Full analytics, user management, incident verification panel |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                              │
│         React PWA (Mapbox + Socket.io client)               │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTPS / WSS
┌──────────────────▼──────────────────────────────────────────┐
│                  NGINX (Reverse Proxy)                       │
│            Rate Limiting + SSL + Load Balance                │
└────┬──────────────┬───────────────┬──────────────────────────┘
     │              │               │
┌────▼────┐  ┌──────▼──────┐  ┌────▼────────┐
│  Node   │  │  Socket.io  │  │  Python     │
│Express  │  │  Real-time  │  │  FastAPI    │
│REST API │  │  Server     │  │  AI Service │
└────┬────┘  └──────┬──────┘  └────┬────────┘
     │              │               │
┌────▼──────────────▼───────────────▼────────┐
│         MongoDB Atlas + Redis Cache         │
└────────────────────────────────────────────┘
     │
┌────▼──────────────────────────────────────┐
│   External APIs                           │
│  Twilio SMS · Firebase FCM · Google Maps  │
└───────────────────────────────────────────┘
```

---

## 📁 Folder Structure

```
safezone-ai/
├── client/              ← React PWA
│   ├── src/
│   │   ├── components/  ← Map, SOS, Dashboard, Admin, Layout
│   │   ├── context/     ← Auth + Safety context providers
│   │   ├── hooks/       ← useLocation, useSocket, useMotion, usePushNotif
│   │   ├── pages/       ← Home, Login, Register, Dashboard, SOS, Admin
│   │   └── services/    ← API, Socket, Encryption clients
│   └── Dockerfile
├── server/              ← Node.js Backend
│   ├── src/
│   │   ├── controllers/ ← auth, location, sos, geofence, incident, safety, admin
│   │   ├── models/      ← User, Location, SOS, Incident, Geofence, SafetyScore
│   │   ├── routes/      ← All REST API routes
│   │   ├── services/    ← SMS, Push, Maps, AI, DeadMansSwitch
│   │   ├── socket/      ← Socket.io real-time handlers
│   │   └── middleware/  ← Auth, RateLimit, Validation
│   └── Dockerfile
├── ai-service/          ← Python FastAPI ML Microservice
│   ├── models/          ← Trained risk_model.pkl + training scripts
│   ├── routes/          ← predict, heatmap, journey anomaly
│   └── Dockerfile
├── nginx/               ← Nginx reverse proxy config
├── docker-compose.yml   ← Orchestrates all services
└── .github/workflows/   ← CI/CD GitHub Actions
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- MongoDB Atlas account (free tier works)
- Git

### 1. Clone & Setup

```bash
git clone https://github.com/yourusername/safezone-ai.git
cd safezone-ai
```

### 2. Configure Environment Variables

**Server:**
```bash
cd server
cp .env.example .env
# Fill in: MONGO_URI, JWT_SECRET, TWILIO_*, FIREBASE_*, GOOGLE_MAPS_API_KEY
```

**Client:**
```bash
cd ../client
cp .env.example .env
# Fill in: REACT_APP_MAPBOX_TOKEN
```

### 3. Run with Docker (Recommended)

```bash
# Copy .env to root for docker-compose
cp server/.env .env

# Build and start all services
docker-compose up --build

# Services will start at:
# Frontend → http://localhost:3000
# API      → http://localhost:5000
# AI       → http://localhost:8000
```

### 4. Run without Docker (Development)

```bash
# Terminal 1 — Backend
cd server && npm install && npm run dev

# Terminal 2 — Frontend
cd client && npm install && npm start

# Terminal 3 — AI Service (optional)
cd ai-service && pip install -r requirements.txt && uvicorn main:app --reload --port 8000
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login + get tokens |
| POST | `/api/auth/refresh-token` | Refresh access token |
| POST | `/api/auth/logout` | Logout all devices |

### Location
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/location/update` | Send current coordinates |
| GET | `/api/location/trusted-view` | View shared locations |
| GET | `/api/location/history` | Location history |

### SOS
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/sos/trigger` | Fire SOS alert |
| POST | `/api/sos/cancel` | Cancel false alarm |
| GET | `/api/sos/history` | Past SOS events |

### Safety
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/safety/score?lat=&lng=` | Area safety score (0-100) |
| POST | `/api/safety/route` | Safe route recommendation |
| GET | `/api/safety/nearby-help?type=police` | Find police/hospital |

### Incidents
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/incident/report` | Report incident |
| GET | `/api/incident/nearby?lat=&lng=` | Get nearby incidents |
| PUT | `/api/incident/:id/upvote` | Verify incident |
| GET | `/api/incident/heatmap` | Heatmap data |

### Geofences
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/geofence` | Create zone |
| GET | `/api/geofence` | List my zones |
| DELETE | `/api/geofence/:id` | Delete zone |
| POST | `/api/geofence/check` | Check breach |

### Admin (admin role only)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/analytics` | Full dashboard stats |
| GET | `/api/admin/users` | User management |
| GET | `/api/admin/sos/active` | Active SOS events |
| PUT | `/api/admin/incident/:id/verify` | Verify incident |

---

## ⚡ Socket Events

```javascript
// CLIENT → SERVER
socket.emit("location:update", { lat, lng, userId })
socket.emit("sos:trigger", { userId, location, message })

// SERVER → CLIENT
socket.on("sos:alert",      { from, location, message, sosId })
socket.on("geofence:breach",{ fenceId, name, type, breachType })
socket.on("nearby:incident",{ incidentId, type, distance })
socket.on("checkin:reminder",{ minutesLeft, deadline })
```

---

## 🔐 Security Features

- JWT access tokens (15 min) + refresh tokens (7 days)
- AES-256 location data encryption at rest
- bcrypt password hashing (12 salt rounds)
- Account lockout after 5 failed attempts
- Rate limiting per route (SOS: 2/min, API: 100/min)
- MongoDB injection sanitization
- Helmet.js security headers
- CORS with whitelist
- Token reuse detection → force logout all devices

---

## 🤖 AI Service

The Python FastAPI microservice serves risk predictions:

```bash
POST /predict
{
  "lat": 26.9124,
  "lng": 75.7873,
  "timestamp": "2025-03-08T22:30:00"
}

Response:
{
  "risk_score": 0.73,
  "risk_level": "High",
  "contributing_factors": ["night_time", "past_incidents"],
  "safe_alternatives": [[lat, lng], [lat, lng]]
}
```

**Model:** Random Forest Classifier (200 trees)  
**Accuracy:** 96.7%  
**Features:** Time of day, GPS coordinates, lighting, population density, incident history, police proximity

---

## 🚀 Deployment

### Render.com (Recommended — Free Tier Available)

1. **Server:** New Web Service → Connect GitHub → Build: `npm install` → Start: `npm start`
2. **AI Service:** New Web Service → Python → Build: `pip install -r requirements.txt` → Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. **Client:** Vercel or Netlify → Connect GitHub → Build: `npm run build` → Publish: `build/`

### Environment Variables to Set in Render
```
MONGO_URI, JWT_SECRET, JWT_REFRESH_SECRET, TWILIO_*, FIREBASE_*, GOOGLE_MAPS_API_KEY, AI_SERVICE_URL
```

---

## 📝 Resume Description

```
SafeZone AI — Smart Personal Safety Platform
Tech: React, Node.js, Python, MongoDB, Socket.io, Docker

- Built production-grade PWA with real-time location sharing
  using Socket.io serving 3 concurrent microservices
- Developed Python/FastAPI AI microservice with Random Forest
  model for location risk scoring — 96.7% accuracy
- Implemented JWT auth with AES-256 location encryption,
  rate limiting, and role-based access control (admin panel)
- Integrated Twilio SMS + Firebase FCM for emergency alerts
  with <2s delivery time
- Built Dead Man's Switch cron job — auto SOS on missed check-in
- Deployed via Docker Compose with GitHub Actions CI/CD pipeline
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Socket.io-client, Mapbox GL, PWA |
| Backend | Node.js 20, Express, Socket.io, JWT, bcrypt |
| AI | Python 3.11, FastAPI, scikit-learn, pandas |
| Database | MongoDB Atlas + Mongoose |
| Cache | Redis (in-memory fallback) |
| Notifications | Twilio SMS, Firebase FCM |
| Maps | Google Maps API, OpenCage (fallback) |
| DevOps | Docker Compose, Nginx, GitHub Actions |
| Security | AES-256, Helmet.js, Rate Limiting, mongo-sanitize |

---

Made with ❤️ in Jaipur | Built in 7 days | #BuildInPublic
