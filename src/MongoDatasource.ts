import { List, Map } from 'immutable'
import { Datasource, IDatasourceOptions, QueryExecutor } from 'luren'
import { Constructor } from 'luren/dist/src/types/Constructor'
import { MongoClient } from 'mongodb'
import { MetadataKey } from './constants/MetadataKey'
import { CollectionMetadata } from './decorators/Collection'
import { IndexMetadata } from './decorators/Index'
import { getDatabase } from './lib/utils'
import { MongoQueryExecutor } from './MongoQueryExecutor'

export interface IMongoDatasourceOptions extends IDatasourceOptions {
  database?: string
  autoIndex?: boolean
}
export class MongoDatasource extends Datasource {
  public async
  private _clientPromise: Promise<MongoClient>
  private _queryExecutors: Map<string, MongoQueryExecutor<any>> = Map()
  private _autoIndex: boolean = true
  private _database?: string
  constructor(options: IMongoDatasourceOptions) {
    super(options)
    this._clientPromise = MongoClient.connect(this._connectUrl, { useNewUrlParser: true })
    const db = getDatabase(this._connectUrl)
    this._database = db
    this._autoIndex = options.autoIndex || true
  }
  public async getClient() {
    return this._clientPromise
  }
  public async getQueryExecutor<T>(model: Constructor<T>): Promise<QueryExecutor<T>> {
    const metadata: CollectionMetadata | undefined = Reflect.getMetadata(MetadataKey.COLLECTION, model)
    if (!metadata) {
      throw new Error('Model is not valid')
    }
    if (!this._queryExecutors.has(metadata.name)) {
      this._queryExecutors = this._queryExecutors.set(metadata.name, new MongoQueryExecutor(model))
    }
    return this._queryExecutors.get(metadata.name) as MongoQueryExecutor<T>
  }
  public getConnectUrl(options: IMongoDatasourceOptions) {
    if (options.url) {
      return options.url
    } else {
      if (options.host && options.port && options.database) {
        throw new Error('host,port and database are required')
      }
      return `mongodb://${options.host}:${options.port}/${options.database}`
    }
  }
  public async loadSchema<T>(model: Constructor<T>): Promise<boolean> {
    const metadataList: List<IndexMetadata> | undefined = Reflect.getMetadata(MetadataKey.INDEX, model)
    const collectionMetadata: CollectionMetadata | undefined = Reflect.getMetadata(MetadataKey.COLLECTION, model)
    if (collectionMetadata && metadataList && this._autoIndex) {
      const db = collectionMetadata.database || this._database
      if (!db) {
        throw new Error(`No valid database for ${model.name}`)
      }
      const client = await this.getClient()
      const collection = client.db(db).collection(collectionMetadata.name)
      for (const metadata of metadataList) {
        collection.createIndex(metadata.fields, metadata.options)
      }
    }
    return true
  }
}
