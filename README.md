# Grafana Tree Panel Plugin

[![Build](https://github.com/pgillich/grafana-tree-panel/workflows/CI/badge.svg)](https://github.com/pgillich/grafana-tree-panel/actions?query=workflow%3A%22CI%22)

This plugin can show a tree from records provided by a datasource. This panel is optized and tested with [JSON API](https://grafana.com/grafana/plugins/marcusolsson-json-datasource/) datasource.

This panel is developed for presenting Kubernetes resources received from Kubernetes API. A possible production environment is described at <https://github.com/pgillich/grafana-kubernetes>.

Example screenshot about a Kubernetes Namespace:

![2 panels](https://github.com/pgillich/grafana-tree-panel/raw/main/images/2panels.jpg)

## Datasource

All values from datasource are converted to string. The best datasource is [JSON API](https://grafana.com/grafana/plugins/marcusolsson-json-datasource/), but other datasources may also be used, for example TestData Logs:

![TestData, Logs](https://github.com/pgillich/grafana-tree-panel/raw/main/images/testdata.jpg)

The number of values in fields must be same, so missing values must be substituted. [JSON API](https://grafana.com/grafana/plugins/marcusolsson-json-datasource/) supports JSONata, so it's possible.

Example JSONata expression for Kubernetes API, which substitutes the missing values (`appName`, `containerState`) and generates string about lists (`containerImage`, `containerState`):

```jsonata
$map(items, function($v) {{"namespace": $v.metadata.namespace, "name": $v.metadata.name, "appName": $v.metadata.labels."app.kubernetes.io/name" ? $v.metadata.labels."app.kubernetes.io/name" : ($v.metadata.labels."app" ? $v.metadata.labels."app" : "-"), "statusPhase": $v.status.phase, "containerCount": $count($v.spec.containers), "containerImage": $join($v.spec.containers[*].image, " "), "containerState": $v.status.containerStatuses[*].state ? $string($v.status.containerStatuses[*].state) : "-", "cluster": $serieVariable}})
```

If Grafana runs outside of the Kubernetes cluster, a `kubectl proxy` command can create API endpoint for [JSON API](https://grafana.com/grafana/plugins/marcusolsson-json-datasource/) in order to access the cluster:

```sh
kubectl proxy --address 0.0.0.0 --accept-hosts='.*' --reject-methods=POST,PUT,PATCH -v5
```

It's highly recommended to use same JSONata expression in field definition, only the selected field should be different, for example:

![Query editor 1](https://github.com/pgillich/grafana-tree-panel/raw/main/images/query_1.jpg)

![Query editor 2](https://github.com/pgillich/grafana-tree-panel/raw/main/images/query_2.jpg)

## Panel Options

Option descriptions can be read on the panel option editor:

![Panel options](https://github.com/pgillich/grafana-tree-panel/raw/main/images/options.jpg)

## Example Dashboards

Example dashboards can be found in [examples](https://github.com/pgillich/grafana-tree-panel/raw/main/examples).
