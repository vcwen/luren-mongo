import { List, Map } from 'immutable'
import _ from 'lodash'
import { IJsSchema, MetadataKey as SchemaMetadataKey, PropMetadata } from 'luren-schema'
import 'reflect-metadata'
import { MetadataKey } from '../constants'
import { Constructor } from '../types'
import { CollectionMetadata } from './Collection'
import { FieldMetadata } from './Field'

export interface IMongoSchemaOptions {
  name?: string
  useJsSchema?: boolean
  additionalProps?: boolean
  description?: string
}

export class MongoSchemaMetadata {
  public name: string
  public schema: IJsSchema
  constructor(name: string, schema: IJsSchema) {
    this.name = name
    this.schema = schema
  }
}

export function MongoSchema(options?: IMongoSchemaOptions) {
  return (constructor: Constructor) => {
    const collectionMetadata: CollectionMetadata | undefined = Reflect.getOwnMetadata(
      MetadataKey.COLLECTION,
      constructor.prototype
    )
    if (collectionMetadata) {
      throw new Error('Can not define decorators MongoSchema and Collection both in one model.')
    }
    options = options || {}
    const name = _.get(options, 'name', constructor.name)
    const schema: IJsSchema = { type: 'object', classConstructor: constructor as any }
    const properties: { [prop: string]: IJsSchema } = {}
    const required: string[] = []
    if (options.additionalProps) {
      schema.additionalProperties = true
    }
    if (options.useJsSchema) {
      const propsMetadata: Map<string, PropMetadata> =
        Reflect.getMetadata(SchemaMetadataKey.PROPS, constructor.prototype) || Map()
      const ignoredProps: List<string> = Reflect.getMetadata(MetadataKey.IGNORED_PROPS, constructor.prototype) || List()
      for (const [prop, propMetadata] of propsMetadata) {
        if (ignoredProps.contains(prop)) {
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
        required.push(prop)
      }
      properties[prop] = fieldMetadata.schema
    }

    if (!_.isEmpty(properties)) {
      schema.properties = properties
    }
    if (!_.isEmpty(required)) {
      schema.required = required
    }
    if (options.description) {
      schema.description = options.description
    }
    const metadata = new MongoSchemaMetadata(name, schema)
    Reflect.defineMetadata(MetadataKey.MONGO_SCHEMA, metadata, constructor.prototype)
  }
}
