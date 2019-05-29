import { Map } from 'immutable'
import { IPersistSchema } from 'luren-schema'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'
import { normalizeSimpleSchema } from '../lib/utils'

export interface IFieldOptions {
  type?: any
  schema?: IPersistSchema
  required?: boolean
  default?: any
  validate?: (schema: IPersistSchema, data: any) => [boolean, string]
  serialize?: (schema: IPersistSchema, data: any) => any
  deserialize?: (schema: IPersistSchema, data: any) => any
}

export class FieldMetadata {
  public schema: IPersistSchema
  public required: boolean
  public id: boolean = false
  public generated: boolean = false // Id option
  public validate?: (schema: IPersistSchema, data: any) => [boolean, string]
  public serialize?: (schema: IPersistSchema, data: any) => any
  public deserialize?: (schema: IPersistSchema, data: any) => any
  constructor(schema: IPersistSchema, required: boolean = true) {
    this.schema = schema
    this.required = required
  }
}

export function Field(options?: IFieldOptions) {
  return (target: object, propertyKey: string) => {
    options = options || {}
    let fieldSchema: IPersistSchema
    let fieldRequired = options.required
    if (options.schema) {
      fieldSchema = options.schema
    } else if (options.type) {
      const [schema, required] = normalizeSimpleSchema(options.type)
      fieldSchema = schema
      if (typeof fieldRequired !== 'boolean') {
        fieldRequired = required
      }
    } else {
      fieldSchema = { type: 'string' }
    }
    if (options.default !== undefined) {
      fieldSchema.default = options.default
    }
    const fieldMetadata = new FieldMetadata(fieldSchema)
    fieldMetadata.required = fieldRequired || true
    fieldMetadata.validate = options.validate
    fieldMetadata.serialize = options.serialize
    fieldMetadata.deserialize = options.deserialize
    let fieldsMetadata: Map<string, FieldMetadata> = Reflect.getMetadata(MetadataKey.FIELDS, target) || Map()
    fieldsMetadata = fieldsMetadata.set(propertyKey, fieldMetadata)
    Reflect.defineMetadata(MetadataKey.FIELDS, fieldsMetadata, target)
  }
}

export function Id(options?: IFieldOptions) {
  return Field(options)
}
