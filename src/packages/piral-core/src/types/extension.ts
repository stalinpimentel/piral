import { PiralCustomExtensionSlotMap } from './custom';

export interface PiralExtensionSlotMap extends PiralCustomExtensionSlotMap {}

export interface BaseExtensionSlotProps<TName, TParams> {
  /**
   * Defines what should be rendered when no components are available
   * for the specified extension.
   */
  empty?(): React.ReactNode;
  /**
   * Defines how the provided nodes should be rendered.
   * @param nodes The rendered extension nodes.
   */
  render?(nodes: Array<React.ReactNode>): React.ReactElement<any, any> | null;
  /**
   * The custom parameters for the given extension.
   */
  params?: TParams;
  /**
   * The name of the extension to render.
   */
  name: TName;
}

/**
 * Props for defining an extension slot.
 */
export type ExtensionSlotProps<K = string> = BaseExtensionSlotProps<
  K extends string ? K : string,
  K extends keyof PiralExtensionSlotMap ? PiralExtensionSlotMap[K] : K extends string ? any : K
>;
