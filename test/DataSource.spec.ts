import { Set } from 'immutable'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { QueryExecutor } from '../src'
import { DataSource } from '../src/DataSource'
import { Collection } from '../src/decorators/Collection'
import { Field } from '../src/decorators/Field'
import { Index } from '../src/decorators/Index'
import { MongoClient } from 'mongodb'

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
    mongoServer.stop()
  }
})

afterEach(async () => {
  if (dataSource) {
    await dataSource.disconnect()
  }
})

jest.mock('mongodb')

describe('DataSource', () => {
  describe('constructor', () => {
    it('should create the instance with default options', async () => {
      ;(MongoClient as any).disableMock = false
      dataSource = new DataSource({ database: 'luren' })
      dataSource.connect()
      expect(dataSource).toEqual(
        expect.objectContaining({
          _connectUri: 'mongodb://localhost:27017',
          _database: 'luren'
        })
      )
    })
    it('should create the instance with url', async () => {
      ;(MongoClient as any).disableMock = false
      dataSource = new DataSource({ uri: 'mongodb://localhost:27017/luren', autoConnect: true })
      expect(dataSource).toEqual(
        expect.objectContaining({
          _connectUri: 'mongodb://localhost:27017/luren',
          _database: 'luren'
        })
      )
    })
    it('should create the instance with host & port', async () => {
      ;(MongoClient as any).disableMock = false
      dataSource = new DataSource({ host: 'localhost', port: 27017, database: 'luren' })
      dataSource.connect()
      expect(dataSource).toEqual(
        expect.objectContaining({
          _connectUri: 'mongodb://localhost:27017',
          _database: 'luren'
        })
      )
    })
    it('should set user & password for mongo auth', async () => {
      ;(MongoClient as any).disableMock = false
      const dbName = 'luren' + Date.now()
      dataSource = new DataSource({ host: 'localhost', port: 27017, database: dbName, user: 'foo', password: 'bar' })
      dataSource.connect()
      expect(dataSource).toEqual(
        expect.objectContaining({
          _connectOptions: {
            host: 'localhost',
            port: 27017,
            database: dbName,
            user: 'foo',
            password: 'bar'
          }
        })
      )
    })
  })
  describe('register', () => {
    it('should register model', async () => {
      ;(MongoClient as any).disableMock = true
      const uri = await mongoServer.getConnectionString()
      dataSource = new DataSource({ uri })
      dataSource.connect()
      await dataSource.register(Person)
      expect(Reflect.get(dataSource, '_models')).toEqual(Set().add(Person))
    })
    it('should not be added again if model is already registered', async () => {
      ;(MongoClient as any).disableMock = true
      const uri = await mongoServer.getConnectionString()
      dataSource = new DataSource({ uri, autoConnect: true })
      const models = Reflect.get(dataSource, '_models')
      await dataSource.register(Person)
      const addFn = jest.fn()
      models.add = addFn
      const res = await dataSource.register(Person)
      expect(res).toBeTruthy()
      expect(addFn).toBeCalledTimes(0)
    })
    it('should not register model if no collection metadata is available', async () => {
      ;(MongoClient as any).disableMock = true
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
      ;(MongoClient as any).disableMock = true
      dataSource = new DataSource()
      dataSource.connect()
      expect(dataSource.register(Person)).rejects.toThrowError('No valid database for Person')
    })
  })
  describe('getQueryExecutor', () => {
    it('should return the query executor for the model', async () => {
      ;(MongoClient as any).disableMock = true
      const uri = await mongoServer.getConnectionString()
      dataSource = new DataSource({ uri })
      dataSource.connect()
      const qe = await dataSource.getQueryExecutor(Person)
      expect(qe).toBeInstanceOf(QueryExecutor)
    })
    it('should throw error if database is not known', async () => {
      ;(MongoClient as any).disableMock = false
      dataSource = new DataSource()
      dataSource.connect()
      // tslint:disable-next-line: max-classes-per-file
      class Foo {
        // empty class
      }
      expect(dataSource.getQueryExecutor(Foo)).rejects.toThrow('class Foo has not been bound to a collection')
    })
    it('should throw error if database is not known', async () => {
      ;(MongoClient as any).disableMock = false
      dataSource = new DataSource()
      dataSource.connect()
      // tslint:disable-next-line: max-classes-per-file
      @Collection()
      class Bar {
        // empty class
      }
      expect(dataSource.getQueryExecutor(Bar)).rejects.toThrow('database name is required')
    })
  })
})
