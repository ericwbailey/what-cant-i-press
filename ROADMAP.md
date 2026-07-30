# Roadmap

This is a living document. Items may change without notice.

Want something that isn't listed? Open a [feature request](https://github.com/ericwbailey/what-cant-i-press/issues/new/choose).

- [x] Make the web version of the app a PWA
- [x] Add a quick explanation video to README
- [ ] Sign app on macOS and Windows
- [ ] Register app with Homebrew
- [ ] Self-contained help file
- [ ] Add Orca keyboard shortcuts as a reference
- [ ] Add support for voice commands

## Non-goals

These are features I intentionally do not want to add.

### Linux

I investigated the feasibility of a Linux port, and ran into two major blockers:

- Linux's `AT-SPI` accessibility functionality is a lot less capable compared to macOS or Windows, meaning that scanning apps would not work. This means a Linux app would functionally have the same capabilities as [the web app](https://what-cant-i-press.app/), which already exists.
- Utilizing `AT-SPI` would require utilizing an [a dependency](https://www.npmjs.com/package/dbus-next) that has known security issues with no fix available. I take security seriously, and am unwilling to compromise the app in this way.

### Scan webpages for keyboard shortcuts

I also investigated the feasibility of this functionality. Unfortunately, JavaScript minification removes the ability to tease out what commands perform what actions. So, while the app would be able to detect that there are keyboard shortcuts present on a webpage, it would not be able to tell you what they did.
