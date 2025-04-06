import { IssueIntegrationCfgs, IssueProviderKey } from '../issue/issue.model';
import {
  WorkContextAdvancedCfgKey,
  WorkContextCommon,
} from '../work-context/work-context.model';
import { EntityState } from '@ngrx/entity';
import { MODEL_VERSION_KEY } from '../../app.constants';

export type RoundTimeOption = '5M' | 'QUARTER' | 'HALF' | 'HOUR' | null;

export interface ProjectBasicCfg {
  title: string;
  isHiddenFromMenu: boolean;
  // TODO remove maybe
  isArchived: boolean;
  isEnableBacklog: boolean;
  taskIds: string[];
  backlogTaskIds: string[];
  noteIds: string[];
}

export interface ProjectCopy extends ProjectBasicCfg, WorkContextCommon {
  id: string;
  // TODO legacy remove
  issueIntegrationCfgs?: IssueIntegrationCfgs;
}

export type Project = Readonly<ProjectCopy>;

export type ProjectCfgFormKey =
  | WorkContextAdvancedCfgKey
  | IssueProviderKey
  | 'basic'
  | 'theme';

export interface ProjectState extends EntityState<Project> {
  [MODEL_VERSION_KEY]?: number;
}
