import { PanelPlugin } from '@grafana/data';
import { TreeOptions, TreeLevelOrderMode, TreeFileldTemplateEngine } from './types';
import { TreePanel } from './TreePanel';

export const plugin = new PanelPlugin<TreeOptions>(TreePanel).setPanelOptions((builder) => {
  return builder
    .addTextInput({
      path: 'rootName',
      name: 'Tree root name',
      description: '1 line',
      defaultValue: 'Root',
    })
    .addSelect({
      path: `treeFieldTemplateEngine`,
      name: 'Field template engine',
      description: '',
      defaultValue: TreeFileldTemplateEngine.Simple,
      settings: {
        options: [
          { value: TreeFileldTemplateEngine.Simple, label: 'Simple', description: '${field}' },
          { value: TreeFileldTemplateEngine.Handlebars, label: 'Handlebars', description: '{{field}}' },
        ],
      },
    })
    .addTextInput({
      path: 'treeFields',
      name: 'Tree level definitions',
      description: 'Separated by endline. Use Serie varible name in order to take difference several series',
      defaultValue: '${field_1} ${field_2}\n${field_3}',
      settings: {
        rows: 5,
        useTextarea: true,
      },
    })
    .addTextInput({
      path: 'serieColumn',
      name: 'Serie column name',
      description:
        'Serie name added as a new column. The value is unspecified in Table view.\nExample for usage in Tree level definitions: ${serieColumn} or {{serieColumn}}',
      defaultValue: 'serieColumn',
    })
    .addNumberInput({
      path: 'expandLevel',
      name: 'Expanded levels',
      description: 'Number of levels expanded by default. Applied after save and apply (page refresh)',
      defaultValue: 1,
    })
    .addBooleanSwitch({
      path: 'showItemCount',
      name: 'Show item count',
      defaultValue: true,
    })
    .addRadio({
      path: 'orderLevels',
      name: 'Order in each level',
      defaultValue: TreeLevelOrderMode.Asc,
      settings: {
        options: [
          { value: TreeLevelOrderMode.Asc, label: 'Ascendent' },
          { value: TreeLevelOrderMode.Desc, label: 'Descendent' },
        ],
      },
    });
});
