import _ from 'lodash'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'
import { MongoSchema } from './MongoSchema'

export interface ICollectionOptions {
  name?: string
  database?: string
  datasource?: string
  useJsSchema?: boolean
  additionalProps?: boolean
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
    options = options || {}
    metadata.database = options.database
    metadata.datasource = options.datasource
    const schema = Reflect.getMetadata(MetadataKey.MONGO_SCHEMA, constructor.prototype)
    if (!schema) {
      // if schema it not defined yet, then defined it
      MongoSchema({
        name: metadata.name,
        useJsSchema: options.useJsSchema,
        additionalProps: options.additionalProps
      })(constructor)
    }
    Reflect.defineMetadata(MetadataKey.COLLECTION, metadata, constructor.prototype)
  }
}
