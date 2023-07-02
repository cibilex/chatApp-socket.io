import fp from "fastify-plugin";
import { Server } from "socket.io";
import  { FastifyPluginCallback } from "fastify"
import { instrument } from "@socket.io/admin-ui";
import { Redis } from "ioredis";
import helmet from "helmet"




const addUserToRoom = async (io: Server, chatKey: string, from: string, to: string) => {
    const sockets = (await io.except(chatKey).fetchSockets()).filter(socket => socket.data.username == from || socket.data.username == to);

    for (const cell of sockets) {
        await cell.join(chatKey)
    }

}
const getChat = async (redis: Redis, user1: string, user2: string) => {
    const chats = [`chats:${user1}:${user2}`, `chats:${user2}:${user1}`]
    for (const key of chats) {
        const isExists = await redis.exists(key);
        if (isExists) return key
    }
    return chats[0]
};

export default (fp(async function (app, _opts) {
    const io = new Server(app.server, {
        cors: {
            origin: ["https://admin.socket.io", 'http://localhost:5173'],
            credentials: true
        },
    })

    app.addHook('onClose', (fastify, done) => {
        fastify.io.close()
    })

    io.engine.use(helmet());


    io.on("new_namespace", (namespace) => {
        console.log('namespace created', namespace.name)
    });



    io.use(async (socket, next) => {
        const username = socket.handshake.auth.token;
        if (!username) next(new Error('Token not found'));
        const responses = await app.redis.pipeline().sismember('users', username).sadd('users', username).exec();
        if (!responses || responses.some(cell => cell[0])) return new Error('Something went wrong');
        const userExists = (responses[0][1]);
        if (!userExists) {
            io.emit('newUser', username)
        }
        socket.data.username = username;
        next();
    })


    io.on('connection', async (socket) => {

        socket.on('login', async (username: string, ack: any) => {
            try {
                const chats = await app.redis.keys(`chats:*${username}*`);
                const pipeline = app.redis.pipeline();
                for (const chat of (chats)) {
                    await socket.join(chat)
                    pipeline.lrange(chat, 0, -1)
                }

                const chatResuts = await pipeline.exec();
                if (!chatResuts || chatResuts.some(cell => cell[0])) return ack(false);
                const userChats = chatResuts.map(item => item[1]).map(chat => (chat as string[]).map(cell => JSON.parse((cell as string))));

                const users = (await app.redis.smembers('users')).filter(cell => cell != username && chats.every(chatName => !chatName.includes(cell)))

                ack({ users, chats: userChats })
            } catch (error) {
                console.log(error);
                ack(false)
            }
        })

        socket.on('sendMessage', async (username: string, message: string, ack: Function) => {
            const currentUser = socket.data.username;
            const currentChat = await getChat(app.redis, currentUser, username);

            const chat = {
                from: currentUser,
                to: username,
                message
            }
            await addUserToRoom(io, currentChat, chat.from, chat.to)


            try {
                await Promise.all([app.redis.rpush(currentChat, JSON.stringify(chat)), io.of('/').in(currentChat).except(socket.id).emit('newMessage', chat)])
                ack(chat)

            } catch (err) {
                ack(false)
            }
        })




        socket.on('toggleTyping', async (username: string, target: boolean, ack) => {
            try {
                const currentUser = socket.data.username;
                const currentChat = await getChat(app.redis, currentUser, username);

                await addUserToRoom(io, currentChat, currentUser, username)
                if (!socket.rooms.has(currentChat)) ack(false);

                const sockets = (await socket.in(currentChat).fetchSockets()).filter(cell => cell.data.username != currentUser);
                await Promise.all(sockets.map(cell => socket.in(cell.id).emit('toggleTyping', currentUser, target)))
                ack(target)


            } catch (err) {
                console.log(err)
                ack(false)
            }
        })



        socket.on('disconnect', async (reason) => {
            console.log('client disconnected ,reason:', reason)
        });

    })





    instrument(io, {
        auth: {
            type: 'basic',
            username: process.env.SOCKET_USERNAME as string,
            password: process.env.SOCKET_PASSWORD as string

        },
    });

    app.decorate('io', io)

} as FastifyPluginCallback))