# LibreTime MCP — Remaining Tools

Grouped by tool category. Currently 13 of ~271 LibreTime API endpoints are implemented.

Read operations live in their feature category. All create, update, and delete operations live in `admin/`.

---

## MCP Apps _(experiments)_

MCP Apps render interactive HTML UIs directly inside Claude Desktop. High-value targets for this project:

- [ ] **Upload form** — file picker + metadata fields in one flow; solves the stdio-only binary limitation cleanly
- [ ] **Schedule viewer** — interactive calendar/grid for `get_schedule` output
- [ ] **File browser** — browsable table from `search_files` with inline edit/delete actions

> See: https://modelcontextprotocol.io/extensions/apps/overview

---

## files/ _(split from admin)_

File management tools. **stdio only for now** — `upload_file` reads from the local filesystem, so it only works when client and server share the same machine. HTTP support blocked until MCP Apps file picker lands.

Extends: `search_files`, `upload_file`, `update_file_metadata`, `delete_file`

- [ ] `download_file` — `GET /api/v2/files/{id}/download`

---

## shows/

Extends: `get_shows`, `get_schedule`, `get_stream_state`

- [ ] `get_show` — `GET /api/v2/shows/{id}`
- [ ] `get_show_instances` — `GET /api/v2/show-instances` _(scheduled occurrences of shows)_
- [ ] `get_show_instance` — `GET /api/v2/show-instances/{id}`
- [ ] `get_stream_preferences` — `GET /api/v2/stream/preferences`

---

## analytics/

Extends: `get_listener_counts`, `get_playout_history`

- [ ] `get_live_logs` — `GET /api/v2/live-logs` _(live broadcast events)_

---

## station/ _(new)_

Station identity and configuration. `/api/v2/info` requires no auth.

- [ ] `get_station_info` — `GET /api/v2/info`

---

## playlists/ _(new)_

- [ ] `get_playlists` — `GET /api/v2/playlists`
- [ ] `get_playlist` — `GET /api/v2/playlists/{id}`
- [ ] `get_playlist_contents` — `GET /api/v2/playlist-contents`

---

## podcasts/ _(new)_

- [ ] `get_podcasts` — `GET /api/v2/podcasts`
- [ ] `get_podcast` — `GET /api/v2/podcasts/{id}`
- [ ] `get_podcast_episodes` — `GET /api/v2/podcast-episodes`
- [ ] `get_podcast_episode` — `GET /api/v2/podcast-episodes/{id}`

---

## webstreams/ _(new)_

- [ ] `get_webstreams` — `GET /api/v2/webstreams`
- [ ] `get_webstream` — `GET /api/v2/webstreams/{id}`

---

## smart-blocks/ _(new)_

- [ ] `get_smart_blocks` — `GET /api/v2/smart-blocks`
- [ ] `get_smart_block` — `GET /api/v2/smart-blocks/{id}`
- [ ] `get_smart_block_criteria` — `GET /api/v2/smart-block-criteria`
- [ ] `get_smart_block_contents` — `GET /api/v2/smart-block-contents`

---

## admin/

Extends: `get_users`, `get_hosts`

**Shows**
- [ ] `create_show` — `POST /api/v2/shows`
- [ ] `update_show` — `PATCH /api/v2/shows/{id}`
- [ ] `delete_show` — `DELETE /api/v2/shows/{id}`

**Show hosts**
- [ ] `create_show_host` — `POST /api/v2/show-hosts` _(assign a host to a show)_
- [ ] `delete_show_host` — `DELETE /api/v2/show-hosts/{id}`

**Users**
- [ ] `get_user` — `GET /api/v2/users/{id}`
- [ ] `create_user` — `POST /api/v2/users`
- [ ] `update_user` — `PATCH /api/v2/users/{id}`
- [ ] `delete_user` — `DELETE /api/v2/users/{id}`

**Files**
- [ ] `get_version` — `GET /api/v2/version`

**Playlists**
- [ ] `create_playlist` — `POST /api/v2/playlists`
- [ ] `delete_playlist` — `DELETE /api/v2/playlists/{id}`
- [ ] `add_to_playlist` — `POST /api/v2/playlist-contents`
- [ ] `remove_from_playlist` — `DELETE /api/v2/playlist-contents/{id}`

**Podcasts**
- [ ] `create_podcast` — `POST /api/v2/podcasts`
- [ ] `delete_podcast` — `DELETE /api/v2/podcasts/{id}`

**Webstreams**
- [ ] `create_webstream` — `POST /api/v2/webstreams`
- [ ] `update_webstream` — `PATCH /api/v2/webstreams/{id}`
- [ ] `delete_webstream` — `DELETE /api/v2/webstreams/{id}`

**Smart blocks**
- [ ] `create_smart_block` — `POST /api/v2/smart-blocks`
- [ ] `update_smart_block` — `PATCH /api/v2/smart-blocks/{id}`
- [ ] `delete_smart_block` — `DELETE /api/v2/smart-blocks/{id}`

---

## Excluded (internal / system)

Not useful for an AI assistant — left unimplemented intentionally:

`celery-tasks`, `login-attempts`, `service-registers`, `timestamps`, `user-tokens`,
`third-party-track-references`, `playout-history-templates`, `playout-history-metadata`,
`webstream-metadata`, `libraries`, `station-podcasts`, `imported-podcasts`, `show-rebroadcasts`, `show-days`
