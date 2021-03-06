import _ from 'lodash'
import { Constructor } from 'luren-schema/dist/types'
import 'reflect-metadata'
import { MetadataKey, ValidationSyncStrategy } from '../constants'
import { DataSource } from '../DataSource'
import MongoTypes from '../lib/MongoTypes'
import { IBsonSchema } from '../types'
import { MongoSchema, MongoSchemaMetadata } from './MongoSchema'

export interface IValidatorOptions {
  validationLevel: 'off' | 'strict' | 'moderate'
  validationAction?: 'error' | 'warn'
  syncStrategy?: ValidationSyncStrategy
}

export interface ICollectionOptions {
  name?: string
  database?: string
  dataSource?: DataSource
  useJsSchema?: boolean
  additionalProps?: boolean
  validationOptions?: IValidatorOptions
}

export class CollectionMetadata {
  public name!: string
  public database?: string
  public dataSource?: DataSource
  public validationOptions?: IValidatorOptions
  public schema?: IBsonSchema
}

export function Collection(options?: ICollectionOptions) {
  return (constructor: Constructor) => {
    const metadata = new CollectionMetadata()
    metadata.name = _.get(options, 'name', constructor.name)
    options = options || {}
    metadata.database = options.database
    metadata.dataSource = options.dataSource
    metadata.validationOptions = options.validationOptions

    let schemaMetadata: MongoSchemaMetadata | undefined = Reflect.getOwnMetadata(
      MetadataKey.MONGO_SCHEMA,
      constructor.prototype
    )
    if (!schemaMetadata) {
      // if schema it not defined yet, then defined it
      MongoSchema({
        name: metadata.name,
        useJsSchema: options.useJsSchema,
        additionalProps: options.additionalProps
      })(constructor)
    }
    schemaMetadata = Reflect.getOwnMetadata(MetadataKey.MONGO_SCHEMA, constructor.prototype) as MongoSchemaMetadata
    metadata.schema = MongoTypes.toBsonSchema(schemaMetadata.schema)
    Reflect.defineMetadata(MetadataKey.COLLECTION, metadata, constructor.prototype)
    if (metadata.dataSource) {
      metadata.dataSource.register(constructor)
    }
  }
}
