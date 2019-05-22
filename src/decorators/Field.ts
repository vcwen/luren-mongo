import { Map } from 'immutable'
import { IPersistSchema } from 'luren-schema'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'

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
  public schema!: IPersistSchema
  public required!: boolean
  public validate?: (schema: IPersistSchema, data: any) => [boolean, string]
  public serialize?: (schema: IPersistSchema, data: any) => any
  public deserialize?: (schema: IPersistSchema, data: any) => any
}

export function Field(options?: IFieldOptions) {
  return (target: object, propertyKey: string) => {
    const ops: IFieldOptions = options || {}
    let fieldsOptionsMap: Map<string, IFieldOptions> = Reflect.getMetadata(MetadataKey.FIELDS_OPTIONS, target) || Map()
    fieldsOptionsMap = fieldsOptionsMap.set(propertyKey, ops)
    Reflect.defineMetadata(MetadataKey.FIELDS_OPTIONS, fieldsOptionsMap, target)
  }
}
