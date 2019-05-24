import { Map } from 'immutable'
import _ from 'lodash'
import { IPersistSchema, MetadataKey as SchemaMetadataKey, normalizeSimpleSchema, PropMetadata } from 'luren-schema'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'
import { Constructor } from '../types'
import { FieldMetadata, IFieldOptions } from './Field'

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
  public schema!: IPersistSchema
}

export function Collection(options?: ICollectionOptions) {
  return (constructor: Constructor<any>) => {
    const metadata = new CollectionMetadata()
    metadata.name = _.get(options, 'name', constructor.name)
    metadata.strict = _.get(options, 'strict', true)
    const props: Map<string, PropMetadata> =
      Reflect.getMetadata(SchemaMetadataKey.PROPS, constructor.prototype) || Map()
    const fieldsOptions: Map<string, IFieldOptions> =
      Reflect.getMetadata(MetadataKey.FIELDS_OPTIONS, constructor.prototype) || Map()
    const schema: IPersistSchema = { type: 'object', classConstructor: constructor }
    const properties: { [prop: string]: IPersistSchema } = {}
    const required: string[] = []
    for (const [prop, fieldOptions] of fieldsOptions) {
      const fieldMetadata = new FieldMetadata()
      let fieldSchema: IPersistSchema | undefined
      if (props.has(prop)) {
        const propMetadata = props.get(prop) as PropMetadata
        fieldSchema = _.cloneDeep(propMetadata.schema)
      }

      if (fieldOptions.schema) {
        fieldSchema = fieldOptions.schema
      } else if (fieldOptions.type) {
        fieldSchema = normalizeSimpleSchema(fieldOptions.type)
      }
      if (!fieldSchema) {
        fieldSchema = { type: 'string' }
      }
      if (fieldOptions.required) {
        required.push(prop)
      }
      if (fieldOptions.default !== undefined) {
        fieldSchema.default = fieldOptions.default
      }

      fieldMetadata.schema = fieldSchema
      fieldMetadata.required = fieldOptions.required || false
      let fieldsMetadata: Map<string, FieldMetadata> =
        Reflect.getMetadata(MetadataKey.FIELDS, constructor.prototype) || Map()
      fieldsMetadata = fieldsMetadata.set(prop, fieldMetadata)
      Reflect.defineMetadata(MetadataKey.FIELDS, fieldsMetadata, constructor.prototype)
      properties[prop] = fieldSchema
    }
    schema.properties = properties
    schema.required = required
    metadata.schema = schema
    Reflect.defineMetadata(MetadataKey.COLLECTION, metadata, constructor.prototype)
  }
}
