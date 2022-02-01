import React, { FC } from 'react';
import { Field, PanelProps, DataFrame, GrafanaTheme2 } from '@grafana/data';
import { TreeView, TreeItem } from '@material-ui/lab';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRighticon from '@material-ui/icons/ChevronRight';
import { TreeOptions, TreeLevelOrderMode } from 'types';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

export interface Props extends PanelProps<TreeOptions> {}

interface DataItem {
  id: string;
  text: string;
  rows: DataItem[];
  groups: Map<string, DataItem>;
  values: Map<string, string>;
}

export const idSep = ':';

const getStyles = (theme: GrafanaTheme2) => ({
  treeBox: css`
    max-width: 100%;
    max-height: 100%;
    overflow: scroll;
  `,
});

export const TreePanel: FC<Props> = ({ options, data, width, height }) => {
  if (!data.series || data.series.length === 0) {
    throw 'no data';
  }

  const styles = useStyles2(getStyles);

  let dataItems = buildTreeData(options, data.series);
  if (options.enableConsoleLog) {
    console.log(stringTree(dataItems, '', false));
  }

  let defaultExpanded: string[] = [];
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
  const evalTemplate = (str: string, values: Map<string, string>) =>
    str.replace(/\${(.*?)}/g, (x, g) => String(values.get(String(g))));

  if (treeFields.length === 1) {
    let itemIdx = 0;
    item.rows.forEach((child) => {
      const key = evalTemplate(treeField, child.values);
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
    const key = evalTemplate(treeField, child.values);
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
      const value = String(field.values.get(i));
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
