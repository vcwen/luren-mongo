import { Map } from 'immutable'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'
import { IDataSchema } from '../types'

export interface IFieldOptions {
  type?: any
  schema?: IDataSchema
  required?: boolean
  default?: any
  validate?: (schema: IDataSchema, data: any) => [boolean, string]
  serialize?: (schema: IDataSchema, data: any) => any
  deserialize?: (schema: IDataSchema, data: any) => any
}

export class FieldMetadata {
  public schema!: IDataSchema
  public required!: boolean
  public validate?: (schema: IDataSchema, data: any) => [boolean, string]
  public serialize?: (schema: IDataSchema, data: any) => any
  public deserialize?: (schema: IDataSchema, data: any) => any
}

export function Field(options?: IFieldOptions) {
  return (target: object, propertyKey: string) => {
    const ops: IFieldOptions = options || {}
    let fieldsOptionsMap: Map<string, IFieldOptions> = Reflect.getMetadata(MetadataKey.FIELDS_OPTIONS, target) || Map()
    fieldsOptionsMap = fieldsOptionsMap.set(propertyKey, ops)
    Reflect.defineMetadata(MetadataKey.FIELDS_OPTIONS, fieldsOptionsMap, target)
  }
}
