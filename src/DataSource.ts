import { List, Map, Set } from 'immutable'
import { MongoClient, MongoClientOptions } from 'mongodb'
import { MetadataKey } from './constants'
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
// tslint:disable-next-line: max-classes-per-file
export class DataSource implements IDatasource {
  private _models: Set<Constructor> = Set()
  private _connectUrl: string
  private _clientPromise: Promise<MongoClient>
  private _queryExecutors: Map<string, QueryExecutor<any>> = Map()
  private _database?: string
  constructor(options?: IMongoDataSourceOptions) {
    options = { ...options }
    this._connectUrl = this._getConnectUrl(options)
    const database = options.database ?? getDatabase(this._connectUrl)
    this._database = database
    if (options.user && options.password) {
      options.auth = { user: options.user, password: options.password }
    }
    deleteProperties(options, ['url', 'host', 'port', 'database', 'user', 'password'])
    this._clientPromise = MongoClient.connect(this._connectUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      ...options
    }).then((client) => {
      debug(`connected to ${this._connectUrl}`)
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
    // ensure collection is created
    const collection = await db.createCollection(collectionMetadata.name)
    for (const metadata of indexMetadataList) {
      debug('create index %o with options %o', metadata.fields, metadata.options)
      collection.createIndex(metadata.fields, metadata.options)
    }

    if (collectionMetadata.validationOptions) {
      const command = {
        collMod: collectionMetadata.name,
        validator: { $jsonSchema: collectionMetadata.schema },
        validationLevel: collectionMetadata.validationOptions.validationLevel,
        validationAction: collectionMetadata.validationOptions.validationAction ?? 'error' // default action: error
      }
      await db.command(command)
      debug('set validator %j', command)
    }
    return true
  }
  public async disconnect() {
    const client = await this.getClient()
    return client.close()
  }
  private _getConnectUrl(options: IMongoDataSourceOptions) {
    if (options.url) {
      return options.url
    } else {
      return `mongodb://${options.host ?? DEFAULT_HOST}:${options.port ?? DEFAULT_PORT}`
    }
  }
}
