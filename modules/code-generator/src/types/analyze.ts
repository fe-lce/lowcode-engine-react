import type { IPublicTypeContainerSchema } from '@felce/lowcode-types';

export interface ICompAnalyzeResult {
  isUsingRef: boolean;
}

export type TComponentAnalyzer = (container: IPublicTypeContainerSchema) => ICompAnalyzeResult;
