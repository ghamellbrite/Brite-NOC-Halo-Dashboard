# Brite NOC Halo Dashboard

Userscript that turns HaloPSA dashboard `1013` into a full-screen NOC wallboard styled with the [Hali](https://github.com/carcosa-astral/Hali) design language. It reads the data Halo's own dashboard already loads; it makes no extra requests and stores nothing.

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/).
2. Open the raw script: <https://raw.githubusercontent.com/ghamellbrite/Brite-NOC-Halo-Dashboard/main/noc-dashboard.user.js>
3. Click **Install**. Tampermonkey checks this URL for updates, which are picked up when `@version` is bumped.

## Updating

Edit `noc-dashboard.user.js`, **bump `@version`**, and push to `main`. Without a version bump Tampermonkey will not update.

## Configuration

Everything is in the `CONFIG` block at the top of the script: report ids, crown threshold, SLA report and target, scroll speed.

Press **D** on the dashboard to see every report id Halo loads, its columns, and what the script mapped it to.
