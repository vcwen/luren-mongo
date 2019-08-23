import Debug from 'debug'
import _ from 'lodash'
import { IJsSchema, utils } from 'luren-schema'
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

export const defineMongoSchema = (constructor: Constructor<any>, schema: IJsSchema) => {
  const metadata = new MongoSchemaMetadata(constructor.name, schema)
  Reflect.defineMetadata(MetadataKey.MONGO_SCHEMA, metadata, constructor.prototype)
}

export const debug = (msg: string, ...params: any[]) => {
  debugLog(msg, ...params)
}

const mongoPreprocessor = (simpleSchema: any) => {
  if (typeof simpleSchema === 'function') {
    const schemaMetadata: MongoSchemaMetadata | undefined = Reflect.getMetadata(
      MetadataKey.MONGO_SCHEMA,
      simpleSchema.prototype
    )
    if (schemaMetadata) {
      return schemaMetadata.schema
    }
  }
}
export const mongoConvertSimpleTypeToJsSchema = (simpleSchema: any) => {
  return utils.convertSimpleSchemaToJsSchema(simpleSchema, mongoPreprocessor)
}
