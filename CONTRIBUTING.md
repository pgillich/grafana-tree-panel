# Contributing

## Development Environment

The skeleton was created by <https://www.npmjs.com/package/@grafana/toolkit>. The typical developing use cases are described there.
Jest snapshot is also used, so snapshots can be updated by `--updateSnapshot` option.

### Debug

Console logs can be enabled by setting `const enableConsoleLog = false;` in `src/module.test.tsx`.

## Kubernetes client

The official [@kubernetes/client-node](https://www.npmjs.com/package/@kubernetes/client-node) does not run in browser, because the `os.constants.signals` is needed, but [browser-os](https://www.npmjs.com/package/browser-os) does not provides it.
There is a similar issue with [browser-stream](https://www.npmjs.com/package/browser-stream).

The workaround is: generating only the model of [@kubernetes/client-node](https://www.npmjs.com/package/@kubernetes/client-node) by `generate-client.sh`, which is forked from <https://github.com/kubernetes-client/javascript/blob/master/generate-client.sh>.

### Docker Compose

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

Above should be added to a `docker-compose.yml`, see example environment here: <https://github.com/stefanprodan/dockprom>. After running `yarn build` or `yarn dev`, Below command restarts the Grafana container:

```sh
docker-compose stop grafana && docker rm -f grafana && docker-compose up -d grafana
```

### Kubernetes

It's possible to install a local Kubernetes on a laptop with JSON API and this plugin, see more details here:

* <https://github.com/pgillich/grafana-kubernetes>
* <https://github.com/pgillich/kind-on-dev>

Perhaps the official pgillich-tree-panel plugin should be uninstalled, for example on <https://monitoring.kind-01.company.com/grafana/plugins/pgillich-tree-panel?page=overview>.

Edit Grafana pod ConfigMap to remove pgillich-tree-panel from plugin list:

```sh
GRAFANA_POD=$(kubectl get pod -n monitoring -l 'app.kubernetes.io/name=grafana' -o name | sed 's#^pod/##g'); kubectl edit cm -n monitoring prometheus-stack-grafana;
```

After `yarn build` or `yarn dev`, below command copies the package files to the Grafana container:

```sh
export GRAFANA_POD=$(kubectl get pod -n monitoring -l 'app.kubernetes.io/name=grafana' -o name | sed 's#^pod/##g'); kubectl exec -n monitoring ${GRAFANA_POD} -c grafana -- /bin/sh -c 'rm -rf /var/lib/grafana/plugins/pgillich-tree-panel'; kubectl cp ./dist -n monitoring -c grafana ${GRAFANA_POD}:/var/lib/grafana/plugins/pgillich-tree-panel; kubectl exec -n monitoring ${GRAFANA_POD} -c grafana -- /bin/sh -c 'rm -f /var/lib/grafana/plugins/pgillich-tree-panel/MANIFEST.txt'; kubectl exec -n monitoring ${GRAFANA_POD} -c grafana -- /bin/sh -c 'grep version /var/lib/grafana/plugins/pgillich-tree-panel/plugin.json';
```

rm -f /var/lib/grafana/plugins/pgillich-tree-panel/MANIFEST.txt

Below command restarts the container:

```sh
kubectl exec -n monitoring ${GRAFANA_POD} -c grafana -- /bin/sh -c 'ps -ef; kill 1'
```

The container restart takes a few seconds, which can be checked by below command:

```sh
GRAFANA_POD=$(kubectl get pod -n monitoring -l 'app.kubernetes.io/name=grafana' -o name | sed 's#^pod/##g'); kubectl exec -n monitoring ${GRAFANA_POD} -c grafana -- /bin/sh -c 'ps -ef'
```

After restart, the page must be refreshed.

### Fake JSON server

For testing purposes, a fake JSON server can be setup, for example: <https://github.com/typicode/json-server>.

Below example starts a fake JSON server from a sample JSON directory:

```sh
touch /tmp/db.json; json-server --host '0.0.0.0' --port 3001 --static ./test/tmp/ /tmp/db.json
```
