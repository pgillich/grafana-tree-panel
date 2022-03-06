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
  serieColumn: string;
  expandLevel: number;
  showItemCount: boolean;
  orderLevels: TreeLevelOrderMode;
  enableConsoleLog?: boolean;
}

export declare type IntOrString = number | string;
