import express, {
    Express,
    Request,
    Response,
    NextFunction
} from "express";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import http from "http";
import path from "path";
import cors from "cors";
import httpErrors from "http-errors";
import { PoolClient } from "pg";
import { fileURLToPath } from "url";
import { AllRoutes } from "./router/router";
import { pool } from "./utils/database/db";
import morgan from "morgan";

interface ErrorMessage extends Error {
    status?: number;
    statusCode?: number;
    message: string;
}

class Application {

    #app: Express;
    #PORT: number;

    constructor(PORT: number) {
        this.#PORT = PORT;
        this.#app = express();
        this.configApplication();
        this.connectToPgDB();
        this.createServer();
        this.createRoutes();
        this.errorHandling();
        this.initialRedis();
    }

    configApplication() {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        this.#app.use(morgan("dev"));
        this.#app.use(cors());
        this.#app.use(express.urlencoded({ extended: true }));
        this.#app.use(express.json());
        this.#app.use(express.static(path.join(__dirname, "..", "public")));
        this.#app.use("/api-doc", swaggerUi.serve, swaggerUi.setup(swaggerJSDoc({
            swaggerDefinition: {
                openapi: "3.0.0",
                info: {
                    title: "Excel-Pro",
                    version: "1.0.0",
                    description: "Excel Pro is a football academy",
                    contact: {
                        name: "Excel Pro Academy",
                        url: "http://localhost:5000",
                        email: "info@excelpro.com"
                    }
                },
                servers: [
                    {
                        url: "http://localhost:5000",
                    }
                ],
                components: {
                    securitySchemes: {
                        BearerAuth: {
                            type: "http",
                            scheme: "bearer",
                            bearerFormat: "JWT"
                        }
                    }
                },
                security: {
                    BearerAuth: []
                }
            },
            apis: ["./app/router/**/*.ts"],
        }),
            {
                explorer: true,
            }
        ))
    }

    createServer() {
        http.createServer(this.#app).listen(this.#PORT, () => {
            console.log(`run > http://localhost:${this.#PORT}`);
        });
    }

    async connectToPgDB() {
        let client: PoolClient | undefined;
        try {
            client = await pool.connect();
            console.log('Connected to PostgreSQL!');

            process.on('SIGINT', async () => {
                await pool.end();
                console.log('Disconnected from PostgreSQL!');
                process.exit(0);
            });

        } catch (err) {
            console.error('Could not connect to postgresql', err);
        } finally {
            if (client) client.release();
        }
    }

    initialRedis() {
        import("./utils/init_redis");
    }

    createRoutes() {
        this.#app.use(AllRoutes);
    }

    errorHandling() {
        this.#app.use((req, res, next) => {
            next(httpErrors.NotFound("آدرس مورد نظر یافت نشد"));
        });
        this.#app.use(((error: ErrorMessage, req: Request, res: Response, next: NextFunction) => {
            const serverError = httpErrors.InternalServerError();
            const statusCode = error.status || serverError.status;
            const message = error.message || serverError.message;

            res.status(statusCode).json({
                statusCode,
                errors: {
                    message,
                },
            });
            return;
        }) as express.ErrorRequestHandler);
    }
}

export default Application;
