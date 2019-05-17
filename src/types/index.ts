import { IJsSchema } from 'luren-schema'
export type Constructor<T> = new (...args: any[]) => T

export interface ITypeOptions {
  validate?: (schema: IJsSchema, data: any) => [boolean, string]
  serialize?: (schema: IJsSchema, data: any) => any
  deserialize?: (schema: IJsSchema, data: any) => any
}

export interface IDataSchema extends IJsSchema {}
