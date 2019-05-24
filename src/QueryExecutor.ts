import { LurenQueryExecutor } from 'luren'
import { deserialize, serialize } from 'luren-schema'
import {
  ChangeStreamOptions,
  ClientSession,
  Collection,
  CollectionAggregationOptions,
  CollectionBulkWriteOptions,
  CollectionMapFunction,
  CollectionReduceFunction,
  CommonOptions,
  FilterQuery,
  FindOneAndDeleteOption,
  FindOneAndReplaceOption,
  FindOneAndUpdateOption,
  GeoHaystackSearchOptions,
  IndexOptions,
  IndexSpecification,
  MapReduceOptions,
  MongoCountPreferences,
  ParallelCollectionScanOptions,
  ReadPreference,
  ReplaceOneOptions,
  Timestamp,
  UpdateQuery
} from 'mongodb'
import MetadataKey from './constants/MetadataKey'
import { CollectionMetadata } from './decorators/Collection'
import { MongoDataTypes } from './lib/MongoDataTypes'
import { Constructor } from './types'

export class QueryExecutor<T extends object> extends LurenQueryExecutor<T> {
  private _collectionMetadata!: CollectionMetadata
  private _collection!: Collection<any>
  constructor(model: Constructor<T>, collection: Collection<any>) {
    super(model)
    this._collection = collection
  }
  public async insertOne(obj: T) {
    return this._collection.insertOne(serialize(this._schema, obj, MongoDataTypes))
  }
  public async insertMany(...objects: T[]) {
    return this._collection.insertMany(objects.map((item) => serialize(this._schema, item, MongoDataTypes)))
  }
  public async findOne(filter: any) {
    const res = await this._collection.findOne(filter)
    if (res) {
      return deserialize(this._schema, res, MongoDataTypes) as T
    } else {
      return undefined
    }
  }
  public async findMany(filter: FilterQuery<T>) {
    const res = await this._collection.find(filter).toArray()
    return res.map((item) => deserialize(this._schema, item, MongoDataTypes) as T)
  }
  public async updateOne(filter: FilterQuery<T>, update: UpdateQuery<T>) {
    return this._collection.updateOne(filter, update)
  }
  public async updateMany(filter: FilterQuery<T>, update: UpdateQuery<T>) {
    return this._collection.updateMany(filter, update)
  }

  public async deleteOne(filter: FilterQuery<T>) {
    return this._collection.deleteOne(filter)
  }
  public async deleteMany(filter: FilterQuery<T>) {
    return this._collection.deleteMany(filter)
  }
  public async findOneAndDelete(filter: FilterQuery<T>, options?: FindOneAndDeleteOption) {
    return this._collection.findOneAndDelete(filter, options)
  }
  public async findOneAndReplace(filter: FilterQuery<T>, replacement: object, options?: FindOneAndReplaceOption) {
    return this._collection.findOneAndReplace(filter, replacement, options)
  }
  public async findOneAndUpdate(filter: FilterQuery<T>, update: UpdateQuery<T>, options?: FindOneAndUpdateOption) {
    return this._collection.findOneAndUpdate(filter, update, options)
  }
  public async aggregate(pipeline?: object[], options?: CollectionAggregationOptions) {
    return this._collection.aggregate(pipeline, options).toArray()
  }
  public async bulkWrite(operations: object[], options?: CollectionBulkWriteOptions) {
    return this._collection.bulkWrite(operations, options)
  }
  public async countDocuments(query?: FilterQuery<T>, options?: MongoCountPreferences) {
    return this._collection.countDocuments(query, options)
  }
  public async createIndex(fieldOrSpec: string | any, options?: IndexOptions) {
    return this._collection.createIndex(fieldOrSpec, options)
  }
  public async createIndexes(indexSpecs: IndexSpecification[], options?: { session?: ClientSession }) {
    return this._collection.createIndexes(indexSpecs, options)
  }
  public distinct(
    key: string,
    query: FilterQuery<T>,
    options?: { readPreference?: ReadPreference | string; maxTimeMS?: number; session?: ClientSession }
  ) {
    return this._collection.distinct(key, query, options)
  }
  public async drop(options?: { session: ClientSession }) {
    return this._collection.drop(options)
  }
  public async dropIndex(indexName: string, options?: CommonOptions & { maxTimeMS?: number }) {
    return this._collection.dropIndex(indexName, options)
  }
  public async dropIndexes(options?: { session?: ClientSession; maxTimeMS?: number }) {
    return this._collection.dropIndexes(options)
  }
  public async estimatedDocumentCount(query?: FilterQuery<T>, options?: MongoCountPreferences) {
    return this._collection.estimatedDocumentCount(query, options)
  }
  public async geoHaystackSearch(x: number, y: number, options?: GeoHaystackSearchOptions) {
    return this._collection.geoHaystackSearch(x, y, options)
  }
  public async indexes(options?: { session: ClientSession }) {
    return this._collection.indexes(options)
  }
  public async indexExists(indexes: string | string[], options?: { session: ClientSession }) {
    return this._collection.indexExists(indexes, options)
  }
  public async indexInformation(options?: { full: boolean; session: ClientSession }) {
    return this._collection.indexInformation(options)
  }
  public initializeOrderedBulkOp(options?: CommonOptions) {
    return this._collection.initializeOrderedBulkOp(options)
  }
  public initializeUnorderedBulkOp(options: CommonOptions) {
    return this._collection.initializeUnorderedBulkOp(options)
  }
  public async isCapped(options?: { session: ClientSession }) {
    return this._collection.isCapped(options)
  }
  public async listIndexes(options?: {
    batchSize?: number
    readPreference?: ReadPreference | string
    session?: ClientSession
  }) {
    return this._collection.listIndexes(options)
  }
  public async mapReduce(
    map: CollectionMapFunction | string,
    reduce: CollectionReduceFunction | string,
    options?: MapReduceOptions
  ) {
    return this._collection.mapReduce(map, reduce, options)
  }
  public async options(options?: { session: ClientSession }) {
    return this._collection.options(options)
  }
  public async parallelCollectionScan(options?: ParallelCollectionScanOptions) {
    return this._collection.parallelCollectionScan(options)
  }
  public async reIndex(options?: { session: ClientSession }) {
    return this._collection.reIndex(options)
  }
  public async rename(newName: string, options?: { dropTarget?: boolean; session?: ClientSession }) {
    return this._collection.rename(newName, options)
  }
  public async replaceOne(filter: FilterQuery<T>, doc: T, options?: ReplaceOneOptions) {
    return this._collection.replaceOne(filter, doc, options)
  }
  public async stats(options?: { scale: number; session?: ClientSession }) {
    return this._collection.stats(options)
  }
  public watch(
    pipeline?: object[],
    options?: ChangeStreamOptions & { startAtClusterTime?: Timestamp; session?: ClientSession }
  ) {
    return this._collection.watch(pipeline, options)
  }
  protected loadSchema(model: Constructor<T>) {
    this._collectionMetadata = Reflect.getMetadata(MetadataKey.COLLECTION, model.prototype)
    return this._collectionMetadata.schema
  }
}
