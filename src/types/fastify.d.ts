
import { FastifyInstance } from 'fastify';
import { Redis } from 'ioredis';
import { Knex } from 'knex';
import { Server } from 'socket.io';




declare module 'fastify' {
  interface FastifyInstance {
    db: Knex;
    redis:Redis;
    io:Server
  }
}
