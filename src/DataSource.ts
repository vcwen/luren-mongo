import { List, Map, Set } from 'immutable'
import _ from 'lodash'
import { Collection, CollectionCreateOptions, MongoClient, MongoClientOptions } from 'mongodb'
import { MetadataKey, ValidationSyncStrategy } from './constants'
import { CollectionMetadata } from './decorators/Collection'
import { IndexMetadata } from './decorators/Index'
import { debug, deleteProperties } from './lib/utils'
import { getDatabase } from './lib/utils'
import { IQueryExecutor, QueryExecutor } from './QueryExecutor'
import { Constructor } from './types'

const DEFAULT_HOST = 'localhost'
const DEFAULT_PORT = 27017

export interface IDatasource {
  getQueryExecutor<T extends object>(model: Constructor<T>): Promise<IQueryExecutor>
  register<T extends object>(model: Constructor<T>): Promise<boolean>
}

export interface IMongoDataSourceOptions extends MongoClientOptions {
  database?: string
  url?: string
  host?: string
  port?: number
  user?: string
  password?: string
}

export class DataSource implements IDatasource {
  private _models: Set<Constructor> = Set()
  private _connectUri: string
  private _clientPromise: Promise<MongoClient>
  private _queryExecutors: Map<string, QueryExecutor<any>> = Map()
  private _database?: string
  constructor(options?: IMongoDataSourceOptions) {
    options = { ...options }
    this._connectUri = this._getConnectUri(options)
    const database = options.database ?? getDatabase(this._connectUri)
    this._database = database
    if (options.user && options.password) {
      options.auth = { user: options.user, password: options.password }
    }
    deleteProperties(options, ['url', 'host', 'port', 'database', 'user', 'password'])
    this._clientPromise = MongoClient.connect(this._connectUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      ...options
    }).then((client) => {
      debug(`connected to ${this._connectUri}`)
      return client
    })
  }
  public async getClient() {
    return this._clientPromise
  }
  public async getQueryExecutor<T extends object>(model: Constructor<T>): Promise<QueryExecutor<T>> {
    const metadata: CollectionMetadata | undefined = Reflect.getOwnMetadata(MetadataKey.COLLECTION, model.prototype)
    if (!metadata) {
      throw new Error(`class ${model.name} has not been bound to a collection`)
    }
    if (!this._queryExecutors.has(metadata.name)) {
      const client = await this.getClient()
      const db = metadata.database || this._database
      if (!db) {
        throw new Error('database name is required')
      }
      const collection = client.db(db).collection(metadata.name)
      this._queryExecutors = this._queryExecutors.set(metadata.name, new QueryExecutor(model, collection, this))
    }
    return this._queryExecutors.get(metadata.name) as QueryExecutor<T>
  }
  public async register<T>(model: Constructor<T>): Promise<boolean> {
    if (this._models.has(model)) {
      return true
    } else {
      this._models = this._models.add(model)
    }
    const indexMetadataList: List<IndexMetadata> = Reflect.getMetadata(MetadataKey.INDEX, model.prototype) ?? List()
    const collectionMetadata: CollectionMetadata | undefined = Reflect.getOwnMetadata(
      MetadataKey.COLLECTION,
      model.prototype
    )
    if (!collectionMetadata) {
      return false
    }
    const dbName = collectionMetadata.database || this._database
    if (!dbName) {
      throw new Error(`No valid database for ${model.name}`)
    }
    const client = await this.getClient()
    const db = client.db(dbName)
    const validationOptions = collectionMetadata.validationOptions
    let validation: { validator: object; validationLevel: string; validationAction: string } | undefined
    let validationSyncStrategy: string = 'if_not_exists'
    if (validationOptions) {
      validation = {
        validator: { $jsonSchema: collectionMetadata.schema },
        validationLevel: validationOptions.validationLevel,
        validationAction: validationOptions.validationAction ?? 'error' // default action: error
      }
      if (validationOptions.syncStrategy) {
        validationSyncStrategy = validationOptions.syncStrategy
      }
    }
    const existingCollectionsInfo = await db.listCollections({ name: collectionMetadata.name }).toArray()
    const collectionInfo = _.head(existingCollectionsInfo)
    let collection: Collection
    if (!collectionInfo) {
      const options: CollectionCreateOptions = {}
      if (validationSyncStrategy !== 'never') {
        Object.assign(options, validationOptions)
      }
      debug('create collection %s with options %o', collectionMetadata.name, options)
      collection = await db.createCollection(collectionMetadata.name, options)
    } else {
      collection = db.collection(collectionMetadata.name)
      if (validation && validationSyncStrategy !== ValidationSyncStrategy.NEVER) {
        if (validationSyncStrategy === ValidationSyncStrategy.OVERRIDE || !collectionInfo.options?.validator) {
          const command = {
            collMod: collectionMetadata.name,
            ...validation
          }
          debug('set validator %o', command)
          await db.command(command)
        }
      }
    }
    for (const metadata of indexMetadataList) {
      debug('create index %o with options %o', metadata.fields, metadata.options)
      collection.createIndex(metadata.fields, metadata.options)
    }
    return true
  }
  public async disconnect() {
    const client = await this.getClient()
    if (client.isConnected()) {
      return client.close()
    }
  }
  private _getConnectUri(options: IMongoDataSourceOptions) {
    if (options.url) {
      return options.url
    } else {
      return `mongodb://${options.host ?? DEFAULT_HOST}:${options.port ?? DEFAULT_PORT}`
    }
  }
}
