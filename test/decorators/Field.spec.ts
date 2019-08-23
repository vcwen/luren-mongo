import { List, Map } from 'immutable'
import 'reflect-metadata'
import { Field, FieldMetadata, Id, MetadataKey, NotField } from '../../src'

describe('Field', () => {
  it('should define field metadata', () => {
    class TestController {
      @Field()
      public name!: string
      @Field({ schema: { type: 'number' } })
      public foo?: number
    }
    const ctrl = new TestController()
    const props: Map<string, FieldMetadata> = Reflect.getMetadata(MetadataKey.FIELDS, ctrl)
    expect(props.get('name')).toEqual(
      expect.objectContaining({
        required: true,
        schema: expect.objectContaining({ type: 'string' })
      })
    )
    expect(props.get('foo')).toEqual({
      required: true,
      schema: { type: 'number' }
    })
  })

  it('should return decorator function when schema options is set', () => {
    // tslint:disable-next-line:max-classes-per-file
    class TestController {
      @Field({ required: true, type: 'number' })
      public name!: string
    }
    const props: Map<string, FieldMetadata> = Reflect.getMetadata(MetadataKey.FIELDS, TestController.prototype)
    expect(props.get('name')).toEqual(
      expect.objectContaining({
        required: true,
        schema: expect.objectContaining({
          type: 'number'
        })
      })
    )
  })
})

describe('Id', () => {
  it('should do just like Field decorator', () => {
    const target = {}
    Id({ type: 'number', default: 1 })(target, 'foo')
    const props: Map<string, FieldMetadata> = Reflect.getMetadata(MetadataKey.FIELDS, target)
    expect(props.get('foo')).toEqual({
      required: true,
      schema: { type: 'number', default: 1 }
    })
  })
})
describe('NotField', () => {
  it('should add ignored props', () => {
    const target = {}
    NotField()(target, 'foo')
    const props: List<string> = Reflect.getMetadata(MetadataKey.IGNORED_PROPS, target)
    expect(props.toArray()).toEqual(['foo'])
  })
})
