import { IJsSchema } from 'luren-schema'

export type Constructor<T> = new (...args: any[]) => T
export interface IExtraOptions {
  type?: any
  schema?: IJsSchema
}
