# Transmission Easy Client

A browser extension that adds a Transmission WebUI directly in your web browser. Manage your torrents without leaving your browser.

> **Forked from [Feverqwe/Transmission](https://github.com/Feverqwe/Transmission)**

## Features

- Add torrents via URL, magnet links, or torrent files
- Context menu integration for quick torrent adding
- Real-time torrent status monitoring
- Speed graphs and statistics
- File priority management
- Label/category organization
- Multiple download directories support
- Notifications on download completion
- Alternative speed limits (turtle mode)
- Cloud settings sync
- **Dark mode** with system preference detection
- **Search/filter** torrents by name
- **Keyboard shortcuts** for power users

## Supported Browsers

- Google Chrome (88+)
- Mozilla Firefox
- Opera

## Supported Languages

- English (en)
- French (fr)
- Spanish (es)
- Portuguese - Brazil (pt_BR)
- Chinese - Simplified (zh_CN)
- Russian (ru)

## Installation

### From Source

```bash
# Clone the repository
git clone https://github.com/mthcore/transmission_extension.git
cd Transmission

# Install dependencies
npm install

# Build for all browsers
npm run release
```

The built extension will be in the `./dist` folder.

### Build Commands

| Command                  | Description                        |
| ------------------------ | ---------------------------------- |
| `npm run build`          | Build for Chrome (production)      |
| `npm run build:firefox`  | Build for Firefox (production)     |
| `npm run build:opera`    | Build for Opera (production)       |
| `npm run watch`          | Build for Chrome with watch mode   |
| `npm run watch:firefox`  | Build for Firefox with watch mode  |
| `npm run release`        | Build and package for all browsers |

## Configuration

1. Click on the extension icon and go to **Options**
2. Configure your Transmission server:
   - **IP Address**: Your Transmission server address
   - **Port**: RPC port (default: 9091)
   - **Path**: RPC path (default: /transmission/rpc)
   - **Username/Password**: If authentication is enabled
   - **Use SSL**: Enable for HTTPS connections

## Usage

- **Popup**: Click the extension icon to view and manage torrents
- **Context Menu**: Right-click on any torrent/magnet link to add it
- **Drag & Drop**: Drag torrent files onto the popup
- **Search**: Click the magnifying glass icon to filter torrents by name

## Keyboard Shortcuts

| Shortcut | Action |
| -------- | ------ |
| `R` | Refresh torrent list |
| `Ctrl+A` | Select/deselect all torrents |
| `Ctrl+U` | Add torrent from URL |
| `Delete` | Remove selected torrents |
| `Enter` | Start/stop selected torrents |
| `Escape` | Close dialogs or file list |

---

## Changelog

> See [RELEASE_NOTES.md](RELEASE_NOTES.md) for detailed release notes.

### Version 3.1.0 (January 2026)

- **Dark mode** with system preference detection
- **Search bar** to filter torrents by name
- **Keyboard shortcuts** for power users
- Progress bar with dynamic text color
- Bug fixes

### Version 3.0.0

Major modernization since fork:

- Manifest V3 migration
- React 19, MobX 6, Webpack 5
- Radix UI context menus
- SCSS architecture (replaced LESS)
- SVG icons (replaced PNG)
- GitHub Actions CI/CD

### Version 2.2.2 (Original)

Last version from [Feverqwe/Transmission](https://github.com/Feverqwe/Transmission).

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Credits

- Original project by [Feverqwe](https://github.com/Feverqwe)
- Fork maintained by [mthcore](https://github.com/mthcore)
