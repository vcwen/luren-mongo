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
export interface IFindOptions<T = any> extends FindOneOptions<T>, IDeserializeOptions {
  lookup?: keyof T | (keyof T)[]
}

export interface IFindOneAndDeleteOptions<T = any> extends FindOneAndDeleteOption<T>, IDeserializeOptions {}
export interface IFindOneAndReplaceOptions<T = any> extends FindOneAndReplaceOption<T>, IDeserializeOptions {}
export interface IFindOneAndUpdateOptions<T = any> extends FindOneAndUpdateOption<T>, IDeserializeOptions {}
