declare module 'compression' {
  import { RequestHandler } from 'express';
  
  interface CompressionOptions {
    filter?: (req: any, res: any) => boolean;
    threshold?: number | string;
    level?: number;
    chunkSize?: number;
    memLevel?: number;
    strategy?: number;
  }
  
  function compression(options?: CompressionOptions): RequestHandler;
  function filter(req: any, res: any): boolean;
  
  namespace compression {
    export { compression, filter };
  }
  
  export = compression;
}
