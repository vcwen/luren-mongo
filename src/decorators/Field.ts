import { Map } from 'immutable'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'

export interface IFieldOptions {
  type?: any
  schema?: any
  required: boolean
  default: any
}

export class FieldMetadata {
  public schema?: string
  public required?: boolean
  public default?: any
}

export function Field(options?: IFieldOptions) {
  return (target: object, propertyKey: string) => {
    const metadata: FieldMetadata = options || {}
    let fieldMetadataMap: Map<string, FieldMetadata> = Reflect.getMetadata(MetadataKey.FIELDS, target) || Map()
    fieldMetadataMap = fieldMetadataMap.set(propertyKey, metadata)
    Reflect.defineMetadata(MetadataKey.FIELDS, fieldMetadataMap, target)
  }
}
