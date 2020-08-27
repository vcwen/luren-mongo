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
import { EventEmitter } from 'events'

const DEFAULT_HOST = 'localhost'
const DEFAULT_PORT = 27017

export interface IDataSource {
  getQueryExecutor<T extends object>(model: Constructor<T>): Promise<IQueryExecutor>
  register<T extends object>(model: Constructor<T>): Promise<boolean>
}

export interface IMongoDataSourceOptions extends MongoClientOptions {
  database?: string
  uri?: string
  host?: string
  port?: number
  user?: string
  password?: string
  autoConnect?: boolean
}

export class DataSource implements IDataSource {
  private _models: Set<Constructor> = Set()
  private _connectUri?: string
  private _connectOptions?: IMongoDataSourceOptions
  private _clientPromise: Promise<MongoClient>
  private _queryExecutors: Map<string, QueryExecutor<any>> = Map()
  private _database?: string
  private _clientEventEmitter: EventEmitter = new EventEmitter()
  constructor(options?: IMongoDataSourceOptions) {
    this._clientPromise = new Promise((resolve, reject) => {
      this._clientEventEmitter.on('created', (client: MongoClient) => {
        resolve(client)
      })
      this._clientEventEmitter.on('error', (err) => reject(err))
    })
    if (options) {
      if (options.autoConnect) {
        this.connect(options)
      } else {
        this._connectOptions = options
      }
    }
  }
  public async connect(options?: IMongoDataSourceOptions) {
    options = Object.assign({}, options ?? this._connectOptions)
    this._connectUri = this._getConnectUri(options)
    const database = options.database ?? getDatabase(this._connectUri)
    this._database = database
    if (options.user && options.password) {
      options.auth = { user: options.user, password: options.password }
    }
    deleteProperties(options, ['uri', 'host', 'port', 'database', 'user', 'password', 'autoConnect'])
    MongoClient.connect(this._connectUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      ...options
    } as MongoClientOptions)
      .then((client) => {
        debug(`connected to ${this._connectUri}`)
        this._clientEventEmitter.emit('created', client)
      })
      .catch((err) => {
        this._clientEventEmitter.emit('error', err)
      })
  }
  public async getClient() {
    return this._clientPromise
  }
  public async getClientMust() {
    if (this._clientPromise) {
      return this._clientPromise
    } else {
      throw new Error('No client available, needs to connect to the database first')
    }
  }
  public async getQueryExecutor<T extends object>(model: Constructor<T>): Promise<QueryExecutor<T>> {
    const metadata: CollectionMetadata | undefined = Reflect.getOwnMetadata(MetadataKey.COLLECTION, model.prototype)
    if (!metadata) {
      throw new Error(`class ${model.name} has not been bound to a collection`)
    }
    if (!this._queryExecutors.has(metadata.name)) {
      const client = await this.getClientMust()
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
    const client = await this.getClientMust()
    const db = client.db(dbName)
    const validationOptions = collectionMetadata.validationOptions
    let validation: { validator: object; validationLevel: string; validationAction: string } | undefined
    let validationSyncStrategy = ValidationSyncStrategy.IF_NOT_EXISTS
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
    if (client && client.isConnected()) {
      return client.close()
    }
  }
  private _getConnectUri(options: IMongoDataSourceOptions) {
    if (options.uri) {
      return options.uri
    } else {
      return `mongodb://${options.host ?? DEFAULT_HOST}:${options.port ?? DEFAULT_PORT}`
    }
  }
}
