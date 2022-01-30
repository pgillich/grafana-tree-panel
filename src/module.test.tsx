import React /*, { ReactElement }*/ from 'react';
import { configure, HTMLAttributes, mount, ReactWrapper } from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import fs from 'fs';
import jsonata from 'jsonata';
import {
  FieldConfigSource,
  PanelData,
  PanelProps,
  TimeRange,
  LoadingState,
  EventBus,
  ScopedVars,
  AbsoluteTimeRange,
  FieldType,
  Field,
  ArrayVector,
} from '@grafana/data';
import { TreeLevelOrderMode, TreeOptions } from './types';
import { TreePanel, Props, idSep } from './TreePanel';

configure({ adapter: new Adapter() });

const panelPropsDefault: PanelProps = {
  id: 1,
  timeRange: ({} as unknown) as TimeRange,
  timeZone: '',
  transparent: false,
  renderCounter: 0,
  title: 'TreePanel',
  data: ({} as unknown) as PanelData,
  options: {},
  width: 800,
  height: 600,
  fieldConfig: ({} as unknown) as FieldConfigSource,
  eventBus: ({} as unknown) as EventBus,
  onOptionsChange: function (options: any): void {},
  onFieldConfigChange: function (config: FieldConfigSource<any>): void {},
  replaceVariables: function (value: string, scopedVars?: ScopedVars, format?: string | Function): string {
    return value;
  },
  onChangeTimeRange: function (timeRange: AbsoluteTimeRange): void {},
};

const optionsDefault = {
  treeFields: 'MUST_BE_SET',
  rootName: 'Pods',
  serieVariable: 'serieVariable',
  showItemCount: true,
  orderLevels: TreeLevelOrderMode.Asc,
  expandLevel: 100,
  enableConsoleLog: true,
} as TreeOptions;

const podJsonata =
  '$map(items, function($v) {{"namespace": $v.metadata.namespace, "name": $v.metadata.name, "appName": $v.metadata.labels."app.kubernetes.io/name" ? $v.metadata.labels."app.kubernetes.io/name" : ($v.metadata.labels."app" ? $v.metadata.labels."app" : "-"), "statusPhase": $v.status.phase, "containerCount": $count($v.spec.containers), "containerImage": $join($v.spec.containers[*].image, " "), "containerState": $v.status.containerStatuses[*].state ? $string($v.status.containerStatuses[*].state) : "-", "cluster": $serieVariable}})';

describe('Data processing and panel rendering', () => {
  it('simple data', () => {
    const options = {
      ...optionsDefault,
      treeFields: '${statusPhase}\n${namespace}\n${appName} ${name}\n${containerImage} ${containerState}',
    } as TreeOptions;

    let seriesData: Array<Field<string>> = [];
    const len = loadSerie(seriesData, 'test/mongo.json', 'mongo', options.serieVariable, podJsonata);

    const data = {
      series: [
        {
          name: 'mongo.json',
          fields: seriesData,
          length: len,
        },
      ],
      timeRange: ({} as unknown) as TimeRange,
      state: LoadingState.Done,
    } as PanelData;

    const params: Props = {
      ...panelPropsDefault,
      options: options,
      data: data,
    };

    const wrapper = mount(<TreePanel {...params} />);

    const nodes = wrapper.find('.customTreeItem');
    const nodesRendered = stringNodes(nodes, false);
    console.log('stringNodes():\n' + nodesRendered);

    expect(nodesRendered).toMatchSnapshot();
  });

  it('2 containers', () => {
    const options = {
      ...optionsDefault,
      treeFields: '${namespace}\n${appName}\n(${statusPhase}) ${name} [${containerImage}]\n${containerState}',
    } as TreeOptions;

    let seriesData: Array<Field<string>> = [];
    const len = loadSerie(
      seriesData,
      'test/longhorn-system.json',
      'longhorn-system',
      options.serieVariable,
      podJsonata
    );

    const data = {
      series: [
        {
          name: 'longhorn-system.json',
          fields: seriesData,
          length: len,
        },
      ],
      timeRange: ({} as unknown) as TimeRange,
      state: LoadingState.Done,
    } as PanelData;

    const params: Props = {
      ...panelPropsDefault,
      options: options,
      data: data,
    };

    const wrapper = mount(<TreePanel {...params} />);

    const nodes = wrapper.find('.customTreeItem');
    const nodesRendered = stringNodes(nodes, false);
    console.log('stringNodes():\n' + nodesRendered);

    expect(nodesRendered).toMatchSnapshot();
  });

  it('2 series', () => {
    const options = {
      ...optionsDefault,
      treeFields: '${statusPhase}\n${namespace}\n${appName} ${name}\n${containerImage}',
    } as TreeOptions;

    let seriesDataA: Array<Field<string>> = [];
    const lenA = loadSerie(seriesDataA, 'test/redis.json', 'redis', options.serieVariable, podJsonata);

    let seriesDataB: Array<Field<string>> = [];
    const lenB = loadSerie(
      seriesDataB,
      'test/rabbitmq-system.json',
      'rabbitmq-system',
      options.serieVariable,
      podJsonata
    );

    const data = {
      series: [
        {
          name: 'redis.json',
          fields: seriesDataA,
          length: lenA,
        },
        {
          name: 'rabbitmq-system.json',
          fields: seriesDataB,
          length: lenB,
        },
      ],
      timeRange: ({} as unknown) as TimeRange,
      state: LoadingState.Done,
    } as PanelData;

    const params: Props = {
      ...panelPropsDefault,
      options: options,
      data: data,
    };

    const wrapper = mount(<TreePanel {...params} />);

    const nodes = wrapper.find('.customTreeItem');
    const nodesRendered = stringNodes(nodes, false);
    console.log('stringNodes():\n' + nodesRendered);

    expect(nodesRendered).toMatchSnapshot();
  });
});

function stringNodes(root: ReactWrapper<HTMLAttributes, any, React.Component<{}, {}, any>>, showId: boolean): string {
  let kv = new Map<string, string>();
  root.forEach((node) => {
    const value = node.prop('label');
    if (node.key() === undefined || node.key() === null || value === undefined) {
      return;
    }
    kv.set(node.key(), value);
  });

  let lines: string[] = [];
  let keys = [...kv.keys()];
  keys.sort();
  keys.forEach((key) => {
    const indent = ' '.repeat(key.split(idSep).length - 1);
    if (showId) {
      lines.push(indent + key);
    }
    lines.push(indent + kv.get(key));
  });

  return lines.join('\n');
}

function makeField(name: string, values: string[]): Field<string> {
  return {
    name: name,
    type: FieldType.string,
    values: new ArrayVector(values),
    config: {},
  };
}

function loadSerie(
  seriesData: Array<Field<string>>,
  path: string,
  name: string,
  serieVariable: string,
  jsonAta: string
): number {
  const records = jsonata(jsonAta).evaluate(JSON.parse(String(fs.readFileSync(path))), {
    serieVariable: name,
  });
  console.log(records);

  let fieldValues = new Map<string, string[]>();
  let len = 0;
  records.forEach((record: Object) => {
    len++;
    Object.entries(record).forEach(([key, value]) => {
      if (!fieldValues.has(key)) {
        fieldValues.set(key, []);
      }
      fieldValues.get(key)?.push(String(value));
    });
  });

  fieldValues.forEach((values, field) => {
    expect(values.length).toBe(len);
    seriesData.push(makeField(field, values));
  });

  return len;
}

/*
 * used only for reverse engineering
 *

function findRootItem(
  wrapper: ReactWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>
): ReactWrapper<any, Readonly<{}>, React.Component<{}, {}, any>> | undefined {
  const props = wrapper.props();
  console.log(props);
  const nodeId = wrapper.prop('nodeId');
  if (nodeId !== undefined) {
    return wrapper;
  }

  let root: ReactWrapper<any, Readonly<{}>, React.Component<{}, {}, any>> | undefined = undefined;
  wrapper.children().forEach((child) => {
    if (root === undefined) {
      const w = findRootItem(child);
      if (w !== undefined) {
        root = w;
      }
    }
  });

  return root;
}

const stringRTree = function (item: ReactWrapper, indent: string, showId: boolean): string {
  let key = '';
  let label = '';
  let children: any[] = [];
  const props = typeof item.props === 'function' ? item.props() : item.props;
  Object.entries(props).forEach((pair) => {
    const [k, value] = pair;
    switch (k) {
      case 'key':
        key = String(value);
        break;
      case 'label':
        label = String(value);
        break;
      case 'children':
        children = value as any[];
        break;
    }
  });
  if (key === '') {
    key = typeof item.key === 'function' ? item.key() : String(item.key);
  }

  let stringItem = (showId ? indent + key + '\n' : '') + indent + label + '\n';
  if (children !== undefined) {
    children.forEach((child) => {
      const childRE = child as ReactWrapper;
      if (childRE !== undefined) {
        stringItem += stringRTree(childRE, indent + '  ', showId);
      }
    });
  }

  return stringItem;
};
*/
