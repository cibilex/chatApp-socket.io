import {  Redis } from "ioredis";
import { FastifyPluginCallback } from 'fastify';
import fs from "fastify-plugin"
import { pipeline } from "stream";

export default (fs(async function (fastify, _options, _done) {
    const redis = new Redis({
        password: "cibilex",
        port: 6379
      });
    fastify.decorate('redis', redis)

} as FastifyPluginCallback))



