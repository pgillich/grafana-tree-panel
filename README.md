# Grafana Tree Panel Plugin

https://grafana.com/blog/2021/01/21/6-tips-for-improving-your-grafana-plugin-before-you-publish/

This plugin can show a tree from records provided by a datasource. This panel is optized and tested with [JSON API](https://grafana.com/grafana/plugins/marcusolsson-json-datasource/) datasource.

This panel is developed for presenting Kubernetes resources received from Kubernetes API. A possible production environment is described at <https://github.com/pgillich/grafana-kubernetes>.

Example screenshot about a Kubernetes Namespace:

![2 panels](images/2panels.jpg)

## Datasource

All values from datasource are converted to string. The best datasource is [JSON API](https://grafana.com/grafana/plugins/marcusolsson-json-datasource/), but other datasources may also be used, for example TestData Logs:

![TestData, Logs](images/testdata.jpg)

The number of values in fields must be seme, so missing values must be substituted. [JSON API](https://grafana.com/grafana/plugins/marcusolsson-json-datasource/) supports JSONata, so it's possible. Example JSONata expression for Kubernetes API, which substitutes the missing values (`appName`, `containerState`) and generates string about lists (`containerImage`, `containerState`):

```jsonata
$map(items, function($v) {{"namespace": $v.metadata.namespace, "name": $v.metadata.name, "appName": $v.metadata.labels."app.kubernetes.io/name" ? $v.metadata.labels."app.kubernetes.io/name" : ($v.metadata.labels."app" ? $v.metadata.labels."app" : "-"), "statusPhase": $v.status.phase, "containerCount": $count($v.spec.containers), "containerImage": $join($v.spec.containers[*].image, " "), "containerState": $v.status.containerStatuses[*].state ? $string($v.status.containerStatuses[*].state) : "-", "cluster": $serieVariable}})
```

It's highly recommended to use same JSONata expression in field definition, only the selected field should be different, for example:

![Query editor 1](images/query_1.jpg)

![Query editor 2](images/query_2.jpg)

## Panel Options

Option descriptions can be read on the panel option editor:

![Panel options](images/options.jpg)

## Example Dashboards

Example dashboards can be found in [examples](examples).

## Development

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

---








[![Build](https://github.com/grafana/grafana-starter-panel/workflows/CI/badge.svg)](https://github.com/grafana/grafana-starter-panel/actions?query=workflow%3A%22CI%22)

This template is a starting point for building Grafana Panel Plugins in Grafana 7.0+

## What is Grafana Panel Plugin?

Panels are the building blocks of Grafana. They allow you to visualize data in different ways. While Grafana has several types of panels already built-in, you can also build your own panel, to add support for other visualizations.

For more information about panels, refer to the documentation on [Panels](https://grafana.com/docs/grafana/latest/features/panels/panels/)

## Getting started

1. Install dependencies

   ```bash
   yarn install
   ```

2. Build plugin in development mode or run in watch mode

   ```bash
   yarn dev
   ```

   or

   ```bash
   yarn watch
   ```

3. Build plugin in production mode

   ```bash
   yarn build
   ```

## Learn more

- [Build a panel plugin tutorial](https://grafana.com/tutorials/build-a-panel-plugin)
- [Grafana documentation](https://grafana.com/docs/)
- [Grafana Tutorials](https://grafana.com/tutorials/) - Grafana Tutorials are step-by-step guides that help you make the most of Grafana
- [Grafana UI Library](https://developers.grafana.com/ui) - UI components to help you build interfaces using Grafana Design System
