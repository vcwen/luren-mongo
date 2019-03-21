import { Map } from 'immutable'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'

export interface IFieldOptions {
  type: any
  required: boolean
  default: any
}

export class FieldMetadata {
  public type: string = 'string'
  public required: boolean = false
  public default: any
}

export function Field(options?: IFieldOptions) {
  return (target: object, propertyKey: string) => {
    if (options) {
      let fields: Map<string, FieldMetadata> = Reflect.getMetadata(MetadataKey.FIELD, target.constructor) || Map()
      if (!options.type) {
        options.type = String
      }
      fields = fields.set(propertyKey, options)
      Reflect.defineMetadata(MetadataKey.FIELD, fields, target.constructor)
    } else {
      const fields: Map<string, FieldMetadata> = Reflect.getMetadata(MetadataKey.FIELD, target.constructor) || Map()
      Reflect.defineMetadata(MetadataKey.FIELD, fields, target.constructor)
    }
  }
}
