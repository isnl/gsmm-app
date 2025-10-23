/**
 * 科属种分类体系类型定义
 */

// 分类类型枚举
export type TaxonomyType = '科' | '属' | '种';

// 基础分类节点接口
export interface TaxonomyNode {
  /** 节点ID */
  id: number;
  /** 父节点ID，0表示根节点 */
  pid: number;
  /** 分类类型 */
  type: TaxonomyType;
  /** 分类名称 */
  name: string;
  /** 分类描述 */
  description: string;
  /** 子节点列表 */
  children: TaxonomyNode[];
}

// 科分类接口
export interface FamilyNode extends TaxonomyNode {
  type: '科';
  /** 属节点列表 */
  children: GenusNode[];
}

// 属分类接口
export interface GenusNode extends TaxonomyNode {
  type: '属';
  /** 种节点列表 */
  children: SpeciesNode[];
}

// 种分类接口
export interface SpeciesNode extends TaxonomyNode {
  type: '种';
  /** 种节点没有子节点 */
  children: [];
}

// 科属种数据结构（根级别为科的数组）
export type FamilyGenusSpeciesData = FamilyNode[];

// 分类查询参数接口
export interface TaxonomyQueryParams {
  /** 分类类型 */
  type?: TaxonomyType;
  /** 名称（模糊查询） */
  name?: string;
  /** 父节点ID */
  pid?: number;
  /** 是否包含子节点 */
  includeChildren?: boolean;
}

// 分类树节点选项接口（用于下拉选择等场景）
export interface TaxonomyOption {
  /** 节点ID */
  id: number;
  /** 显示标签 */
  label: string;
  /** 节点值 */
  value: number;
  /** 分类类型 */
  type: TaxonomyType;
  /** 父节点ID */
  pid: number;
  /** 是否有子节点 */
  hasChildren: boolean;
  /** 层级深度 */
  level: number;
}

// 分类统计信息接口
export interface TaxonomyStatistics {
  /** 科的总数 */
  familyCount: number;
  /** 属的总数 */
  genusCount: number;
  /** 种的总数 */
  speciesCount: number;
  /** 各科下属的数量统计 */
  genusCountByFamily: Record<string, number>;
  /** 各属下种的数量统计 */
  speciesCountByGenus: Record<string, number>;
}

// 分类路径接口
export interface TaxonomyPath {
  /** 完整路径节点列表 */
  nodes: TaxonomyNode[];
  /** 路径字符串（用分隔符连接） */
  pathString: string;
  /** 层级深度 */
  depth: number;
}

// 分类搜索结果接口
export interface TaxonomySearchResult {
  /** 匹配的节点 */
  node: TaxonomyNode;
  /** 节点路径 */
  path: TaxonomyPath;
  /** 匹配类型 */
  matchType: 'exact' | 'partial';
}

// 分类树构建选项接口
export interface TaxonomyTreeOptions {
  /** 是否展开所有节点 */
  expandAll?: boolean;
  /** 默认展开的层级 */
  defaultExpandLevel?: number;
  /** 是否显示空的分类节点 */
  showEmptyNodes?: boolean;
  /** 自定义排序函数 */
  sortFn?: (a: TaxonomyNode, b: TaxonomyNode) => number;
}

// 分类节点操作接口
export interface TaxonomyNodeOperations {
  /** 根据ID查找节点 */
  findById: (id: number) => TaxonomyNode | null;
  /** 根据名称查找节点 */
  findByName: (name: string, type?: TaxonomyType) => TaxonomyNode[];
  /** 获取节点路径 */
  getPath: (id: number) => TaxonomyPath | null;
  /** 获取所有叶子节点 */
  getLeafNodes: () => TaxonomyNode[];
  /** 获取指定类型的所有节点 */
  getNodesByType: (type: TaxonomyType) => TaxonomyNode[];
}

// 导出默认类型
export type { TaxonomyNode as default };
