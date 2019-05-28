import _ from 'lodash'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'
import { MongoSchema } from './MongoSchema'

export interface ICollectionOptions {
  name?: string
  database?: string
  datasource?: string
  defineSchema?: true
}

export class CollectionMetadata {
  public name!: string
  public database?: string
  public datasource?: string
}

export function Collection(options?: ICollectionOptions) {
  // tslint:disable-next-line: ban-types
  return (constructor: Function) => {
    const metadata = new CollectionMetadata()
    metadata.name = _.get(options, 'name', constructor.name)
    if (options) {
      metadata.database = options.database
      metadata.datasource = options.datasource
      if (options.defineSchema) {
        MongoSchema({ name: metadata.name })(constructor)
      }
    }
    Reflect.defineMetadata(MetadataKey.COLLECTION, metadata, constructor.prototype)
  }
}
