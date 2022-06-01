import React, { FC } from 'react';
import { Field, FieldType, PanelData, PanelProps, DataFrame, GrafanaTheme2, ArrayVector } from '@grafana/data';
import { TreeView, TreeItem } from '@material-ui/lab';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRighticon from '@material-ui/icons/ChevronRight';
import { /*Field,*/ useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import Handlebars from 'handlebars';
import { TreeOptions, TreeLevelOrderMode, TreeFileldTemplateEngine } from 'types';
//import { ObjectSerializer, V1Pod } from '@kubernetes/client-node';
import { ObjectSerializer, V1Pod } from './kubernetes_client-node/model/models';
import { printPod } from 'printers';

export interface Props extends PanelProps<TreeOptions> {}

interface DataItem {
  id: string;
  text: string;
  rows: DataItem[];
  groups: Map<string, DataItem>;
  values: Map<string, string>;
}

export const idSep = ':';

const treeFileldTemplateEngines = new Map<
  TreeFileldTemplateEngine,
  (str: string, values: Map<string, string>) => string
>([
  [TreeFileldTemplateEngine.Simple, evalTemplateSimple],
  [TreeFileldTemplateEngine.Handlebars, evalTemplateHandlebars],
]);

const getStyles = (theme: GrafanaTheme2) => ({
  treeBox: css`
    max-width: 100%;
    max-height: 100%;
    overflow: scroll;
  `,
});

export const TreePanel: FC<Props> = ({ options, data, width, height }) => {
  Handlebars.registerHelper('printPodColumn', printPodColumn);

  if (!data.series || data.series.length === 0) {
    throw 'no data';
  }

  const styles = useStyles2(getStyles);

  let onlyUndefined = true;
  data.series.forEach((serie) => {
    serie.fields.forEach((field) => {
      for (let i = 0; i < field.values.length; i++) {
        if (field.values.get(i) !== undefined) {
          onlyUndefined = false;
        }
      }
    });
  });

  let dataItems: DataItem;
  let defaultExpanded: string[] = [];

  if (onlyUndefined) {
    const noSeries: DataFrame[] = [];
    dataItems = buildTreeData(options, noSeries);
  } else {
    addSerieColumn(options.serieColumn, data);
    dataItems = buildTreeData(options, data.series);
    if (options.enableConsoleLog) {
      console.log(stringTree(dataItems, '', false));
    }
  }

  const appendToExpanded = (item: DataItem, level: number) => {
    if (level > 0) {
      defaultExpanded.push(item.id);
      item.groups.forEach((child) => {
        appendToExpanded(child, level - 1);
      });
    }
  };
  appendToExpanded(dataItems, options.expandLevel);

  const [expanded, setExpanded] = React.useState<string[]>(defaultExpanded);
  const handleToggle = (_event: any, nodeIds: React.SetStateAction<string[]>) => {
    setExpanded(nodeIds);
  };

  const loop = (item: DataItem): JSX.Element | undefined => {
    return (
      <TreeItem className="customTreeItem" key={item.id} nodeId={item.id} label={item.text}>
        {item.groups && item.groups.size !== 0
          ? orderValues(options.orderLevels)(item.groups.values()).map((child: DataItem) => {
              return loop(child);
            })
          : undefined}
      </TreeItem>
    );
  };

  return (
    <div className={styles.treeBox}>
      <TreeView
        className="customTreeView"
        defaultCollapseIcon={<ExpandMoreIcon />}
        defaultExpandIcon={<ChevronRighticon />}
        expanded={expanded}
        onNodeToggle={handleToggle}
      >
        {loop(dataItems)}
      </TreeView>
    </div>
  );
};

function jsonMapReplacer(_key: string, value: any): any {
  if (value instanceof Map) {
    return Array.from(value.entries());
  } else {
    return value;
  }
}

function orderValues(orderLevels: TreeLevelOrderMode) {
  return (valuesIterator: IterableIterator<DataItem>): DataItem[] => {
    let values = [...valuesIterator];
    const sorterAsc = (a: DataItem, b: DataItem) => (a.text.toLowerCase() > b.text.toLowerCase() ? 1 : -1);
    const sorterDesc = (a: DataItem, b: DataItem) => (a.text.toLowerCase() < b.text.toLowerCase() ? 1 : -1);
    const sorter = orderLevels === TreeLevelOrderMode.Asc ? sorterAsc : sorterDesc;

    values.sort(sorter);

    return values;
  };
}

function addSerieColumn(columnName: string, data: PanelData) {
  data.series.forEach((serie) => {
    const name = serie.name === undefined || serie.name === '' ? '<none>' : serie.name;
    let valueNum = 0;
    serie.fields.forEach((field) => {
      valueNum = Math.max(field.values.length, valueNum);
    });
    let values: ArrayVector<string> = new ArrayVector<string>();
    for (let i = 0; i < valueNum; i++) {
      values.add(name);
    }
    const field: Field<string> = {
      name: columnName,
      config: {},
      type: FieldType.string,
      values: values,
    } as Field;
    serie.fields.push(field);
  });
}

function buildTreeData(options: TreeOptions, series: DataFrame[]) {
  const name = options.rootName;
  const treeFields = options.treeFields.split('\n');
  const rootId = 'R';
  let rows: DataItem[] = [];
  series.forEach((serie) => {
    rows.push(...getRows(serie.fields));
  });

  let rootItem: DataItem = {
    id: rootId,
    text: options.showItemCount ? name + ' (' + rows.length + ')' : name,
    rows: rows,
    groups: new Map<string, DataItem>(),
    values: new Map<string, string>(),
  };

  childrenByField(rootItem, options, treeFields);
  if (options.enableConsoleLog) {
    console.log(JSON.stringify(rootItem, jsonMapReplacer));
  }

  return rootItem;
}

function childrenByField(item: DataItem, options: TreeOptions, treeFields: string[]) {
  const treeField = treeFields[0];

  if (treeFields.length === 1) {
    let itemIdx = 0;
    item.rows.forEach((child) => {
      const key = evalTemplate(options.treeFieldTemplateEngine, treeField, child.values);
      const childId = item.id + idSep + correctId(key) + idSep + String(itemIdx++);
      item.groups.set(key, {
        id: childId,
        text: key,
        rows: [],
        groups: new Map<string, DataItem>(),
        values: child.values,
      });
    });
    item.rows = [];

    return;
  }

  let itemIdx = 0;
  item.rows.forEach((child) => {
    const key = evalTemplate(options.treeFieldTemplateEngine, treeField, child.values);
    const childId = item.id + idSep + correctId(key) + idSep + String(itemIdx++);
    if (!item.groups.has(key)) {
      item.groups.set(key, {
        id: childId,
        text: key,
        rows: [],
        groups: new Map<string, DataItem>(),
        values: new Map<string, string>(),
      });
    }

    item.groups.get(key)!.rows.push(child);
  });

  item.groups.forEach((child) => {
    if (options.showItemCount) {
      child.text += ' (' + child.rows.length + ')';
    }
    childrenByField(child, options, treeFields.slice(1));
  });

  item.rows = [];
}

function evalTemplate(templateEngine: TreeFileldTemplateEngine, str: string, values: Map<string, string>): string {
  const templateFunc = treeFileldTemplateEngines.get(templateEngine);
  if (templateFunc === undefined) {
    return 'Internal error: templateEngine is undefined';
  }
  let evaluated = '';

  try {
    evaluated = templateFunc(str, values);
  } catch (err) {
    evaluated = err instanceof Error ? err.message : String(err);
  }

  return evaluated;
}

function evalTemplateSimple(str: string, values: Map<string, string>): string {
  const evalTemplate = (str: string, values: Map<string, string>) =>
    str.replace(/\${(.*?)}/g, (x, g) => String(values.get(String(g))));

  return evalTemplate(str, values);
}

function evalTemplateHandlebars(source: string, values: Map<string, string>): string {
  var template = Handlebars.compile(source, {
    noEscape: true,
  });

  return template(Object.fromEntries(values));
}

export function printPodColumn(jsonText: string, column: string): string {
  var pod: V1Pod;
  try {
    pod = ObjectSerializer.deserialize(JSON.parse(jsonText), 'V1Pod');
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }

  const row = printPod(pod, new Date());

  return row.get(column) === undefined ? '' : String(row.get(column));
}

function getRows(fields: Field[]): DataItem[] {
  let rows: DataItem[] = [];
  let len = 0;
  fields.forEach((field) => {
    if (field.values.length > len) {
      len = field.values.length;
    }
  });

  for (let i = 0; i < len; i++) {
    let rowValues = new Map<string, string>();
    fields.forEach((field) => {
      let value = field.values.get(i);
      if (typeof field.values.get(i) === 'object') {
        try {
          value = JSON.stringify(field.values.get(i));
        } catch (err) {
          value = err instanceof Error ? err.message : String(err) + ': ' + String(value);
        }
      } else {
        value = String(value);
      }
      rowValues.set(field.name, value);
    });

    rows.push({
      id: '',
      text: '',
      rows: [],
      groups: new Map<string, DataItem>(),
      values: rowValues,
    });
  }

  return rows;
}

function stringTree(item: DataItem, indent: string, showId: boolean): string {
  let stringItem = (showId ? indent + item.id + '\n' : '') + indent + item.text + '\n';
  item.groups.forEach((child) => {
    stringItem += stringTree(child, indent + '  ', showId);
  });

  return stringItem;
}

/*
https://www.w3.org/TR/html4/types.html#type-name
ID and NAME tokens must begin with a letter ([A-Za-z]) and may be followed by any number of
letters, digits ([0-9]), hyphens ("-"), underscores ("_"), colons (":"), and periods (".").
*/
export function correctId(id: string): string {
  return id.replace(/[^A-Z^a-z^0-9^\-^_^:^.]/g, '_');
}
