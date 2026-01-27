/**
 * Global Type Definitions
 *
 * This file re-exports all types for easy importing throughout the project.
 * Usage: import { Torrent, File, TransmissionRequest } from '../types';
 */

// Transmission API types
export * from './transmission';

// Store types
export * from './stores';

// Message types
export * from './messages';

// Background script types
export * from './bg';

// Common utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

// Chrome extension message types
// Used for sending messages to background script
export interface ChromeMessage {
  action: string;
  [key: string]: unknown;
}

export interface ChromeResponse<T = unknown> {
  result?: T;
  error?: {
    message: string;
    code?: string;
    name?: string;
  };
}

// React component common props
export interface WithClassName {
  className?: string;
}

export interface WithStyle {
  style?: React.CSSProperties;
}

export interface WithChildren {
  children?: React.ReactNode;
}

// Event handler types
export type MouseEventHandler = React.MouseEventHandler<HTMLElement>;
export type ClickHandler = (e: React.MouseEvent) => void;
export type ChangeHandler<T = string> = (value: T) => void;
export type SubmitHandler = (e: React.FormEvent) => void;

// ID types used throughout the app
export type TorrentId = number;
export type FileId = string; // Files use name as identifier

// Selection state
export interface SelectionState {
  selectedIds: Set<TorrentId | FileId>;
  selectRange(from: number, to: number): void;
  toggleSelection(id: TorrentId | FileId): void;
  clearSelection(): void;
}
