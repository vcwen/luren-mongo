import { Map } from 'immutable'
import _ from 'lodash'
import { IPersistSchema } from 'luren-schema'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'
import { FieldMetadata } from './Field'

export interface IMongoSchemaOptions {
  name?: string
  validate?: (schema: IPersistSchema, data: any) => [boolean, string]
  serialize?: (schema: IPersistSchema, data: any) => any
  deserialize?: (schema: IPersistSchema, data: any) => any
  desc?: string
}

export class MongoSchemaMetadata {
  public name: string
  public schema: IPersistSchema
  public desc?: string
  constructor(name: string, schema: IPersistSchema, desc?: string) {
    this.name = name
    this.schema = schema
    this.desc = desc
  }
}

export function MongoSchema(options?: IMongoSchemaOptions) {
  // tslint:disable-next-line: ban-types
  return (constructor: Function) => {
    const name = _.get(options, 'name', constructor.name)
    const fieldsMetadata: Map<string, FieldMetadata> =
      Reflect.getMetadata(MetadataKey.FIELDS, constructor.prototype) || Map()
    const schema: IPersistSchema = { type: 'object', classConstructor: constructor as any }
    const properties: { [prop: string]: IPersistSchema } = {}
    const required: string[] = []
    for (const [prop, fieldMetadata] of fieldsMetadata) {
      if (fieldMetadata.required) {
        required.push(prop)
      }
      properties[prop] = fieldMetadata.schema
    }
    schema.properties = properties
    schema.required = required
    const metadata = new MongoSchemaMetadata(name, schema, options ? options.desc : undefined)
    Reflect.defineMetadata(MetadataKey.MONGO_SCHEMA, metadata, constructor.prototype)
  }
}
