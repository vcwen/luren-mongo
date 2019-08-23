import _ from 'lodash'
import { LurenQueryExecutor } from 'luren'
import { IJsSchema } from 'luren-schema'
import {
  ChangeStreamOptions,
  ClientSession,
  Collection,
  CollectionAggregationOptions,
  CollectionBulkWriteOptions,
  CollectionInsertManyOptions,
  CollectionInsertOneOptions,
  CollectionMapFunction,
  CollectionReduceFunction,
  CommonOptions,
  FilterQuery,
  FindAndModifyWriteOpResultObject,
  GeoHaystackSearchOptions,
  IndexOptions,
  IndexSpecification,
  MapReduceOptions,
  MongoCountPreferences,
  ParallelCollectionScanOptions,
  ReadPreference,
  ReplaceOneOptions,
  Timestamp,
  UpdateManyOptions,
  UpdateOneOptions,
  UpdateQuery
} from 'mongodb'
import { RelationType } from './constants'
import { MetadataKey } from './constants'
import { DataSource } from './DataSource'
import { CollectionMetadata } from './decorators/Collection'
import { MongoSchemaMetadata } from './decorators/MongoSchema'
import { RelationMetadata } from './decorators/Relation'
import MongoTypes from './lib/MongoTypes'
import { debug, mongoConvertSimpleTypeToJsSchema } from './lib/utils'
import {
  Constructor,
  IDeserializeOptions,
  IFindOneAndDeleteOptions,
  IFindOneAndReplaceOptions,
  IFindOneAndUpdateOptions,
  IFindOptions
} from './types'

const deserializeDocument = (doc: any, options?: IDeserializeOptions, defaultSchema?: IJsSchema) => {
  options = options || {}
  if (options.deserialize === false) {
    return doc
  }
  let schema = defaultSchema
  if (options.schema) {
    schema = options.schema
  } else if (options.type) {
    ;[schema] = mongoConvertSimpleTypeToJsSchema(options.type)
  }
  if (schema) {
    return MongoTypes.deserialize(doc, schema)
  } else {
    return doc
  }
}

const join = (relation: RelationMetadata, prop: string) => {
  const collection: CollectionMetadata | undefined = Reflect.getOwnMetadata(
    MetadataKey.COLLECTION,
    relation.target.prototype
  )
  if (!collection) {
    throw new Error(`Target:${relation.target.name} is not an valid collection`)
  }
  const pipeline: any[] = []
  const lookup = {
    $lookup: {
      from: relation.target.name,
      localField: relation.localField,
      foreignField: relation.foreignField,
      as: prop
    }
  }
  pipeline.push(lookup)
  if (relation.type === RelationType.ONE_TO_ONE) {
    pipeline.push({ $unwind: '$' + prop })
  }
  return pipeline
}

export class QueryExecutor<T extends object> extends LurenQueryExecutor<T> {
  protected _dataSource: DataSource
  private _collection!: Collection<T>
  constructor(model: Constructor<T>, collection: Collection<any>, dataSource: DataSource) {
    super(model)
    this._collection = collection
    this._dataSource = dataSource
  }
  public async insertOne(obj: T, options?: CollectionInsertOneOptions) {
    const doc = MongoTypes.serialize(obj, this._schema)
    debug(`${this._collection.collectionName}.insertOne(%o)`, doc)
    return this._collection.insertOne(doc, options)
  }
  public async insertMany(objects: T[], options?: CollectionInsertManyOptions) {
    const docs = objects.map((item) => MongoTypes.serialize(item, this._schema))
    debug(`${this._collection.collectionName}.insertOne(%o, %o)`, docs, options)
    return this._collection.insertMany(docs, options)
  }
  public async findOne<TSchema = T>(filter: FilterQuery<T>, options?: IFindOptions<T>): Promise<TSchema | undefined> {
    if (options && options.lookup) {
      const pipeline: any[] = []
      const match = { $match: filter }
      pipeline.push(match)
      const relations = Array.isArray(options.lookup) ? options.lookup : [options.lookup]
      for (const prop of relations) {
        const relation: RelationMetadata | undefined = Reflect.getMetadata(
          MetadataKey.RELATION,
          this._modelConstructor.prototype,
          prop as any
        )
        if (!relation) {
          throw new Error(`No relation for property: ${prop} of ${this._modelConstructor.name}`)
        }
        const lookupPipeline = join(relation, prop as string)
        pipeline.push(...lookupPipeline)
      }
      debug(`${this._collection.collectionName}.aggregate(%o)`, pipeline)
      const res = await this._collection.aggregate(pipeline).toArray()
      if (res.length > 0) {
        return deserializeDocument(res[0], options, this._schema)
      } else {
        return undefined
      }
    } else {
      debug(`${this._collection.collectionName}.findOne(%o, %o)`, filter, options)
      const res = await this._collection.findOne(filter, options)
      if (res) {
        const obj = deserializeDocument(res, options, this._schema)
        return obj
      } else {
        return undefined
      }
    }
  }
  public async find<TSchema = T>(filter: FilterQuery<T>, options?: IFindOptions<T>): Promise<TSchema[]> {
    if (options && options.lookup) {
      const pipeline: any[] = []
      const match = { $match: filter }
      pipeline.push(match)
      const relations = Array.isArray(options.lookup) ? options.lookup : [options.lookup]
      for (const prop of relations) {
        const relation: RelationMetadata | undefined = Reflect.getMetadata(
          MetadataKey.RELATION,
          this._modelConstructor.prototype,
          prop as any
        )
        if (!relation) {
          throw new Error(`No relation for property: ${prop} of ${this._modelConstructor.name}`)
        }
        const lookupPipeline = join(relation, prop as string)
        pipeline.push(...lookupPipeline)
      }
      debug(`${this._collection.collectionName}.aggregate(%o)`, pipeline)
      const res = await this._collection.aggregate(pipeline).toArray()
      return res.map((item) => deserializeDocument(item, options, this._schema))
    } else {
      debug(`${this._collection.collectionName}.find(%o, %o)`, filter, options)
      const res = await this._collection.find(filter, options).toArray()
      return res.map((item) => deserializeDocument(item, options, this._schema))
    }
  }
  public async updateOne(filter: FilterQuery<T>, update: UpdateQuery<T>, options?: UpdateOneOptions) {
    return this._collection.updateOne(filter, update, options)
  }
  public async updateMany(filter: FilterQuery<T>, update: UpdateQuery<T>, options?: UpdateManyOptions) {
    return this._collection.updateMany(filter, update, options)
  }

  public async deleteOne(filter: FilterQuery<T>, options?: CommonOptions & { bypassDocumentValidation?: boolean }) {
    return this._collection.deleteOne(filter, options)
  }
  public async deleteMany(filter: FilterQuery<T>, options?: CommonOptions) {
    return this._collection.deleteMany(filter, options)
  }
  public async findOneAndDelete<TSchema = T>(
    filter: FilterQuery<T>,
    options?: IFindOneAndDeleteOptions
  ): Promise<FindAndModifyWriteOpResultObject<TSchema>> {
    const res = await this._collection.findOneAndDelete(filter, options)
    res.value = deserializeDocument(res.value, options, this._schema)
    return res as any
  }
  public async findOneAndReplace<TSchema = T>(
    filter: FilterQuery<T>,
    replacement: object,
    options?: IFindOneAndReplaceOptions
  ): Promise<FindAndModifyWriteOpResultObject<TSchema>> {
    const res = await this._collection.findOneAndReplace(filter, replacement, options)
    res.value = deserializeDocument(res.value, options, this._schema)
    return res as any
  }
  public async findOneAndUpdate<TSchema = T>(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options?: IFindOneAndUpdateOptions
  ): Promise<FindAndModifyWriteOpResultObject<TSchema>> {
    const res = await this._collection.findOneAndUpdate(filter, update, options)
    res.value = deserializeDocument(res.value, options, this._schema)
    return res as any
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
    const mongoSchema: MongoSchemaMetadata | undefined = Reflect.getOwnMetadata(
      MetadataKey.MONGO_SCHEMA,
      model.prototype
    )
    if (mongoSchema) {
      return mongoSchema.schema
    } else {
      throw new Error(`No mongo schema for:${model.name}`)
    }
  }
}
