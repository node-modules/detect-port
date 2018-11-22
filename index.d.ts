interface DetectPort {
  (param: {
    port: number;
    hostname: string;
    callback: (err: Error, _port: number) => void;
  }): void;
  (param: {
    port: number;
    hostname: string;
  }): Promise<number>;
  (port: number, callback: (err: Error, _port: number) => void): void;
  (port: number): Promise<number>;
}

declare const detectPort: DetectPort;
export = detectPort;
