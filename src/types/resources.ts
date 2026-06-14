/** A single resource item in a resource list. */
export interface ResourceItem {
  name: string;
  description: string;
  link: string;
}

/** The top-level structure of a resources-list.yml file. */
export interface ResourceListData {
  "resource-list": ResourceItem[];
}
