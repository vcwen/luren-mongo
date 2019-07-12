import _ from 'lodash'
import { LurenQueryExecutor } from 'luren'
import { deserialize, IJsSchema, normalizeSimpleSchema, serialize } from 'luren-schema'
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
import { DataSource } from './DataSource'
import { MongoSchemaMetadata } from './decorators/MongoSchema'
import { RelationMetadata } from './decorators/Relation'
import { MongoDataTypes } from './lib/MongoDataTypes'
import { Constructor, IFindOptions } from './types'

const deserializeDocument = <T = any>(doc: any, defaultSchema: IJsSchema, options?: IFindOptions<T>) => {
  if (options && options.deserialize === false) {
    return doc
  }
  let schema = defaultSchema
  if (options) {
    if (options.schema) {
      schema = options.schema
    }
    if (options.type) {
      ;[schema] = normalizeSimpleSchema(options.type)
    }
  }
  return deserialize(schema, doc, MongoDataTypes)
}

const join = async (dataSource: DataSource, model: Constructor, prop: string, obj: object, options: IFindOptions) => {
  const relation: RelationMetadata | undefined = Reflect.getMetadata(MetadataKey.RELATION, model.prototype, prop)
  if (relation) {
    const qe = await dataSource.getQueryExecutor(relation.target)
    const val = Reflect.get(obj, relation.localField)
    let res: any
    switch (relation.type) {
      case 'hasOne':
      case 'belongsTo':
        res = await qe.findOne({ [relation.foreignField]: val })
        break
      case 'hasMany':
        res = await qe.find({ [relation.foreignField]: val })
        break
    }
    if (!_.isEmpty(res)) {
      if (Array.isArray(res)) {
        for (const item of res) {
          Reflect.set(obj, prop, deserializeDocument(item, 'targe_schema' as any, options))
        }
      } else {
        Reflect.set(obj, prop, deserializeDocument(res, 'targe_schema' as any, options))
      }
    }
  } else {
    throw new Error(`No relation for property: ${prop} of ${model.name}`)
  }
}

export class QueryExecutor<T extends object> extends LurenQueryExecutor<T> {
  protected _dataSource: DataSource
  private _collection!: Collection<T>
  constructor(model: Constructor<T>, collection: Collection<any>, dataSource: DataSource) {
    super(model)
    this._collection = collection
    this._dataSource = dataSource
  }
  public async insertOne(obj: T) {
    return this._collection.insertOne(serialize(this._schema, obj, MongoDataTypes))
  }
  public async insertMany(...objects: T[]) {
    return this._collection.insertMany(objects.map((item) => serialize(this._schema, item, MongoDataTypes)))
  }
  public async findOne<TSchema = T>(filter: FilterQuery<T>, options?: IFindOptions<T>): Promise<TSchema | undefined> {
    const res = await this._collection.findOne(filter, options)
    if (res) {
      const obj = deserializeDocument(res, this._schema, options)
      if (options && options.relation) {
        const relations = Array.isArray(options.relation) ? options.relation : [options.relation]
        for (const prop of relations) {
          join(this._dataSource, this._modelConstructor, prop as any, obj, options)
        }
      }
      return obj
    } else {
      return undefined
    }
  }
  public async find<TSchema = T>(filter: FilterQuery<T>, options?: IFindOptions<T>): Promise<TSchema[]> {
    const res = await this._collection.find(filter, options).toArray()
    return res.map((item) => deserializeDocument(item, this._schema, options))
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
  public async aggregate<TSchema = any>(
    pipeline?: object[],
    options?: CollectionAggregationOptions
  ): Promise<TSchema[]> {
    const result = await this._collection.aggregate<TSchema>(pipeline, options).toArray()
    return result
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
    map: CollectionMapFunction<any> | string,
    reduce: CollectionReduceFunction<any, any> | string,
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
    const mongoSchema: MongoSchemaMetadata | undefined = Reflect.getMetadata(MetadataKey.MONGO_SCHEMA, model.prototype)
    if (mongoSchema) {
      return mongoSchema.schema
    } else {
      throw new Error(`No mongo schema for:${model.name}`)
    }
  }
}
