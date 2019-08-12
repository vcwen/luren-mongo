import { Map } from 'immutable'
import 'reflect-metadata'
import { Field, FieldMetadata, MetadataKey } from '../../src'

describe('Field', () => {
  it('should define prop metadata', () => {
    class TestController {
      @Field()
      public name!: string
    }
    const ctrl = new TestController()
    const props: Map<string, FieldMetadata> = Reflect.getMetadata(MetadataKey.FIELDS, ctrl)
    expect(props.get('name')).toEqual(
      expect.objectContaining({
        name: 'name',
        required: true,
        schema: expect.objectContaining({ type: 'string' }),
        strict: false,
        private: false
      })
    )
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
        }),
        strict: false,
        private: false
      })
    )
  })
})
