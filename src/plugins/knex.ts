import Knex from 'knex'
import { FastifyPluginCallback } from 'fastify'
import fs from "fastify-plugin"

export default (fs(async function (fastify, _options, _done) {
  const { MARIADB_URL } = process.env;
  const knexInstance = Knex.default({
    client: "mysql2",
    connection: MARIADB_URL,
    pool: { min: 0, max: 10 },
    useNullAsDefault: true
  })


  fastify.decorate('db', knexInstance)

} as FastifyPluginCallback))
