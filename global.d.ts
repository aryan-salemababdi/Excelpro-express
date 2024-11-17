import { Request } from 'express';
declare module 'express';


declare module 'express-serve-static-core' {
    interface Response {
        error: (code: number, message: string) => Response;
        success: (code: number, message: string, result: any) => Response
    } 
}


declare global {
    namespace Express {
        export interface Request {
            user?: any;
        }
    }
}