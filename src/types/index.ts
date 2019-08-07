import { IJsonSchema, IJsSchema } from 'luren-schema'
import { FindOneOptions } from 'mongodb'

export type Constructor<T = any> = new (...args: any[]) => T

export interface IBsonSchema extends IJsonSchema {
  bsonType: string
}
interface IDeserializeOptions {
  type?: any
  schema?: IJsSchema
  deserialize?: boolean
}
export interface IFindOptions<T = any> extends FindOneOptions, IDeserializeOptions {
  lookup?: keyof T | Array<keyof T>
}
