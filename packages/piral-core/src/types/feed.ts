import { ComponentType } from 'react';
import { Disposable } from './utils';

export interface ConnectorProps<TData> {
  /**
   * The current data from the feed.
   */
  data: TData;
}

export interface FeedConnector<TData> {
  /**
   * Connector function for wrapping a component.
   */
  <TProps>(component: ComponentType<TProps & ConnectorProps<TData>>): ComponentType<TProps>;
}

export interface FeedResolver<TData> {
  /**
   * Function to derive the initial set of data.
   * @returns The promise for retrieving the initial data set.
   */
  (): Promise<TData>;
}

export interface FeedReducer<TData, TAction> {
  (data: TData, item: TAction): Promise<TData> | TData;
}

export interface FeedSubscriber<TItem> {
  (callback: (value: TItem) => void): Disposable;
}

export interface FeedConnectorOptions<TData, TItem> {
  /**
   * Function to derive the initial set of data.
   * @returns The promise for retrieving the initial data set.
   */
  initialize: FeedResolver<TData>;
  /**
   * Function to be called for connecting to a live data feed.
   * @param callback The function to call when an item updated.
   * @returns A callback for disconnecting from the feed.
   */
  connect: FeedSubscriber<TItem>;
  /**
   * Function to be called when some data updated.
   * @param data The current set of data.
   * @param item The updated item to include.
   * @returns The promise for retrieving the updated data set or the updated data set.
   */
  update: FeedReducer<TData, TItem>;
  /**
   * Optional flag to avoid lazy loading and initialize the data directly.
   */
  immediately?: boolean;
}

export interface ConnectorDetails<TData, TItem> extends FeedConnectorOptions<TData, TItem> {
  /**
   * The ID of the connector.
   */
  id: string;
}
