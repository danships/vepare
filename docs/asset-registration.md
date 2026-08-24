# Asset registration

Production assets live at `/srv/vpe/assets`. The deploy account writes assets with:

```sh
rsync --archive --no-links --delay-updates --partial-dir=/srv/vpe/.rsync-partial/ <source>/ /srv/vpe/assets/
```

`/srv/vpe/.rsync-partial` is outside the asset root and owned by the deploy account. Register assets only after rsync succeeds. The application account has read and directory-traverse access only; neither account may read or write database credentials or API-key files. Do not use `--delete` until a retirement workflow exists.

Set `ASSET_ROOT=/srv/vpe/assets` and use persistent storage for both it and MySQL. Back them up and restore them together. The MySQL application account needs only `CREATE`, `SELECT`, and `INSERT` on the application database: Supersave creates `file_asset` at initialization. It must not receive `UPDATE`, `DELETE`, `DROP`, `FILE`, or access to other databases.
