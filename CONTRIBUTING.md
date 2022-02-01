# Contributing

## Development Environment

The skeleton was created by <https://www.npmjs.com/package/@grafana/toolkit>. The typical developing use cases are described there. Jest snapshot is also used, so snapshots can be updated by `--updateSnapshot` option.

Running Grafana - which can access a Kubernetes API - in Docker Compose envirent is possible, only a `kubectl proxy` command is needed, for example:

```sh
kubectl proxy --address 0.0.0.0 --accept-hosts='.*' --reject-methods=POST,PUT,PATCH -v5
```

The HTTP URL of JSON API datasource should be set to the external or docker IP address of the host.

The `dist` directory should be mounted to the Grafana container and should be able to load without signature, see the related config options for a `docker-compose.yml`:

```yaml
services:
  grafana:
    volumes:
      - ./grafana/grafana-tree-panel/dist:/var/lib/grafana/plugins/pgillich-tree-panel
    environment:
      - GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS=pgillich-tree-panel
```

Above should be added to a `docker-compose.yml`, see example environment here: <https://github.com/pgillich/dockprom>. After running `yarn build`, Below command restarts the Grafana container:

```sh
docker-compose stop grafana && docker rm -fv grafana && docker-compose up -d grafana
```
