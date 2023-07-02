import Dotenv from "dotenv";
Dotenv.config({
    path: '.env'
})
import Fastify from "fastify";
import knexPlugin from "./plugins/knex.ts";
import redisPlugin from "./plugins/redis.ts"
import routers from "./routers/index.ts"
import socketPlugin from "./plugins/socket.ts"
import fastifyCors from "@fastify/cors";
const app = Fastify({
    logger: true
})



const start = async () => {
    try {
        app
            .register(fastifyCors, {
                origin: '*',
            })
            .register(knexPlugin)
            .register(redisPlugin)
            .register(socketPlugin)
            .register(routers)

        await app.ready()
        await app.listen({
            port: 8080
        })


    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}

start()
