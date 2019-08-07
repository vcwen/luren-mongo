import { List, Map } from 'immutable'
import _ from 'lodash'
import { IJsSchema, MetadataKey as SchemaMetadataKey, PropMetadata } from 'luren-schema'
import 'reflect-metadata'
import { MetadataKey } from '../constants'
import { FieldMetadata } from './Field'

export interface IMongoSchemaOptions {
  title?: string
  useJsSchema?: boolean
  additionalProps?: boolean
  description?: string
  examples?: object
}

export class MongoSchemaMetadata {
  public title: string
  public schema: IJsSchema
  public description?: string
  public examples?: object
  constructor(title: string, schema: IJsSchema, desc?: string) {
    this.title = title
    this.schema = schema
    this.description = desc
  }
}

export function MongoSchema(options?: IMongoSchemaOptions) {
  // tslint:disable-next-line: ban-types
  return (constructor: Function) => {
    options = options || {}
    const title = _.get(options, 'title', constructor.name)
    const schema: IJsSchema = { type: 'object', classConstructor: constructor as any }
    const properties: { [prop: string]: IJsSchema } = {}
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
    const desc = options ? options.description : undefined
    const metadata = new MongoSchemaMetadata(title, schema, desc)
    Reflect.defineMetadata(MetadataKey.MONGO_SCHEMA, metadata, constructor.prototype)
  }
}
