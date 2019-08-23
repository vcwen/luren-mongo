import { IJsonSchema, IJsSchema } from 'luren-schema'
import { FindOneAndDeleteOption, FindOneAndReplaceOption, FindOneAndUpdateOption, FindOneOptions } from 'mongodb'

export type Constructor<T = any> = new (...args: any[]) => T

export interface IBsonSchema extends IJsonSchema {
  bsonType?: string
}
export interface IDeserializeOptions {
  type?: any
  schema?: IJsSchema
  deserialize?: boolean
}
export interface IFindOptions<T = any> extends FindOneOptions, IDeserializeOptions {
  lookup?: keyof T | Array<keyof T>
}

export interface IFindOneAndDeleteOptions extends FindOneAndDeleteOption, IDeserializeOptions {}
export interface IFindOneAndReplaceOptions extends FindOneAndReplaceOption, IDeserializeOptions {}
export interface IFindOneAndUpdateOptions extends FindOneAndUpdateOption, IDeserializeOptions {}
