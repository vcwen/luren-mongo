import { List, Map } from 'immutable'
import { IPersistSchema } from 'luren-schema'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'
import { normalizeSimpleSchema } from '../lib/utils'

export interface IFieldOptions {
  type?: any
  schema?: IPersistSchema
  required?: boolean
  default?: any
}

export class FieldMetadata {
  public schema: IPersistSchema
  public required: boolean
  public id: boolean = false
  public generated: boolean = false // Id option
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
    fieldMetadata.required = fieldRequired !== undefined ? fieldRequired : true
    let fieldsMetadata: Map<string, FieldMetadata> = Reflect.getMetadata(MetadataKey.FIELDS, target) || Map()
    fieldsMetadata = fieldsMetadata.set(propertyKey, fieldMetadata)
    Reflect.defineMetadata(MetadataKey.FIELDS, fieldsMetadata, target)
  }
}

export function Id(options?: IFieldOptions) {
  return Field(options)
}

export function NotField() {
  return (target: object, propertyKey: string) => {
    let ignoredProps: List<string> = Reflect.getMetadata(MetadataKey.IGNORED_PROPS, target) || List()
    ignoredProps = ignoredProps.push(propertyKey)
    Reflect.defineMetadata(MetadataKey.IGNORED_PROPS, ignoredProps, target)
  }
}
