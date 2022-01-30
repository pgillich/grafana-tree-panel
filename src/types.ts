export enum TreeLevelOrderMode {
  Asc = 'asc',
  Desc = 'desc',
}

export interface TreeOptions {
  rootName: string;
  treeFields: string;
  serieVariable: string;
  expandLevel: number;
  showItemCount: boolean;
  orderLevels: TreeLevelOrderMode;
  enableConsoleLog?: boolean;
}
