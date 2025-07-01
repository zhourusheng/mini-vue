// 声明Buffer类型
declare class Buffer extends Uint8Array {
  write(string: string, encoding?: string): number;
  toString(encoding?: string, start?: number, end?: number): string;
  static from(arrayBuffer: ArrayBuffer): Buffer;
  static from(data: any[], encoding?: string): Buffer;
  static from(data: Uint8Array): Buffer;
  static from(str: string, encoding?: string): Buffer;
  static isBuffer(obj: any): obj is Buffer;
  static concat(list: Buffer[], totalLength?: number): Buffer;
}

// 声明Node.js内置模块
declare module 'fs' {
  export function readFileSync(path: string, options: { encoding: string; flag?: string; } | string): string;
  export function readFileSync(path: string, options?: { encoding?: null; flag?: string; } | null): Buffer;
  export function writeFileSync(path: string, data: any, options?: any): void;
  export function existsSync(path: string): boolean;
  export function mkdirSync(path: string, options?: { recursive?: boolean; mode?: number | string; } | number | string): void;
}

declare module 'path' {
  export function basename(path: string, ext?: string): string;
  export function dirname(path: string): string;
  export function join(...paths: string[]): string;
  export function resolve(...paths: string[]): string;
}

// 声明全局变量
declare var process: {
  argv: string[];
  exit(code?: number): void;
  env: Record<string, string | undefined>;
  cwd(): string;
}; 