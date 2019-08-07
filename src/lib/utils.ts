import Debug from 'debug'
import _ from 'lodash'
import { IJsSchema, IJsTypeOptions } from 'luren-schema'
import { MetadataKey } from '../constants'
import { MongoSchemaMetadata } from '../decorators/MongoSchema'
import { Constructor } from '../types'
import { MongoDataTypes } from './MongoDataTypes'

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

export const mongoValidate = (data: any, schema: IJsSchema, options?: IJsTypeOptions): [boolean, string?] => {
  const mongoType = MongoDataTypes.get(schema.type)
  return mongoType.validate(data, schema, options)
}

export const mongoSerialize = (data: any, schema: IJsSchema, options?: IJsTypeOptions) => {
  const mongoType = MongoDataTypes.get(schema.type)
  const [valid, msg] = mongoType.validate(data, schema, options)
  if (!valid) {
    throw new Error(msg)
  }
  return mongoType.serialize(data, schema)
}

export const mongoDeserialize = (json: any, schema: IJsSchema, options?: IJsTypeOptions) => {
  const mongoType = MongoDataTypes.get(schema.type)
  const data = mongoType.deserialize(json, schema, options)
  return data
}
