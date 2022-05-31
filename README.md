# Grafana Tree Panel Plugin

[![Build](https://github.com/pgillich/grafana-tree-panel/workflows/CI/badge.svg)](https://github.com/pgillich/grafana-tree-panel/actions?query=workflow%3A%22CI%22)

This panel plugin shows a tree from records, provided by a datasource. The plugin is optized and tested with [JSON API](https://grafana.com/grafana/plugins/marcusolsson-json-datasource/) datasource.

This plugin presents JSON API responses, for example Kubernetes resources received from Kubernetes API. A possible production environment is described at <https://github.com/pgillich/grafana-kubernetes>.

Example screenshot about a Kubernetes Namespace:

![2 panels](https://github.com/pgillich/grafana-tree-panel/raw/main/images/2panels.jpg)

Screenshot about a panel editor:

![simple-editor](https://github.com/pgillich/grafana-tree-panel/raw/main/images/simple-editor.png)

## Datasource

All values from datasource are converted to string. The object type is converted to JSON string. The best datasource is [JSON API](https://grafana.com/grafana/plugins/marcusolsson-json-datasource/), but other datasources may also be used, for example TestData Logs:

![TestData, Logs](https://github.com/pgillich/grafana-tree-panel/raw/main/images/testdata.jpg)

The number of values in fields must be same, so missing values must be substituted. [JSON API](https://grafana.com/grafana/plugins/marcusolsson-json-datasource/) supports JSONata, so it's possible.

Example JSONata expression for Kubernetes API, which substitutes the missing values (`appName`, `containerState`) and generates string about lists (`containerImage`, `containerState`):

```jsonata
$map(items, function($v) {{"namespace": $v.metadata.namespace, "name": $v.metadata.name, "appName": $v.metadata.labels."app.kubernetes.io/name" ? $v.metadata.labels."app.kubernetes.io/name" : ($v.metadata.labels."app" ? $v.metadata.labels."app" : "-"), "statusPhase": $v.status.phase, "containerCount": $count($v.spec.containers), "containerImage": $join($v.spec.containers[*].image, " "), "containerState": $v.status.containerStatuses[*].state ? $string($v.status.containerStatuses[*].state) : "-"}})
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

The default template engine is a simple and fast `${field}`-style expression processor, for example:

```text
${statusPhase}
${namespace}
${appName} ${name}
${containerImage}
```

If a more complex template engine is needed, [Handlebars](https://github.com/handlebars-lang/handlebars.js) can be used,
which is a `{{field}}`-style engine, for example:

![handlebars-options](https://github.com/pgillich/grafana-tree-panel/raw/main/images/handlebars-options.jpg)

Screenshot about a panel editor, with Handlebars engine:

![handlebars-editor](https://github.com/pgillich/grafana-tree-panel/raw/main/images/handlebars-editor.png)

## Handlebars extensions

### Pod info

An additional function is added to [Handlebars](https://github.com/handlebars-lang/handlebars.js), for having better information about Kubernetes Pods.
It's complex to evaluate the `STATUS` and other `kubectl get pod -o wide` columns from Kubernetes API responses,
so the [printPod()](https://github.com/kubernetes/kubernetes/blob/master/pkg/printers/internalversion/printers.go#L741) function was ported to TypeScript. The syntax is: `{{printPodColumn <whole_pod> "<column>"}}`, where `<whole_pod>` the field, which contains the whole pod, `<column>` is the `kubectl get pod -o wide` column name, for example:

* `NAME`
* `READY`
* `STATUS`
* `RESTARTS`
* `AGE`
* `IP`
* `NODE`
* `NOMINATED_NODE`
* `READINESS_GATES`
* `MESSAGE`

The `AGE` behaves a little bit different: it's a little bit more precise.
The `MESSAGE` column contains additional info (reason) about the `STATUS`.
Example for `printPodColumn`:

```text
{{printPodColumn rawPod "STATUS"}}
{{namespace}}
{{appName}} {{name}}
{{containerImage}} {{printPodColumn rawPod "MESSAGE"}}
```

Example JSONata datasource expression for above template:

```jsonata
$map(items, function($v) {{"rawPod": $v, "namespace": $v.metadata.namespace, "name": $v.metadata.name, "appName": $v.metadata.labels."app.kubernetes.io/name" ? $v.metadata.labels."app.kubernetes.io/name" : ($v.metadata.labels."app" ? $v.metadata.labels."app" : "-"), "statusPhase": $v.status.phase, "containerCount": $count($v.spec.containers), "containerImage": $join($v.spec.containers[*].image, " "), "containerState": $v.status.containerStatuses[*].state ? $string($v.status.containerStatuses[*].state) : "-"}})
```

Example screenshot for comparing Pod status info form raw Kubernetes API and from `printPodColumn` function:

![simple-handlebars](https://github.com/pgillich/grafana-tree-panel/raw/main/images/simple-handlebars.png)

## Example Dashboards

Example dashboards can be found in [examples](https://github.com/pgillich/grafana-tree-panel/raw/main/examples).

* `Namespace Pods.json` Pods of a selected Namespace, Simple template engine
* `All Pods.json` Pods of all Namespaces, Handlebars template engine with `kubectl` columns.

## Creating Issues

Please attach sample json file(s) to the new Issue.

## Contributing

See more details in [CONTRIBUTING.md](https://github.com/pgillich/grafana-tree-panel/raw/main/CONTRIBUTING.md).
