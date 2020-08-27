import Debug from 'debug'
import _ from 'lodash'
import { IJsSchema, utils } from 'luren-schema'
import { MetadataKey } from '../constants'
import { MongoSchemaMetadata } from '../decorators/MongoSchema'
import { Constructor } from '../types'

const debugLog = Debug('luren-mongo')

const regex = /^mongodb:\/\/(.+)\/(.+?)(\?.*)?$/
export const getDatabase = (connectUri: string) => {
  const match = regex.exec(connectUri)
  if (match) {
    return match[2]
  }
}

export const defineMongoSchema = (constructor: Constructor<any>, schema: IJsSchema) => {
  const metadata = new MongoSchemaMetadata(constructor.name, schema)
  Reflect.defineMetadata(MetadataKey.MONGO_SCHEMA, metadata, constructor.prototype)
}

export const debug = (msg: string, ...params: any[]) => {
  debugLog(msg, ...params)
}

const mongoPreprocessor = (simpleSchema: any): [any, boolean?] => {
  if (typeof simpleSchema === 'function') {
    const schemaMetadata: MongoSchemaMetadata | undefined = Reflect.getMetadata(
      MetadataKey.MONGO_SCHEMA,
      simpleSchema.prototype
    )
    if (schemaMetadata) {
      return [schemaMetadata.schema, true]
    }
  }
  return [simpleSchema]
}
export const mongoConvertSimpleTypeToJsSchema = (simpleSchema: any) => {
  return utils.convertSimpleSchemaToJsSchema(simpleSchema, mongoPreprocessor)
}

export const deleteProperties = (target: object, props: string[]) => {
  props.forEach((prop) => Reflect.deleteProperty(target, prop))
}
