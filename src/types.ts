export interface Article {
  id: string;
  title: string;
  content: string;
  chinese_translation?: string;
  topic: string;
  language: string;
  createdAt: number;
  isReference?: boolean;
}

export interface RevisionHistoryItem {
  request: string;
  notes: string;
  timestamp: number;
}

export interface Reference {
  type: 'library' | 'web';
  title: string;
  url?: string;
}

export interface Draft {
  id: string;
  title: string;
  content: string;
  chinese_translation: string;
  logic_check_notes: string;
  topic: string;
  language: string;
  lastSaved: number;
  revision_history?: RevisionHistoryItem[];
  references?: Reference[];
}
