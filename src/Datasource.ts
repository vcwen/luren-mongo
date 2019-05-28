import { List, Map } from 'immutable'
import { IDatasourceOptions, LurenDatasource } from 'luren'
import { MongoClient } from 'mongodb'
import { MetadataKey } from './constants/MetadataKey'
import { CollectionMetadata } from './decorators/Collection'
import { IndexMetadata } from './decorators/Index'
import { getDatabase } from './lib/utils'
import { QueryExecutor } from './QueryExecutor'
import { Constructor } from './types'

export interface IMongoDatasourceOptions extends IDatasourceOptions {
  database?: string
  autoIndex?: boolean
}
export class Datasource extends LurenDatasource {
  private _clientPromise: Promise<MongoClient>
  private _queryExecutors: Map<string, QueryExecutor<any>> = Map()
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
  public async getQueryExecutor<T extends object>(model: Constructor<T>): Promise<QueryExecutor<T>> {
    const metadata: CollectionMetadata | undefined = Reflect.getMetadata(MetadataKey.COLLECTION, model.prototype)
    if (!metadata) {
      throw new Error(`Model:${model.name} is not a collection`)
    }
    if (!this._queryExecutors.has(metadata.name)) {
      const client = await this.getClient()
      const db = metadata.database || this._database
      if (!db) {
        throw new Error('database name is required')
      }
      const collection = client.db(db).collection(metadata.name)
      this._queryExecutors = this._queryExecutors.set(metadata.name, new QueryExecutor(model, collection))
    }
    return this._queryExecutors.get(metadata.name) as QueryExecutor<T>
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
    const metadataList: List<IndexMetadata> | undefined = Reflect.getMetadata(MetadataKey.INDEX, model.prototype)
    const collectionMetadata: CollectionMetadata | undefined = Reflect.getMetadata(
      MetadataKey.COLLECTION,
      model.prototype
    )
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
