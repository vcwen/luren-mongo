import { List } from 'immutable'
import { CompoundIndex, Index, IndexMetadata, MetadataKey } from '../../src'

describe('Index', () => {
  it('should create index metadata', () => {
    const target = {}
    Index()(target, 'foo')
    const indexes: List<IndexMetadata> = Reflect.getMetadata(MetadataKey.INDEX, target)
    expect(indexes.toArray()).toContainEqual({
      fields: { foo: 1 }
    })
  })
  it('should create index metadata with options', () => {
    const target = {}
    Index({ name: 'foo_index', spec: -1 })(target, 'foo')
    Index({ name: 'bar_index' })(target, 'bar')
    const indexes: List<IndexMetadata> = Reflect.getMetadata(MetadataKey.INDEX, target)
    expect(indexes.toArray()).toContainEqual({
      fields: { foo: -1 },
      options: { name: 'foo_index', spec: -1 }
    })
    expect(indexes.toArray()).toContainEqual({
      fields: { bar: 1 },
      options: { name: 'bar_index' }
    })
  })
})

describe('CompoundIndex', () => {
  it('should create index metadata', () => {
    class Test {}
    CompoundIndex({ foo: 1, bar: -1 })(Test)
    const indexes: List<IndexMetadata> = Reflect.getMetadata(MetadataKey.INDEX, Test.prototype)
    expect(indexes.toArray()).toContainEqual({
      fields: { foo: 1, bar: -1 }
    })
  })
  it('should create index metadata with options', () => {
    // tslint:disable-next-line: max-classes-per-file
    class Test {}
    CompoundIndex({ foo: 1, bar: -1 }, { unique: true })(Test)
    const indexes: List<IndexMetadata> = Reflect.getMetadata(MetadataKey.INDEX, Test.prototype)
    expect(indexes.toArray()).toContainEqual({
      fields: { foo: 1, bar: -1 },
      options: { unique: true }
    })
  })
  it('should throw error when there is only one field', () => {
    // tslint:disable-next-line: max-classes-per-file
    class Test {}
    expect(() => {
      CompoundIndex({ foo: 1 }, { unique: true })(Test)
    }).toThrowError()
  })
})
