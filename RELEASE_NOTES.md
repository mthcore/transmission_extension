# Release Notes - Transmission Easy Client

## Version 3.2.0 (February 2026)

- **Torrent Details dialog** - New tabbed interface (Info, Trackers, Seed Limits) with detailed torrent info: creator, creation date, pieces, time seeding/downloading, webseeds, and more
- **Tracker management** - View tracker stats (seeds, peers, status per tracker) and edit the tracker list directly from the dialog
- **Per-torrent seed limits** - Set custom ratio and idle limits per torrent (Global / Custom / Unlimited)
- **Label filtering** - Filter torrents by label in the category selector, including a "No Label" option
- **Server settings** - 17 new Transmission settings: queue limits, incomplete directory, alt-speed schedule, post-download script, and more
- **Resizable columns** - Peer and tracker table columns can be resized by dragging, with persistent widths
- **Selectable text** - Torrent details (hash, path, etc.) can now be selected and copied
- **Network resilience** - Automatic retry with exponential backoff on network errors
- **98 tests** - Expanded test suite covering TorrentStore and TorrentListStore

## Version 3.1.1 (February 2026)

- **Fixed "Rename" context menu** - Dialog now opens correctly

## Version 3.1.0 (January 2026)

- **Full TypeScript migration** - 97 files converted from JavaScript/JSX to TypeScript/TSX
- **Constants extraction** - Hardcoded values moved to `src/constants.ts`
- **Dark mode** with system preference detection
- **Search bar** to filter torrents by name
- **Keyboard shortcuts** for power users
- Progress bar with dynamic text color
- Bug fixes

## Version 3.0.0

Major modernization since fork:

- Manifest V3 migration
- React 19, MobX 6, Webpack 5
- Radix UI context menus
- SCSS architecture (replaced LESS)
- SVG icons (replaced PNG)
- GitHub Actions CI/CD

## Version 2.2.2 (Original)

Last version from [Feverqwe/Transmission](https://github.com/Feverqwe/Transmission).
