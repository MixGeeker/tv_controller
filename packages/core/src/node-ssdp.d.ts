declare module "node-ssdp" {
  export type SsdpResponseHeaders = Record<string, string | string[] | undefined>;
  export interface ClientOptions {
    interfaces?: string[];
    explicitSocketBind?: boolean;
    reuseAddr?: boolean;
  }

  export class Client {
    constructor(options?: ClientOptions);
    on(event: "response", listener: (headers: SsdpResponseHeaders) => void): this;
    start(callback?: (error?: Error) => void): Promise<void>;
    search(target: string): Promise<void> | void;
    stop(): void;
  }
}
