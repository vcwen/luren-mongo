import { QueryExecutor } from 'luren'
import { Constructor } from 'luren/dist/src/types/Constructor'
import { Collection } from 'mongodb'
import { CollectionMetadata } from './decorators/Collection'
import { transform } from './lib/utils'

export class MongoQueryExecutor<T> extends QueryExecutor<T> {
  private _collectionMetadata!: CollectionMetadata
  private _collection!: Collection<any>
  constructor(model: Constructor<T>) {
    super(model)
  }
  public async insertOne(obj: T) {
    return this._collection.insertOne(transform(obj, this._schema))
  }
  public async findOne(filter: any) {
    const res = await this._collection.findOne(filter)
    if (res) {
      return transform<T>(res, {})
    } else {
      return undefined
    }
  }
  public async findMany(filter: any) {
    const res = await this._collection.find(filter).toArray()
    return res.map((item) => transform<T>(item, this._schema))
  }
}
