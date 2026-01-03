# 2048 - Premium Edition

A modern, premium redesign of the classic 2048 game with a stunning dark theme and sleek UI/UX.

![2048 Premium Edition](https://img.shields.io/badge/2048-Premium%20Edition-6C63FF?style=for-the-badge)

## 🎮 Play Now

Experience the classic 2048 puzzle game with a stunning dark theme and premium design aesthetics.

## ✨ Features

- **Premium Dark UI** - Sleek, modern interface with a beautiful dark theme
- **Minimalist Design** - Clean, uncluttered interface focusing on gameplay
- **Smooth Animations** - Fluid tile movements and merge effects
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Touch & Keyboard Controls** - Swipe on mobile, arrow keys on desktop
- **Undo Feature** - Take back your last move
- **Sound Effects** - Optional audio feedback (adjustable volume)
- **Progressive Web App** - Install on your device for offline play
- **Score Tracking** - Keeps track of your best score locally

## 🎨 Design Philosophy

This redesign brings a premium feel to the 2048 game:

- **Dark Theme**: Deep blacks (#0d0d0d) with subtle contrast
- **Accent Colors**: Vibrant purple-to-cyan gradients (#6C63FF → #00D9FF) and yellow accents (#FFD93D)
- **Typography**: Clean, bold system fonts with proper hierarchy
- **Spacing**: Generous padding and comfortable touch targets (minimum 52px)
- **Depth**: Subtle borders and clean card-based layouts
- **Polish**: Micro-interactions, smooth transitions, and attention to detail

## 🚀 Getting Started

### Play Online

Simply open `index.html` in your browser or visit the hosted version.

### Local Development

```bash
# Clone the repository
git clone <repository-url>
cd 2048

# Start a local server (choose one)
python -m http.server 8080
# or
npx serve
# or
php -S localhost:8080

# Open browser
# Navigate to http://localhost:8080
```

### Install as PWA

1. Open the game in Chrome/Edge
2. Click the install icon in the address bar
3. Enjoy offline gameplay!

## 🎯 How to Play

**Objective**: Combine numbered tiles to create a tile with the number 2048.

**Controls**:
- **Desktop**: Use arrow keys (↑ ↓ ← →) to slide tiles
- **Mobile**: Swipe in any direction
- **Undo**: Click the undo button to reverse your last move

**Rules**:
1. Tiles slide in the chosen direction until they hit a wall or another tile
2. When two tiles with the same number touch, they merge into one with double the value
3. After each move, a new tile (2 or 4) appears in a random empty spot
4. The game ends when the board is full and no moves are possible

**Tips**:
- Keep your highest tile in a corner
- Build up tiles in a consistent pattern
- Plan ahead - don't just make random moves
- Use the undo button wisely in tight situations

## 📁 Project Structure

```
2048/
├── index.html          # Main HTML file
├── styles.css          # Premium dark styling
├── scripts.js          # Game logic and interactions
├── favicon.svg         # SVG favicon
├── manifest.json       # PWA manifest (legacy)
├── manifest.webmanifest # PWA manifest
├── sw.js              # Service worker for offline functionality
├── icons/             # App icons for different platforms
│   └── android/       # Android-specific icons
└── README.md          # This file
```

## 🛠️ Technologies

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with gradients and animations
- **Vanilla JavaScript** - No frameworks, pure JS for game logic
- **PWA** - Progressive Web App with service worker
- **SVG** - Scalable vector graphics for icons

## 🎨 Color Palette

```css
--bg: #0d0d0d              /* Primary background */
--panel: #1a1a1a           /* Card background */
--panel-2: #242424         /* Secondary panel */
--accent: #6c63ff          /* Primary accent (purple) */
--accent-2: #00d9ff        /* Secondary accent (cyan) */
--accent-yellow: #ffd93d   /* Yellow accent */
--text: #ffffff            /* Primary text */
--text-secondary: #a0a0a0  /* Secondary text */
--muted: #666666           /* Muted text */
```

## 📱 Browser Support

- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari (iOS & macOS)
- ✅ Opera
- ⚠️ IE11 (Limited support)

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Credits

- **Original 2048 Game**: [Gabriele Cirulli](https://github.com/gabrielecirulli/2048)
- **Tile Colors**: Classic 2048 color scheme

## 📧 Contact

For questions, suggestions, or feedback, please open an issue on GitHub.

---

**Enjoy the game! 🎮**

Made with ❤️
