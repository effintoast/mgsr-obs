Dont do it.

cfg/mgsr-obs.json:

```
{
    "streamlabs_api_key": "",
    "obs_host": "localhost:4444",
    "obs_password": "",
    "obs_autoconnect": false,
    "obs_hide_host_fields": false,
    "player_sources" : [
        {"source_name": "P1", "display_name": "Player 1", "runner_slug": "mgsr-1"},
        {"source_name": "P2", "display_name": "Player 2", "runner_slug": "mgsr-2"},
        {"source_name": "P3", "display_name": "Player 3", "runner_slug": "mgsr-3"},
        {"source_name": "P4", "display_name": "Player 4", "runner_slug": "mgsr-4"}
    ],
    "player_sources_values": [
        {"source_url": "rtmp://rtmp.example.com", "display_name": "NA RTMP"},
        {"source_url": "rtmp://eu-rtmp.example.com", "display_name": "EU RTMP"},
        {"source_url": "rtmp://oce-rtmp.example.com", "display_name": "OCE RTMP"}
    ]
  }
```