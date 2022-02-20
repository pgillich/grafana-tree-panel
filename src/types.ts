export enum TreeLevelOrderMode {
  Asc = 'asc',
  Desc = 'desc',
}

export enum TreeFileldTemplateEngine {
  Simple = 'simple',
  Handlebars = 'handlebars',
}

export interface TreeOptions {
  rootName: string;
  treeFieldTemplateEngine: TreeFileldTemplateEngine;
  treeFields: string;
  serieVariable: string;
  expandLevel: number;
  showItemCount: boolean;
  orderLevels: TreeLevelOrderMode;
  enableConsoleLog?: boolean;
}
