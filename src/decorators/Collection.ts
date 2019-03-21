import _ from 'lodash'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'
import { Constructor } from '../types/Constructor'

export interface ICollectionOptions {
  name?: string
  strict?: boolean
  database?: string
  datasource?: string
}

export class CollectionMetadata {
  public name!: string
  public strict: boolean = true
  public database?: string
  public datasource?: string
}

export function Collection(options?: ICollectionOptions) {
  return (constructor: Constructor) => {
    const metadata = new CollectionMetadata()
    metadata.name = _.get(options, 'name') || constructor.name
    metadata.strict = _.get(options, 'strict') || true
    Reflect.defineMetadata(MetadataKey.COLLECTION, metadata, constructor)
  }
}
