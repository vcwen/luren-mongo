import { Map, Set } from 'immutable'
// import { getDatabase } from '../src/lib/utils'
import { AddUserOptions, connect } from 'mongodb'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { QueryExecutor } from '../src'
import { DataSource } from '../src/DataSource'
import { Collection } from '../src/decorators/Collection'
import { Field } from '../src/decorators/Field'
import { Index } from '../src/decorators/Index'

const TIMEOUT = 600000
jasmine.DEFAULT_TIMEOUT_INTERVAL = TIMEOUT

let mongoServer: MongoMemoryServer
let datasource: DataSource

@Collection({ validationOptions: { validationLevel: 'strict', validationAction: 'error' } })
class Person {
  @Field()
  @Index()
  public name!: string
}

beforeAll(async () => {
  mongoServer = new MongoMemoryServer({
    instance: { port: 27017, dbName: 'luren' },
    autoStart: false
  })
  return mongoServer.start()
})

afterAll(async () => {
  if (mongoServer) {
    await mongoServer.stop()
  }
})

afterEach(async () => {
  if (datasource) {
    await datasource.disconnect()
  }
})

describe('DataSource', () => {
  describe('constructor', () => {
    it('should create the instance with default options', async () => {
      datasource = new DataSource({ database: 'luren' })
      expect(datasource).toEqual({
        _clientPromise: expect.any(Promise),
        _connectUrl: 'mongodb://localhost:27017',
        _database: 'luren',
        _models: Set(),
        _queryExecutors: Map()
      })
    })
    it('should create the instance with url', async () => {
      datasource = new DataSource({ url: 'mongodb://localhost:27017/luren' })
      expect(datasource).toEqual({
        _clientPromise: expect.any(Promise),
        _connectUrl: 'mongodb://localhost:27017/luren',
        _database: 'luren',
        _models: Set(),
        _queryExecutors: Map()
      })
    })
    it('should create the instance with host & port', async () => {
      datasource = new DataSource({ host: 'localhost', port: 27017, database: 'luren' })
      expect(datasource).toEqual({
        _clientPromise: expect.any(Promise),
        _connectUrl: 'mongodb://localhost:27017',
        _database: 'luren',
        _models: Set(),
        _queryExecutors: Map()
      })
    })
    it('should set user & password for mongo auth', async () => {
      const dbName = 'luren'
      const mongoClient = await connect('mongodb://localhost:27017')
      await mongoClient
        .db('luren')
        .admin()
        .addUser('foo', 'bar', { roles: [{ role: 'readWrite', db: dbName }] } as AddUserOptions)
      await mongoClient.close()

      datasource = new DataSource({ host: 'localhost', port: 27017, database: dbName, user: 'foo', password: 'bar' })
      expect(datasource).toEqual({
        _clientPromise: expect.any(Promise),
        _connectUrl: 'mongodb://localhost:27017',
        _database: dbName,
        _models: Set(),
        _queryExecutors: Map()
      })
    })
  })
  describe('register', () => {
    it('should register model', async () => {
      datasource = new DataSource({ database: 'luren' })
      await datasource.register(Person)
      expect(Reflect.get(datasource, '_models')).toEqual(Set().add(Person))
    })
    it('should not be added again if model is already registered', async () => {
      datasource = new DataSource({ database: 'luren' })
      const models = Reflect.get(datasource, '_models')
      await datasource.register(Person)
      const addFn = jest.fn()
      models.add = addFn
      const res = await datasource.register(Person)
      expect(res).toBeTruthy()
      expect(addFn).toBeCalledTimes(0)
    })
    it('should throw an error if model does not have collection info', async () => {
      datasource = new DataSource({ database: 'luren' })
      // tslint:disable-next-line: max-classes-per-file
      class Some {
        // empty class
      }
      const res = await datasource.register(Some)
      expect(res).toBeFalsy()
    })
    it('should throw an error if model does not have collection info', async () => {
      datasource = new DataSource()
      expect(datasource.register(Person)).rejects.toThrowError('No valid database for Person')
    })
  })
  describe('getQueryExecutor', () => {
    it('should return the query executor for the model', async () => {
      datasource = new DataSource({ database: 'luren' })
      const qe = await datasource.getQueryExecutor(Person)
      expect(qe).toBeInstanceOf(QueryExecutor)
    })
    it('should throw error if database is not known', async () => {
      datasource = new DataSource()
      // tslint:disable-next-line: max-classes-per-file
      class Foo {
        // empty class
      }
      expect(datasource.getQueryExecutor(Foo)).rejects.toThrow('class Foo has not been bound to a collection')
    })
    it('should throw error if database is not known', async () => {
      datasource = new DataSource()
      // tslint:disable-next-line: max-classes-per-file
      @Collection()
      class Bar {
        // empty class
      }
      expect(datasource.getQueryExecutor(Bar)).rejects.toThrow('database name is required')
    })
  })
})
