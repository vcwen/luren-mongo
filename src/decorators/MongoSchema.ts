import { List, Map } from 'immutable'
import _ from 'lodash'
import { IPersistSchema, MetadataKey as SchemaMetadataKey, PropMetadata } from 'luren-schema'
import 'reflect-metadata'
import { MetadataKey } from '../constants'
import { FieldMetadata } from './Field'

export interface IMongoSchemaOptions {
  name?: string
  validate?: (schema: IPersistSchema, data: any) => [boolean, string]
  serialize?: (schema: IPersistSchema, data: any) => any
  deserialize?: (schema: IPersistSchema, data: any) => any
  useJsSchema?: boolean
  additionalProps?: boolean
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
    options = options || {}
    const name = _.get(options, 'name', constructor.name)
    const schema: IPersistSchema = { type: 'object', classConstructor: constructor as any }
    const properties: { [prop: string]: IPersistSchema } = {}
    let required: string[] = []
    if (options.additionalProps) {
      schema.additionalProperties = true
    }
    if (options.useJsSchema) {
      const propsMetadata: Map<string, PropMetadata> =
        Reflect.getMetadata(SchemaMetadataKey.PROPS, constructor.prototype) || Map()
      const ignoredProps: List<string> = Reflect.getMetadata(SchemaMetadataKey.PROPS, constructor.prototype) || List()
      for (const [prop, propMetadata] of propsMetadata) {
        if (propMetadata.virtual || ignoredProps.contains(prop)) {
          continue
        }
        if (propMetadata.required) {
          required.push(prop)
        }
        properties[prop] = propMetadata.schema
      }
    }
    const fieldsMetadata: Map<string, FieldMetadata> =
      Reflect.getMetadata(MetadataKey.FIELDS, constructor.prototype) || Map()
    for (const [prop, fieldMetadata] of fieldsMetadata) {
      if (fieldMetadata.required) {
        if (required.indexOf(prop) === -1) {
          required.push(prop)
        }
      } else {
        if (required.indexOf(prop) !== -1) {
          required = required.filter((item) => item !== prop)
        }
      }
      properties[prop] = fieldMetadata.schema
    }

    schema.properties = properties
    schema.required = required
    const desc = options ? options.desc : undefined
    const metadata = new MongoSchemaMetadata(name, schema, desc)
    Reflect.defineMetadata(MetadataKey.MONGO_SCHEMA, metadata, constructor.prototype)
  }
}
