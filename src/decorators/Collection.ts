import { Map } from 'immutable'
import _ from 'lodash'
import { MetadataKey as LurenMetadataKey, PropMetadata } from 'luren'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'
import { Constructor } from '../types/Constructor'
import { FieldMetadata } from './Field'

export interface ICollectionOptions {
  name?: string
  strict?: boolean
  database?: string
  datasource?: string
}

export class CollectionMetadata {
  public name!: string
  public strict: boolean = true
  public database?: string
  public datasource?: string
  public schema: any
}

export function Collection(options?: ICollectionOptions) {
  return (constructor: Constructor<any>) => {
    const metadata = new CollectionMetadata()
    metadata.name = _.get(options, 'name') || constructor.name
    metadata.strict = _.get(options, 'strict') || true
    const props: Map<string, PropMetadata> = Reflect.getMetadata(LurenMetadataKey.PROPS, constructor.prototype) || Map()
    const fields: Map<string, FieldMetadata> = Reflect.getMetadata(MetadataKey.FIELDS, constructor.prototype) || Map()
    const schema: any = { type: 'object', properties: {}, required: [] }
    for (const [prop, fieldMetadata] of fields) {
      if (props.has(prop)) {
        const propMetadata = props.get(prop) as PropMetadata
        schema.properties[prop] = fieldMetadata.schema || propMetadata.schema
        if (typeof fieldMetadata.required === 'boolean') {
          if (fieldMetadata.required) {
            schema.required.push(prop)
          }
        } else {
          if (propMetadata.required) {
            schema.required.push(prop)
          }
        }
        if (fieldMetadata.default !== undefined) {
          schema.properties[prop].default = fieldMetadata.default
        }
      } else {
        schema.properties[prop] = fieldMetadata.schema || { type: 'string' }
        if (fieldMetadata.required) {
          schema.required.push(prop)
        }
        if (fieldMetadata.default !== undefined) {
          schema.properties[prop].default = fieldMetadata.default
        }
      }
    }
    metadata.schema = schema
    Reflect.defineMetadata(MetadataKey.COLLECTION, metadata, constructor.prototype)
  }
}
