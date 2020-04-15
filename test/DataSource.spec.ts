import { Map, Set } from 'immutable'
// import { getDatabase } from '../src/lib/utils'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { QueryExecutor } from '../src'
import { DataSource } from '../src/DataSource'
import { Collection } from '../src/decorators/Collection'
import { Field } from '../src/decorators/Field'
import { Index } from '../src/decorators/Index'

const TIMEOUT = 600000
jasmine.DEFAULT_TIMEOUT_INTERVAL = TIMEOUT

let mongoServer: MongoMemoryServer
let dataSource: DataSource

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
  if (dataSource) {
    await dataSource.disconnect()
  }
})

describe('DataSource', () => {
  describe('constructor', () => {
    it('should create the instance with default options', async () => {
      dataSource = new DataSource({ database: 'luren' })
      expect(dataSource).toEqual({
        _clientPromise: expect.any(Promise),
        _connectUri: 'mongodb://localhost:27017',
        _database: 'luren',
        _models: Set(),
        _queryExecutors: Map()
      })
    })
    it('should create the instance with url', async () => {
      dataSource = new DataSource({ uri: 'mongodb://localhost:27017/luren' })
      expect(dataSource).toEqual({
        _clientPromise: expect.any(Promise),
        _connectUri: 'mongodb://localhost:27017/luren',
        _database: 'luren',
        _models: Set(),
        _queryExecutors: Map()
      })
    })
    it('should create the instance with host & port', async () => {
      dataSource = new DataSource({ host: 'localhost', port: 27017, database: 'luren' })
      expect(dataSource).toEqual({
        _clientPromise: expect.any(Promise),
        _connectUri: 'mongodb://localhost:27017',
        _database: 'luren',
        _models: Set(),
        _queryExecutors: Map()
      })
    })
    it('should set user & password for mongo auth', async () => {
      const dbName = 'luren' + Date.now()

      dataSource = new DataSource({ host: 'localhost', port: 27017, database: dbName, user: 'foo', password: 'bar' })
      expect(dataSource).toEqual({
        _clientPromise: expect.any(Promise),
        _connectUri: 'mongodb://localhost:27017',
        _database: dbName,
        _models: Set(),
        _queryExecutors: Map()
      })
    })
  })
  describe('register', () => {
    it('should register model', async () => {
      const uri = await mongoServer.getConnectionString()
      dataSource = new DataSource({ uri })
      await dataSource.register(Person)
      expect(Reflect.get(dataSource, '_models')).toEqual(Set().add(Person))
    })
    it('should not be added again if model is already registered', async () => {
      const uri = await mongoServer.getConnectionString()
      dataSource = new DataSource({ uri })
      const models = Reflect.get(dataSource, '_models')
      await dataSource.register(Person)
      const addFn = jest.fn()
      models.add = addFn
      const res = await dataSource.register(Person)
      expect(res).toBeTruthy()
      expect(addFn).toBeCalledTimes(0)
    })
    it('should not register model if no collection metadata is available', async () => {
      const uri = await mongoServer.getConnectionString()
      dataSource = new DataSource({ uri })
      // tslint:disable-next-line: max-classes-per-file
      class Some {
        // empty class
      }
      const res = await dataSource.register(Some)
      expect(res).toBeFalsy()
    })
    it('should throw an error if model does not have collection info', async () => {
      dataSource = new DataSource()
      expect(dataSource.register(Person)).rejects.toThrowError('No valid database for Person')
    })
  })
  describe('getQueryExecutor', () => {
    it('should return the query executor for the model', async () => {
      const uri = await mongoServer.getConnectionString()
      dataSource = new DataSource({ uri })
      const qe = await dataSource.getQueryExecutor(Person)
      expect(qe).toBeInstanceOf(QueryExecutor)
    })
    it('should throw error if database is not known', async () => {
      dataSource = new DataSource()
      // tslint:disable-next-line: max-classes-per-file
      class Foo {
        // empty class
      }
      expect(dataSource.getQueryExecutor(Foo)).rejects.toThrow('class Foo has not been bound to a collection')
    })
    it('should throw error if database is not known', async () => {
      dataSource = new DataSource()
      // tslint:disable-next-line: max-classes-per-file
      @Collection()
      class Bar {
        // empty class
      }
      expect(dataSource.getQueryExecutor(Bar)).rejects.toThrow('database name is required')
    })
  })
})
