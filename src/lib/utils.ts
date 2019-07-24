import Debug from 'debug'
import _ from 'lodash'
import { convertSimpleSchemaToJsSchema, IPersistSchema } from 'luren-schema'
import { MetadataKey } from '../constants'
import { MongoSchemaMetadata } from '../decorators/MongoSchema'
import { Constructor } from '../types'

const debugLog = Debug('luren-mongo')

const regex = /\/(\w+)(\?.*)?$/
export const getDatabase = (connectUri: string) => {
  const match = regex.exec(connectUri)
  if (match) {
    return match[1]
  }
}

export const defineMongoSchema = (constructor: Constructor<any>, schema: IPersistSchema) => {
  const metadata = new MongoSchemaMetadata(constructor.name, schema)
  Reflect.defineMetadata(MetadataKey.MONGO_SCHEMA, metadata, constructor.prototype)
}
export const normalizeSimpleSchema = (schema: any): [IPersistSchema, boolean] => {
  return convertSimpleSchemaToJsSchema(schema, (constructor) => {
    const schemaMetadata: MongoSchemaMetadata | undefined = Reflect.getOwnMetadata(
      MetadataKey.MONGO_SCHEMA,
      constructor.prototype
    )
    if (schemaMetadata) {
      return schemaMetadata.schema
    }
  })
}

export const debug = (msg: string, ...params: any[]) => {
  debugLog(msg, ...params)
}
