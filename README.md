# DEEPESH DASH: CAMPUS RUSH

> **“One More Run. Beat Your Best.”**  
> *Created with passion by Deepesh Pankaj.*

A premium, fully playable, offline-ready 3D arcade endless runner built with **Three.js**, **TypeScript**, and **Vite**.

![Campus Rush Banner](./dist/menu-screenshot.png)

---

## 🎮 Game Concept & Features

### The Story
The player controls a college student named **Deepesh**, who runs through an energetic, stylized Indian urban campus on his way to an exciting campus showcase called **Demo Day**. Avoid campus barricades, potholes, supply trolleys, tea stalls, and auto-rickshaws, slide under low-hanging event banners, collect Byte Coins, discover Idea Sparks, activate power-ups, and beat personal records!

### Core Gameplay Mechanics
- **3-Lane Endless Running**: Smooth spring-based lane switching with dynamic banking roll.
- **Responsive Jump & Slide**: Jump over road barricades and potholes; slide crouch to glide safely beneath overhead campus banners.
- **Collectibles**:
  - **Byte Coins (⚡)**: Primary currency used to unlock character outfits in the Locker.
  - **Idea Sparks (💎)**: Glowing energy crystals that charge the signature Focus Mode.
- **Signature Mechanic — FOCUS MODE**:
  - Collecting **3 Idea Sparks** triggers **Focus Mode** for 5.5 seconds.
  - The world transforms with an electric cyan and vivid violet neon aura.
  - Grants a **3x Score Multiplier** and elevates the procedural synth soundtrack into overdrive!
- **3 Functional Power-Ups**:
  1. **Notebook Shield (🛡️)**: Protects Deepesh from one collision without dying, accompanied by an energy forcefield bubble.
  2. **Code Magnet (🧲)**: Attracts all Byte Coins across all 3 lanes within a 15-meter radius for 10 seconds.
  3. **Sprint Boost (🚀)**: Grants a 6-second hyper-speed rush (+60% speed, glowing fire trail, invincibility through obstacles).
- **5 Thematic Procedural Zones**:
  - **Zone A: Campus Morning (0–450m)**: Academic brick buildings, trees, campus gates, warm morning lighting.
  - **Zone B: Bhopal Lakefront (450–950m)**: Scenic lakeside road, specular water reflections, promenade railings, golden hour sky.
  - **Zone C: Market Rush (950–1500m)**: Indian street market with colorful striped awnings, signboards, and bustling street feel.
  - **Zone D: Neon Code City (1500–2100m)**: Futuristic cyber tech district with geometric skyscrapers, illuminated window matrices, and cyan fog.
  - **Zone E: Festival Nights (2100m+)**: Campus tech-fest celebration with glowing decorative lanterns (*kandils*) and overhead fairy light strings.
- **Character Locker / Outfits**:
  - **Demo Day Hustle (Default)**: Deep Indigo & Electric Cyan hoodie with laptop compartment backpack.
  - **Bhopal Lakefront Casual (100 Coins)**: Sunset Saffron jacket & sunglasses for VIP Road vibes.
  - **Cyber Hacker Neon (250 Coins)**: Midnight black & emissive violet cyber hoodie with glowing matrix circuits.
  - **Campus Fest Fusion (500 Coins)**: Royal blue & festive marigold tech-fest attire.
- **Pass & Play Local Multiplayer**:
  - 2 to 4 friends can compete on the same phone or laptop without an internet connection or account.
  - Shows whose turn it is, tracks round leaderboards, and crowns the match winner with confetti!
- **Missions System**:
  - 8 achievable missions with live tracking and Byte Coin rewards (Campus Sprinter, Coin Rush, High Vaulter, Limbo Master, etc.).
- **Local Leaderboard**:
  - Saves top 10 runs with player initials, score, distance, coins, and dates directly in `localStorage`.
- **Score Sharing**:
  - Web Share API integration with automatic clipboard fallback.
- **Web Audio Procedural Synthesizer**:
  - 100% procedurally synthesized music and sound effects (Zero external audio files, zero load delay, zero 404s, 100% offline-ready).
  - Multi-track synthwave runner groove with dynamic tempo scaling that accelerates as player speed increases!
  - Independent volume and mute controls for Music and SFX.
- **100% Offline PWA**:
  - Fully functional offline without an internet connection once cached by the Service Worker (`sw.js`).
  - Web App Manifest (`manifest.webmanifest`) supporting standalone app installation.

---

## 🕹️ Controls

### Desktop Keyboard
| Key | Action |
| :--- | :--- |
| **A** or **Left Arrow** | Steer Left |
| **D** or **Right Arrow** | Steer Right |
| **W**, **Up Arrow**, or **Space** | Jump |
| **S** or **Down Arrow** | Slide |
| **P** or **Escape** | Pause / Resume |

### Mobile Touch & Gestures
| Gesture | Action |
| :--- | :--- |
| **Swipe Left / Right** | Switch Lanes |
| **Swipe Up** | Jump |
| **Swipe Down** | Slide |
| **On-Screen D-Pad** | Optional large touch buttons available in Settings |

---

## 🛠️ Technology Stack

- **Rendering Engine**: [Three.js](https://threejs.org/) (Low-poly procedural 3D WebGL)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict typing, modular architecture)
- **Bundler & Dev Server**: [Vite](https://vitejs.dev/)
- **Audio**: Web Audio API (Pure procedural multi-track synthesizer)
- **Particle Effects**: Custom WebGL 3D Particle System + `canvas-confetti`
- **Persistence**: Safe `localStorage` wrapper with recovery defaults
- **Offline / PWA**: Native Service Worker with automatic bundle asset precaching and Web App Manifest

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18.0.0 or later (Node v20+ or v24 recommended)
- `npm` v9+

### 1. Installation
Clone or navigate to the project directory:
```bash
cd "c:\Users\deepe\Desktop\Fii\CAMPUS RUSH"
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

### 3. Build for Production
To build a fully optimized, static production bundle:
```bash
npm run build
```
The production files will be output to the `dist/` directory. Bundle assets are automatically injected into the Service Worker's precache list during build.

### 4. Preview Production Build
```bash
npm run preview
```
Open `http://localhost:4173` to test the production build locally.

---

## 🧪 Testing & Verification

The project includes unit tests, integration tests, headless browser smoke tests, and true offline verification tests.

### Run Unit & Systems Tests
```bash
npm test
```
*Executes `tests/core.test.ts` via the Node.js native test runner, validating Constants, StorageManager persistence, Pass & Play turn logic, and Missions tracking.*

### Run Headless Browser Smoke Test
```bash
node tests/smoke_browser.js
```
*Spawns a headless browser, connects via Chrome DevTools Protocol, verifies WebGL canvas initialization, simulates "Play Now" click, injects keyboard controls, verifies distance accumulation, and captures a screenshot.*

### Run UI Screenshots Test
```bash
node tests/test_ui_screens.js
```
*Captures screenshots of the Main Menu, Locker, and Leaderboard modals into `dist/`.*

### Run Mobile Viewport Test
```bash
node tests/test_mobile_viewport.js
```
*Emulates an iPhone/Android mobile portrait viewport (390x844), tests touch input layout, and captures mobile screenshots.*

### Run True Offline Verification Test
```bash
node tests/test_offline.js
```
*Loads the game online to seed the service worker cache, completely severs network connectivity, shuts down the HTTP server, reloads the page from cache, tests gameplay execution offline, and verifies that saved records persist.*

---

## 🌐 Production Deployment Guide

`dist/` is a completely static, standalone bundle with relative paths (`./`) and zero runtime backend dependencies. It can be deployed to any static host:

### GitHub Pages
1. Push the code to GitHub.
2. In your repository settings, set GitHub Pages source to GitHub Actions or deploy the `dist/` folder to the `gh-pages` branch.

### Netlify / Vercel
- **Build command**: `npm run build`
- **Publish directory**: `dist`

### Self-Hosted / Nginx / Apache
Copy the contents of `dist/` into your web server's root folder (`/var/www/html` or similar). Ensure HTTPS is enabled for Service Worker registration on remote domains.

---

## 💡 How to Extend the Game

### Adding a New Obstacle
1. Open [`src/game/Obstacles.ts`](file:///c:/Users/deepe/Desktop/Fii/CAMPUS%20RUSH/src/game/Obstacles.ts).
2. Add your obstacle type to `ObstacleType` union (e.g., `'WATER_COOLER'`).
3. Write a builder method `buildWaterCooler(): THREE.Group`.
4. Add the obstacle dimensions, collision bounding box, and whether it requires jumping or sliding to `createAndAddObstacle()`.

### Adding a New Character Outfit
1. Open [`src/game/Constants.ts`](file:///c:/Users/deepe/Desktop/Fii/CAMPUS%20RUSH/src/game/Constants.ts).
2. Add a new outfit entry to `OUTFITS` with `id`, `name`, `cost`, `hoodieColor`, `pantsColor`, `accentColor`, and `glowColor`.
3. The outfit will automatically appear in the Locker modal and can be unlocked using Byte Coins!

### Adding a New Mission
1. Open [`src/game/Missions.ts`](file:///c:/Users/deepe/Desktop/Fii/CAMPUS%20RUSH/src/game/Missions.ts).
2. Add a mission object to `MISSIONS_LIST` with `id`, `title`, `description`, `target`, `rewardCoins`, and `type`.
3. Call the appropriate `record...()` method in `GameEngine.ts` when the action occurs.

---

## 📜 Credits

- **Developer & Creator**: Deepesh Pankaj
- **Game Title**: DEEPESH DASH CAMPUS RUSH
- **License**: MIT
